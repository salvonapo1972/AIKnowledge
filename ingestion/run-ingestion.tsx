import fs from 'fs';
import path from 'path';
import { extractText } from 'unpdf';
import { ingestDocuments } from '../app/lib/ingestDocuments'; // Assicurati che il percorso sia corretto

// 1. Funzione di Utility per dividere il testo estratto in blocchi (Chunking)
function splitTextIntoChunks(text: string, chunkSize = 1000): string[] {
  // Sostituisce spazi multipli e a capo continui con uno spazio singolo
  const cleanSpaceText = text.replace(/\s+/g, ' ').trim();
  const words = cleanSpaceText.split(' ');
  const chunks: string[] = [];
  let currentChunk: string[] = [];

  for (const word of words) {
    currentChunk.push(word);
    // Quando raggiungiamo la dimensione desiderata del blocco (es. 1000 caratteri)
    if (currentChunk.join(' ').length >= chunkSize) {
      chunks.push(currentChunk.join(' '));
      currentChunk = [];
    }
  }
  
  if (currentChunk.length > 0) {
    chunks.push(currentChunk.join(' '));
  }
  return chunks;
}

// 2. Funzione Principale
async function main(knowledgeid: string,nomefile: string) {
  const pdfPath = path.join('D:/Progetti/NextJs/' + nomefile); 
  // Inserisci qui il percorso assoluto o relativo del tuo file PDF
//  const pdfPath = path.join('D:/Progetti/NextJs/Guida-alla-compilazione-delle-Dichiarazioni-di-accessibilita.pdf'); 

  if (!fs.existsSync(pdfPath)) {
    console.error(`Errore: Il file PDF non esiste al percorso: ${pdfPath}`);
    process.exit(1);
  }

  console.log("Lettura del file PDF con unpdf...");
  const dataBuffer = fs.readFileSync(pdfPath);

  try {
    // unpdf estrae il testo direttamente dal buffer del file
    const uint8Array = new Uint8Array(dataBuffer);
    const { text } = await extractText(uint8Array);
    
    const testoCompleto = Array.isArray(text) 
    ? text.join('\n') 
    : text;

  console.log(`Testo estratto con successo! Lunghezza: ${testoCompleto.length} caratteri`);

  // 3. Ora puoi usare .trim() in sicurezza perché 'testoCompleto' è una stringa al 100%
  if (testoCompleto.trim().length === 0) {
    console.warn("Il testo estratto è vuoto.");
    return;
  }
    console.log(`Testo estratto con successo! Lunghezza: ${text.length} caratteri`);


    const frammenti = splitTextIntoChunks(testoCompleto);
    await ingestDocuments(frammenti,knowledgeid);

  } catch (error) {
    console.error("Errore durante l'estrazione con unpdf:", error);
  }
}

// Avvia lo script
const args = process.argv.slice(2);
const knowledgeidInput = args[0];
const nomefileInput = args[1];
main(knowledgeidInput,nomefileInput).catch(console.error);
