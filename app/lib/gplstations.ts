import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';



export async function getGplStations() {
  try {
    // 1. Scarica il codice HTML della pagina di myLPG
    const response = await fetch('https://www.mylpg.eu/it/stazioni/italia/elenco/#list', {
      cache: 'no-store',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'it-IT,it;q=0.9,en;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
      },
    });

    if (!response.ok) {
      throw new Error(`Errore nella richiesta: ${response.status}`);
    }

    const html = await response.text();
    //console.log('html',html);
    // 2. Carica l'HTML in Cheerio
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

    // 4. Restituisci la risposta JSON
    return NextResponse.json({ 
      success: true, 
      count: stazioni.length, 
      data: stazioni 
    });

  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message }, 
      { status: 500 }
    );
  }
}
