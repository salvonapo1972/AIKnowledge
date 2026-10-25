

import {
  streamText,
  UIMessage,
  convertToModelMessages,
  tool,
  isStepCount,
  createUIMessageStreamResponse,
  toUIMessageStream,
  embed,
} from 'ai';
import fs from 'fs/promises';
import { date, z } from 'zod';
import { openai } from '@ai-sdk/openai';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { getWeather } from "../../lib/weather";
import { getCoordinates } from "../../lib/cities";
import { getTimezone } from '@/app/lib/timezones';
import { db } from '@/app/lib/db';
import { Octokit } from '@octokit/rest';
import { createGithubTools } from '@github-tools/sdk';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js'
import { createMCPClient } from '@ai-sdk/mcp';
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js';


import { tavily } from '@tavily/core';
import { getEarthQuakes } from '@/app/lib/earthquake';
import { getFarmacieTurno } from '@/app/lib/farmacieturno';
import { auth } from "@/auth";

const githubTools = createGithubTools({
  token: process.env.GITHUB_TOKEN,
  preset: ['repo-explorer', 'maintainer'],
  requireApproval: false
});

// Inizializza il client usando la tua chiave API di Tavily
const client = tavily({
  apiKey: process.env.TAVILY_API_KEY
});



const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
});

const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY,
});

function formatTime(time: number | string): string {
  return new Date(time).toISOString();
}

// Funzioni di utilità per gestire le date
const calcolaGiorni = (i: string, f: string) =>
  Math.ceil((new Date(f).getTime() - new Date(i).getTime()) / (1000 * 60 * 60 * 24));

const trovaMetaData = (i: string, f: string) => {
  const metaTime = new Date(i).getTime() + (new Date(f).getTime() - new Date(i).getTime()) / 2;
  return new Date(metaTime).toISOString().split('T')[0];
};

function convertTime(date: string | Date, timeZone: string): string {
  return new Date(date).toLocaleString("it-IT", {
    timeZone,
    dateStyle: "full",
    timeStyle: "medium"
  });
}
const fileContent = await fs.readFile(process.cwd() + '/app/elenco_canti.md', 'utf8');


export async function POST(req: Request) {

   const session = await auth();
  
  // Verifica se l'utente è loggato ed è l'amministratore ufficiale
  const isMe = session?.user?.email === process.env.ADMIN_EMAIL;
  
  /*const transport = new StdioClientTransport({
    command: 'npx',
    args: ['-y', '@contentful/mcp-server'],
    env: {
      CONTENTFUL_MANAGEMENT_ACCESS_TOKEN: process.env.WRITE_ACCESS_TOKEN!,
      SPACE_ID: process.env.SPACE_ID!,
      ENVIRONMENT_ID: 'master',
      PATH: process.env.PATH ?? '', // Indispensabile per far trovare npx a Node.js
    },
  });*/
/*
const transport = new SSEClientTransport(
  new URL("https://mcp.contentful.com/mcp"),
  {
    requestInit: {
      headers: {
        // 1. Specifica il tipo di contenuto
        "Content-Type": "application/json",
        
        // 2. Passa il token di autorizzazione di Contentful (CMA Token)
        "Authorization": `Bearer ${process.env.WRITE_ACCESS_TOKEN}`,
        
        // 3. Comunica al server l'ID dello spazio e dell'ambiente su cui operare
        "X-Contentful-Space-Id": process.env.SPACE_ID!,
        "X-Contentful-Environment-Id": "master"
      }
    }
  }
);
*/
  // 2. Crea il client MCP
  console.log("isMe",isMe)
/*  const mcpClientContentful = await createMCPClient({ transport });
  const contentfulTools = (isMe)?await mcpClientContentful.tools():({});*/

  const { messages, coordinates, voiceEnabled } = await req.json();

  //console.log("Coordinate da metadati:", coordinates);
  const today = new Date()


  const systemPrompt = `Oggi è ${today.toISOString()} e l'utente si trova a: latitudine ${coordinates?.lat} e longitudine ${coordinates?.lng}.
${voiceEnabled ? "L'utente sta parlando a voce. Rispondi in modo estremamente conciso, colloquiale e naturale, evitando elenchi puntati lunghi o Markdown complesso. Per qualsiasi operazione " +
      "richiesta sui repository devi  utilizzare esclusivamente githubTools. Se ci sono errori su github devi mostrarli a video nella risposta. Per richieste di creazione contenuti usa il tool mcpClientContentful" : ""}`;



  const result = streamText({
    model: openai('gpt-6-luna'),
    messages: await convertToModelMessages(messages),
    system: systemPrompt,
    stopWhen: isStepCount(20),
    experimental_telemetry: {
      isEnabled: false,
      recordInputs: false,
      recordOutputs: false
    },
    tools: {
      ...(isMe?githubTools:({})),
    //  ...(isMe?contentfulTools:({})),
      deleteFileFromGitHub: tool({
        description: 'Elimina definitivamente un file specifico da un repository GitHub.',
        inputSchema: z.object({
          owner: z.string().describe('Il proprietario del repository (username o organizzazione).'),
          repo: z.string().describe('Il nome del repository.'),
          path: z.string().describe('Il percorso del file da eliminare (es. test1.md).'),
          branch: z.string().optional().default('main').describe('La branca da cui eliminare il file.'),
        }),
        execute: async ({ owner, repo, path, branch }) => {
          try {
            // 1. Recupera lo SHA corrente del file (GitHub lo richiede per confermare l'eliminazione)
            const { data: fileData } = await octokit.repos.getContent({
              owner,
              repo,
              path,
              ref: branch,
            });

            if (Array.isArray(fileData) || fileData.type !== 'file') {
              throw new Error('Il percorso specificato non corrisponde a un file valido.');
            }

            // 2. Esegui la cancellazione effettiva passandogli lo SHA trovato
            await octokit.repos.deleteFile({
              owner,
              repo,
              path,
              message: `chore: delete ${path} via AI Agent`,
              sha: fileData.sha,
              branch,
            });

            return {
              success: true,
              message: `Il file ${path} è stato eliminato con successo.`,
            };
          } catch (error: any) {
            return {
              success: false,
              error: error.message || 'Impossibile eliminare il file. Verifica che esista.',
            };
          }
        },
      }),
      listIssues: tool({
        description: 'Recupera la lista delle issue da una specifica repository di GitHub.',
        inputSchema: z.object({
          owner: z.string().describe('Il proprietario della repository o organizzazione GitHub.'),
          repo: z.string().describe('Il nome del repository.'),
          state: z.enum(['open', 'closed', 'all']).optional().default('open').describe('Lo stato delle issue da cercare.'),
        }),
        execute: async ({ owner, repo, state }) => {
          console.log('owner', owner);
          console.log('repo', repo);
          const { data } = await octokit.issues.listForRepo({
            owner,
            repo,
            state,
            per_page: 5,
          });

          return data.map(issue => ({
            id: issue.id,
            number: issue.number,
            title: issue.title,
            state: issue.state,
            body: issue.body,
          }));
        },
      }),

      // TOOL 2: Creazione di una nuova Issue
      createGitHubIssue: tool({
        description: 'Crea una nuova issue su una repository GitHub.',
        inputSchema: z.object({
          owner: z.string().describe('Il proprietario della repository.'),
          repo: z.string().describe('Il nome del repository.'),
          title: z.string().min(5).describe('Il titolo dell\'issue (almeno 5 caratteri).'),
          body: z.string().describe('La descrizione dettagliata del problema o del task.'),
          labels: z.array(z.string()).optional().describe('Etichette da assegnare all\'issue.'),
        }),
        execute: async ({ owner, repo, title, body, labels }) => {
          const { data } = await octokit.issues.create({
            owner,
            repo,
            title,
            body,
            labels,
          });

          return {
            success: true,
            issueNumber: data.number,
            url: data.html_url,
          };
        },
      }),
      closeGitHubIssue: tool({
        description: 'Crea una nuova issue su una repository GitHub.',
        inputSchema: z.object({
          owner: z.string().describe('Il proprietario del repository (username o organizzazione).'),
          repo: z.string().describe('Il nome del repository.'),
          issue_number: z.number().int().positive().describe('Il numero identificativo dell\'issue da chiudere (es. 42).'),
        }),
        execute: async ({ owner, repo, issue_number }) => {
          const { data } = await octokit.issues.update({
            owner,
            repo,
            issue_number,
            state: 'closed',
            state_reason: 'completed',
          });

          return {
            success: true,
            issueNumber: data.number,
            url: data.html_url,
          };
        },
      }),
      getCityFromCoordinates: tool({
        description: 'Converte le coordinate di latitudine e longitudine nel nome di una città reale. se non valorizzate trova la città in cui ci si trova e indirizzo esatto',
        inputSchema: z.object({
          latitudecity: z.number().describe('La latitudine del punto geografico'),
          longitudecity: z.number().describe('La longitudine del punto geografico'),
        }),
        execute: async ({ latitudecity, longitudecity }) => {
          // 1. Gestione corretta dei fallback numerici (non stringhe)
          console.log('getCityFromCoordinates1');
          const lat = latitudecity ?? coordinates.lat;
          const lng = longitudecity ?? coordinates.lng;
          // console.log('lng', lng);
          // 2. Corretto URL di OpenStreetMap (Nominatim API)
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
            { headers: { 'User-Agent': 'Vercel-AI-SDK-App' } }
          );
          if (!response.ok) {
            console.log("err:", response.status);
            throw new Error(`Errore API Nominatim: HTTP ${response.status}`);
          }
          //  console.log('response', response);
          const data = await response.json();
          //console.log('data', data);
          // . Estrazione sicura con optional chaining
          const city = data.address?.city || data.address?.town || data.address?.village || 'Sconosciuta';
          const country = data.address?.country || 'Sconosciuto';

          // 1. Gestione stringa principale: se l'intero oggetto o display_name manca
          const formattedAddress = data?.display_name ?? 'Indirizzo non disponibile per queste coordinate';
          // console.log('address', formattedAddress);
          // 2. Isoliamo l'oggetto address o un oggetto vuoto per evitare crash
          const addressDetails = data?.address ?? {};

          return { city, country, formattedAddress, addressDetails };
        },
      }),

      searchGplStation: tool({
        description: `
      Usa SEMPRE questo strumento quando l'utente chiede:
      - stazioni gpl o di gas
      - fornisci l'elenco completo
      - visualizza il link Google map
      - utilizza solo il DB come fonte dati
      `,
        inputSchema: z.object({
          query: z.string().describe('stazioni gpl o gas.'),
        }),
        execute: async ({ query }) => {
          // console.log("queryinfogpl" + query);
          // Genera embedding per la query dello strumento
          const { embedding } = await embed({
            model: openai.embedding('text-embedding-3-small'),
            value: query,
          });

          // Interroga Postgres
          const { rows } = await db.query(
            `SELECT content FROM document_sections WHERE knowledge_id=5 ORDER BY embedding <=> $1::vector LIMIT 15`,
            [`[${embedding.join(',')}]`]
          );

          return rows.map(r => r.content);
        },
      }),
      searchWeb: tool({
        description: 'Cerca sul web informazioni in tempo reale, notizie recenti o dati aggiornati.',
        inputSchema: z.object({
          query: z.string().describe('La query di ricerca ottimizzata per i motori di ricerca'),
        }),
        execute: async ({ query }) => {
          // 1. Chiamata all'SDK di Tavily
          const response = await client.search(query, {
            searchDepth: "advanced",
            includeAnswer: false // Disattivalo temporaneamente per pulire l'input
          });

          // 2. CORREZIONE CRUCIALE: Mappa i dati eliminando ogni campo 'undefined' o complesso.
          // Restituisci SOLO un array di oggetti puliti con proprietà testuali semplici.
          const cleanResults = (response.results || []).map((r: any) => ({
            title: r.title || 'Nessun titolo',
            url: r.url || '',
            content: r.content || ''
          }));

          // Restituiamo una stringa JSON o un oggetto super-semplificato
          return {
            results: cleanResults
          };

        },
      }),
      canticoro: tool({
        description: `
      Usa SEMPRE questo strumento quando l'utente chiede:
      - elenco dei canti del coro
      - informazioni su un canto
      - testi o titoli dei canti disponibili
      - suggerimenti di canti per una messa domenicale
      - scaletta dei canti per una celebrazione

      Il database dei canti disponibili è contenuto nel file fornito dal tool.
      Non inventare canti: prima richiama questo strumento.
      `,
        inputSchema: z.object({
          canto: z.string().describe(
            'Nome del canto richiesto o richiesta della scaletta liturgica'
          ),
        }),
        execute: async () => {
          console.log("canticoro");
          const response = fileContent;

          return {
            response
          };

        },
      }),
      ottieniCoordinate: tool({
        description: 'Converte un indirizzo, monumento o città in coordinate geografiche (latitudine e longitudine).',
        inputSchema: z.object({
          luogo: z.string().describe('Il nome del luogo o indirizzo fornito dall\'utente (es. "Colosseo, Roma" o "Piazza Duomo, Milano")'),
        }),
        execute: async ({ luogo }) => {
          console.log("ottieniCoordinate");
          const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${encodeURIComponent(luogo)}`;

          const response = await fetch(url, {
            headers: {
              'User-Agent': 'ParcheggiNextJS/1.0',
              'Accept-Language': 'it',
            },
          });
          const data = (await response.json()) as Array<{
            lat: string;
            lon: string;
            display_name: string;
          }>;

          if (!Array.isArray(data) || data.length === 0) {
            return { error: 'Luogo non trovato' };
          }

          return {
            latitude: Number.parseFloat(data[0].lat),
            longitude: Number.parseFloat(data[0].lon),
            displayName: data[0].display_name,
          };
        },
      }),
      cercaParcheggi: tool({
        description: 'Cerca i parcheggi in una determinata area geografica usando le coordinate lat/lon.',
        inputSchema: z.object({
          latitude: z.number().describe('La latitudine del centro di ricerca'),
          longitude: z.number().describe('La longitudine del centro di ricerca'),
          radius: z.number().optional().describe('Il raggio di ricerca in metri (es. 1000)'),
        }),
        execute: async ({
          latitude,
          longitude,
          radius = 1000,
        }) => {
          // Query Overpass QL per estrarre nodi e macro-aree parcheggio (amenity=parking)
          console.log("Parcheggi")
          const overpassQuery = `
            [out:json][timeout:25];
            (
              node["amenity"="parking"](around:${radius},${latitude},${longitude});
              way["amenity"="parking"](around:${radius},${latitude},${longitude});
            );
            out center;
          `;

          const url = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(overpassQuery)}`;
          //  console.log("url",url);
          const response = await fetch("https://overpass-api.de/api/interpreter", {
            signal: AbortSignal.timeout(20000),
            next: { revalidate: 60 },
            method: "POST",
            headers: {
              // IMPORTANTE: Dice al server che stai inviando i parametri corretti
              "Content-Type": "application/x-www-form-urlencoded",

              // OBBLIGATORIO: Identifica il tuo bot. Sostituisci con informazioni reali per evitare ban permanenti
              "User-Agent": "cantireapam.netlify.com/1.0",

              // Opzionale ma consigliato per i server Overpass
              "Accept": "application/json"
            },
            // La query va formattata come parametro 'data=' dentro il corpo della POST
            body: `data=${encodeURIComponent(overpassQuery)}`
          });
          if (!response.ok) {
            const errorText = await response.text();
            console.error(`Errore Overpass (${response.status}):`, errorText);
            throw new Error(`Il server Overpass ha risposto con codice ${response.status}`);
          }
          const data = await response.json();

          // Mappiamo i risultati in un formato pulito per la mappa
          const locations = (data.elements || [])
            .map((el: any) => ({
              id: el.id,
              lat: el.lat ?? el.center?.lat,
              lon: el.lon ?? el.center?.lon,
              name: el.tags?.name || 'Parcheggio Generico',
              type: el.tags?.parking || 'In strada / Struttura',
            }))
            .filter((el: any) => el.lat && el.lon);
          console.log("locations", locations);
          return { locations, center: [latitude, longitude] };
        },
      }),
      farmacie: tool({
        description: 'Ottiene l’elenco delle farmacie di turno di Roma in un intervallo di date. Se l’intervallo supera i 7 giorni, il tool elabora automaticamente solo i primi 7 giorni.',
        inputSchema: z.object({
          inizio: z.string().describe("Data di inizio dell'intervallo in formato YYYY-MM-DD"),
          fine: z.string().describe("Data di fine dell'intervallo in formato YYYY-MM-DD"),
        }),
        execute: async ({ inizio, fine }) => {
          const start = new Date(inizio);
          let end = new Date(fine);

          // Calcolo della differenza iniziale in giorni
          const diffTime = Math.abs(end.getTime() - start.getTime());
          let giorni = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

          const MAX_GIORNI = 7;

          // Gestione dello split automatico: se supera 7 giorni, tronca l'intervallo
          if (giorni > MAX_GIORNI) {
            end = new Date(start);
            end.setDate(start.getDate() + (MAX_GIORNI - 1));
          }

          const risultati = [];
          let corrente = new Date(start);

          // Esecuzione del ciclo fino alla data di fine (corretta o originale)
          while (corrente <= end) {
            const dataStringa = corrente.toISOString().slice(0, 10);

            try {
              const datiFarmacia = await getFarmacieTurno(dataStringa);
              risultati.push(datiFarmacia);
            } catch (error) {
              // Opzionale: evita che il blocco di un singolo giorno rompa l'intero intervallo
              console.error(`Errore nel recupero dei dati per il giorno ${dataStringa}:`, error);
            }

            corrente.setDate(corrente.getDate() + 1);
          }

          // Formattazione pulita dei risultati per il modello
          return risultati.map((r) => ({
            data: r.data,
            farmacie: r.farmacie.map((f: { nome: string; indirizzo: string }) => ({
              nome: f.nome,
              indirizzo: f.indirizzo
            }))
          }));
        },
      }),
      time: tool({
        description: 'Get the real time and day and month and year',
        inputSchema: z.object({
          city: z.string().describe("Nome della città (es. Tokyo)"),
          country: z.string().optional().describe("Paese opzionale"),
        }),
        execute: async ({ city }) => {
          const locationCity = await getCoordinates(city);
          const timeZone = await getTimezone(locationCity.latitude, locationCity.longitude)
          const now = new Intl.DateTimeFormat("it-IT", {
            timeZone: timeZone.timezone,
            dateStyle: "full",
            timeStyle: "medium",
          }).format(new Date());

          return {
            now,
          };
        }
      }),
      earthquakes: tool({
        description: 'Elenco Terremoti in Italia e nel mondo degli ultimi giorni con magnitudo maggiore di 3',
        inputSchema: z.object({
          earthquakes: z.string().describe("Elenco Terremoti in Italia e nel mondo degli ultimi giorni con magnitudo maggiore di 3"),
        }),
        execute: async () => {
          console.log('passo earthquake');
          const startTime = new Date();
          startTime.setDate(startTime.getDate() - 7);

          const formattedTime = startTime.toISOString().split('.')[0].slice(0, 10);
          console.log("starttime", formattedTime)
          const earthquakeResponses = await Promise.all([
            getEarthQuakes(`https://webservices.ingv.it/fdsnws/event/1/query?format=geojson&starttime=${formattedTime}&orderby=time&minmagnitude=3`),
            getEarthQuakes('https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/4.5_week.geojson'),
          ]);

          const mergedFeatures = earthquakeResponses.reduce((all: any[], response: any) => {
            return all.concat(response.earthquakes?.features || []);
          }, []);

          const simplifiedEarthquakes = mergedFeatures.sort((a: any, b: any) => (b.properties.mag ?? -Infinity) - (a.properties.mag ?? -Infinity)).map((f: any) => ({
            place: f.properties.place,
            magnitude: f.properties.mag,
            time: formatTime(f.properties.time),
            depth: f.properties.depth,
          }));
          //console.log("simplifiedEarthquakes",simplifiedEarthquakes)
          return {
            earthquakes: simplifiedEarthquakes,
          };
        },
      }),
      weather: tool({
        description: 'Get the weather in a location (fahrenheit)',
        inputSchema: z.object({
          location: z.string().describe('The location to get the weather for'),
        }),
        execute: async ({ location }) => {
          console.log("calcolo temperatura");
          const locationCity = await getCoordinates(location);
          const weather = await getWeather(locationCity.latitude, locationCity.longitude);
          const temperature = weather.current.temperature_2m;
          const apparent_temperature = weather.current.apparent_temperature;
          const timeZone = await getTimezone(locationCity.latitude, locationCity.longitude);
          console.log("weather.current.time", weather.current.time);
          const time = new Intl.DateTimeFormat("it-IT", {
            timeZone: timeZone.timezone,
            dateStyle: "full",
            timeStyle: "medium",
          }).format(new Date());

          console.log("time", time);
          // console.log("apparent_temperature",apparent_temperature);
          return {
            locationCity,
            temperature,
            apparent_temperature,
            time,
          };
        },
      }),
    },
    
    // Rilascia le risorse solo quando l'AI ha finito TUTTI i passaggi
/*    onFinish: async () => {
      try {
        await mcpClientContentful.close(); //
      } catch (e) {
        console.error("Errore durante la chiusura del client MCP:", e);
      }
    },
    onError: async () => {
      try {
        await mcpClientContentful.close(); // Forza la chiusura anche in caso di crash dell'LLM
      } catch (e) {
        console.error("Errore durante la chiusura MCP in onError:", e);
      }
    }*/
  });
  // Chiude il processo npx al termine dello streaming per non lasciare processi appesi

  return result.toUIMessageStreamResponse();

}
