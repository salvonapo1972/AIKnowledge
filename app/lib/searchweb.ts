import { NextResponse } from 'next/server';
import { tavily } from '@tavily/core';

// Inizializza il client usando la tua chiave API di Tavily
const client = tavily({ 
  apiKey: process.env.TAVILY_API_KEY
});

interface SearchResult {
  title: string;
  url: string;
  content: string;
}


export async function getResults(query: string) {
  try {
    // 1. Recuperiamo la query inviata dal frontend
   // const { query } = await req.json();

    // Protezione contro stringhe vuote (causa dell'errore Invalid Input)
    console.log("query",query)
    if (!query || query.trim() === "") {
      return NextResponse.json(
        { error: "La query di ricerca non può essere vuota." }, 
        { status: 400 }
      );
    }

    // 2. Chiamata corretta all'SDK di Tavily
    const response = await client.search(query, {
      searchDepth: "advanced", // Mantiene la ricerca approfondita
      includeAnswer: true,     // Corretto da "advanced" a true (booleano)
    });

     const cleanResults = (response.results || []).map((r: any) => ({
              title: r.title || 'Nessun titolo',
              url: r.url || '',
              content: r.content || ''
            }));
    return cleanResults;

  } catch (error: any) {
    console.error("Errore Tavily:",JSON.stringify(error));
    return null;
  }
}
