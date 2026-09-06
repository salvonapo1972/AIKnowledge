import { embedMany } from 'ai';
import { openai } from '@ai-sdk/openai';
import { db } from './db';

// Funzione di utility per dividere un array in blocchi più piccoli
function chunkArray<T>(array: T[], size: number): T[][] {
  const result: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    result.push(array.slice(i, i + size));
  }
  return result;
}

export async function ingestDocuments(chunks: string[],knowledgeid:string) {
  if (chunks.length === 0) return;

  // Dividiamo i chunks in gruppi (es. 50 frammenti alla volta per non superare i limiti di token)
  const BATCH_SIZE = 50; 
  const chunksBatches = chunkArray(chunks, BATCH_SIZE);

  console.log(`Inizio elaborazione di ${chunks.length} frammenti divisi in ${chunksBatches.length} blocchi...`);

  const client = await db.connect();
  
  try {
    // Elaboriamo un blocco alla volta

     //cancello i record prima di reinserirli
        console.log("Cancellazione record con knowledgeid",knowledgeid);
        await client.query('BEGIN');
         await client.query(
          `DELETE FROM document_sections where knowledge_id=$1`,
          [knowledgeid]
        );
         await client.query('COMMIT');
    for (let b = 0; b < chunksBatches.length; b++) {
      const currentBatch = chunksBatches[b];
      console.log(`Elaborazione blocco ${b + 1}/${chunksBatches.length} (${currentBatch.length} frammenti)...`);

      // 1. Genera gli embedding solo per il blocco corrente
      const { embeddings } = await embedMany({
        model: openai.embedding('text-embedding-3-small'),
        values: currentBatch,
      });

      // 2. Salva il blocco corrente su Neon Postgres
      await client.query('BEGIN');
      for (let i = 0; i < currentBatch.length; i++) {
        const vectorString = JSON.stringify(embeddings[i]);
        
         await client.query(
          `INSERT INTO document_sections (content, embedding,knowledge_id) VALUES ($1, $2::vector,$3)`,
          [currentBatch[i], vectorString,knowledgeid]
        );
      }
      await client.query('COMMIT');
    }

    console.log("Tutti i blocchi sono stati inseriti con successo su Neon!");
  } catch (error) {
    await client.query('ROLLBACK');
    console.error("Errore durante l'ingestion:", error);
    throw error;
  } finally {
    client.release();
  }
}
