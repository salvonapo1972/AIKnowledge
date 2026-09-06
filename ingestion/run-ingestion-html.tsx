import { ingestDocuments } from "../app/lib/ingestDocuments"; // Assicurati che il percorso sia corretto
import * as cheerio from 'cheerio';

function getJson(html: string){
     const $ = cheerio.load(html);
        const stazioni: any[] = [];
        
        // 3. Seleziona i blocchi delle stazioni (adatta il selettore se la struttura classi del sito cambia)
        // Basato sulla struttura standard del testo estratto:
        $('.wrap #container .station').each((index, element) => {
          const container = $(element).closest('div'); // Trova il contenitore principale della stazione
          //console.log('cont',container.html());
          // Estrazione del nome e dell'indirizzo
          const nome = container.find('span, .station-name').text().trim() || container.prev('h3').text().trim();
       //  console.log('nome',nome);
          const infoTesto = container.text();
    
          // Regex per estrarre il prezzo (es. 0.699 EUR/L)
          const prezzoMatch = infoTesto.match(/Prezzo GPL:\s*([\d.]+)\s*EUR\/L/i);
          const prezzo = prezzoMatch ? parseFloat(prezzoMatch[1]) : null;
    
          // Regex per estrarre la data di aggiornamento (es. 16.08.2026)
          const dataMatch = infoTesto.match(/L'ultimo\s*([\d.]+)/i) || infoTesto.match(/\(([\d.]+)\)/);
          const ultimaConferma = dataMatch ? dataMatch[1] : null;
    
          // Estrazione del link o coordinate se presenti
          const link = container.find('a').attr('href');
    
          if (nome || prezzo) {
           // console.log('nomegpl',nome);
            stazioni.push({
              id: index,
              nome: nome || 'Insegna non specificata',
              prezzo,
              ultimaConferma,
              url: link ? `https://www.mylpg.eu${link}` : null
            });
          }
        });

        if (stazioni!== null){
           return JSON.stringify(stazioni);
        }else{
          return "";
        }
    
}


// 1. Funzione di Utility per dividere il testo estratto in blocchi (Chunking)
function splitTextIntoChunks(text: string, chunkSize = 1000): string[] {
  // Sostituisce spazi multipli e a capo continui con uno spazio singolo
  const cleanSpaceText = text.replace(/\s+/g, " ").trim();
  const words = cleanSpaceText.split(" ");
  const chunks: string[] = [];
  let currentChunk: string[] = [];

  for (const word of words) {
    currentChunk.push(word);
    // Quando raggiungiamo la dimensione desiderata del blocco (es. 1000 caratteri)
    if (currentChunk.join(" ").length >= chunkSize) {
      chunks.push(currentChunk.join(" "));
      currentChunk = [];
    }
  }

  if (currentChunk.length > 0) {
    chunks.push(currentChunk.join(" "));
  }
  return chunks;
}

// 2. Funzione Principale
async function main(knowledgeid: string, url: string) {
  try {
    // 1. Scarica il codice HTML della pagina di myLPG
    const response = await fetch(url, {
      cache: "no-store",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept-Language": "it-IT,it;q=0.9,en;q=0.8",
        "Accept-Encoding": "gzip, deflate, br",
      },
    });

    if (!response.ok) {
      throw new Error(`Errore nella richiesta: ${response.status}`);
    }

    const text = await response.text();
    // Inserisci qui il percorso assoluto o relativo del tuo file PDF

    const testoCompleto = Array.isArray(text) ? text.join("\n") : text;

    console.log(
      `Testo estratto con successo! Lunghezza: ${testoCompleto.length} caratteri`,
    );

    // 3. Ora puoi usare .trim() in sicurezza perché 'testoCompleto' è una stringa al 100%
    if (testoCompleto.trim().length === 0) {
      console.warn("Il testo estratto è vuoto.");
      return;
    }
    console.log(
      `Testo estratto con successo! Lunghezza: ${text.length} caratteri`,
    );

    
    //const textJson = 
    const frammenti = splitTextIntoChunks(getJson(testoCompleto));
    await ingestDocuments(frammenti, knowledgeid);
  } catch (error) {
    console.error("Errore durante l'estrazione html:", error);
  }
}

// Avvia lo script
const args = process.argv.slice(2);
const knowledgeidInput = args[0];
const nomefileInput = args[1];
main(knowledgeidInput, nomefileInput).catch(console.error);
