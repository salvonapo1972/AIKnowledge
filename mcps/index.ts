import { tool } from 'ai';
import { z } from 'zod';
import { createClient } from 'contentful-management';

// Inizializza il client di Contentful nativo
const contentfulClient = createClient({
  accessToken: process.env.WRITE_ACCESS_TOKEN!,
}, { type: 'legacy' });

const getSpace = () => contentfulClient.getSpace(process.env.SPACE_ID!);

const getEnvironment = async () => {
  const space = await contentfulClient.getSpace(process.env.SPACE_ID!);
  // Sostituisci 'master' con process.env.CONTENTFUL_ENVIRONMENT se usi ambienti multipli
  return space.getEnvironment('master'); 
};

export const toolsContentfull = {
  // TOOL: Ottieni una singola entry
  get_entry: tool({
    description: "Recupera una singola entry specifica da Contentful usando il suo ID.",
    inputSchema: z.object({
      entryId: z.string().describe("L'ID univoco della entry di Contentful"),
    }),
    execute: async ({ entryId }) => {
      const space = await getSpace();
      const environment = await space.getEnvironment('master');
      const entry = await environment.getEntry(entryId);
      return entry;
    },
  }),

  // TOOL: Elenca le entry (Ricerca)
  list_entries: tool({
    description: "Cerca ed elenca le entry all'interno del CMS Contentful.",
    inputSchema: z.object({
      contentType: z.string().optional().describe("ID del Content Type (es. 'blogPost')"),
      limit: z.number().optional().default(10),
    }),
    execute: async ({ contentType, limit }) => {
      const space = await getSpace();
      const environment = await space.getEnvironment('master');
      const query: any = { limit };
      if (contentType) query['content_type'] = contentType;
      
      const entries = await environment.getEntries(query);
      return entries.items;
    },
  }),
  create_entry: tool({
    description: "Crea una nuova entry in Contentful (in stato di bozza). I campi (fields) devono seguire la struttura localizzata richiesta da Contentful (es. { nomeCampo: { 'en-US': 'valore' } }).",
    inputSchema: z.object({
      contentTypeId: z.string().describe("L'ID del Content Type da utilizzare (es. 'blogPost')"),
      fields: z.record(z.string(), z.any()).describe("Oggetto contenente i campi localizzati da salvare."),
    }),
    execute: async ({ contentTypeId, fields }) => {
      const environment = await getEnvironment();
      const entry = await environment.createEntry(contentTypeId, { fields });
      return {
        message: "Entry creata con successo in stato di bozza.",
        entryId: entry.sys.id,
        entry: entry,
      };
    },
  }),

  // 2. TOOL PER AGGIORNARE UNA ENTRY
  update_entry: tool({
    description: "Aggiorna i campi di una entry esistente in Contentful. Sovrascrive o aggiunge i campi specificati. Mantiene lo stato di bozza finché non viene pubblicata.",
    inputSchema: z.object({
      entryId: z.string().describe("L'ID univoco della entry da modificare"),
      fields: z.record(z.string(), z.any()).describe("I campi aggiornati localizzati da unire o sovrascrivere."),
    }),
    execute: async ({ entryId, fields }) => {
      const environment = await getEnvironment();
      // Recupera la versione più recente della entry (necessario per il controllo del versionamento ottimistico di Contentful)
      const entry = await environment.getEntry(entryId);
      
      // Aggiorna i campi unendo quelli nuovi
      entry.fields = {
        ...entry.fields,
        ...fields,
      };

      const updatedEntry = await entry.update();
      return {
        message: "Entry aggiornata con successo.",
        entryId: updatedEntry.sys.id,
        version: updatedEntry.sys.version,
      };
    },
  }),

  // 3. TOOL PER CANCELLARE UNA ENTRY
  delete_entry: tool({
    description: "Rimuove definitivamente una entry da Contentful. Se la entry è pubblicata, viene prima depubblicata automaticamente e poi eliminata.",
    inputSchema: z.object({
      entryId: z.string().describe("L'ID univoco della entry da eliminare"),
    }),
    execute: async ({ entryId }) => {
      const environment = await getEnvironment();
      const entry = await environment.getEntry(entryId);

      // Se la entry è attualmente pubblicata, va prima depubblicata (unpublish)
      if (entry.isPublished()) {
        await entry.unpublish();
      }

      await entry.delete();
      return {
        message: `Entry con ID ${entryId} eliminata correttamente.`,
        success: true,
      };
    },
  }),

  // 4. BONUS: TOOL PER PUBBLICARE UNA ENTRY
  publish_entry: tool({
    description: "Rende pubblica (visibile nelle API di delivery) una entry creata o aggiornata in precedenza.",
    inputSchema: z.object({
      entryId: z.string().describe("L'ID univoco della entry da pubblicare"),
    }),
    execute: async ({ entryId }) => {
      const environment = await getEnvironment();
      const entry = await environment.getEntry(entryId);
      const publishedEntry = await entry.publish();
      return {
        message: "Entry pubblicata con successo.",
        entryId: publishedEntry.sys.id,
      };
    },
  }),
};
