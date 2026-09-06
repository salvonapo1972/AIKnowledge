// app/page.tsx

import React from 'react';

// Definiamo le interfacce TypeScript per i dati della risposta GeoJSON dell'INGV
interface EarthquakeProperties {
  eventID: string;
  time: string;
  magnitude: number;
  magType: string;
  place: string;
  depth: number;
}

interface EarthquakeFeature {
  type: string;
  id: string;
  geometry: {
    type: string;
    coordinates: [number, number, number]; // [longitudine, latitudine, profondità]
  };
  properties: EarthquakeProperties;
}

interface INGVResponse {
  type: string;
  features: EarthquakeFeature[];
}

// Funzione asincrona per recuperare i dati direttamente dal server di Next.js
async function getEarthquakes(urlEartquakes: string): Promise<INGVResponse> {
 // const url = 'https://webservices.ingv.it/fdsnws/event/1/query?format=geojson&limit=1000&minlatitude=-90&maxlatitude=90&minlongitude=-180&maxlongitude=180';
  const url = urlEartquakes;
  // Eseguiamo la fetch con un revalidate di 60 secondi per non sovraccaricare l'INGV
  // ma mantenere i dati freschi
  const res = await fetch(url, { 
    signal: AbortSignal.timeout(10000),
    next: { revalidate: 60 } 
  });

  if (!res.ok) {
    throw new Error('Impossibile recuperare i dati dall\'INGV');
  }

  return res.json() as Promise<INGVResponse>;
}

export async function getEarthQuakes(urlEarthquakes: string): Promise<{ earthquakes: INGVResponse }> {
  const data = await getEarthquakes(urlEarthquakes);
  const earthquakes = data;

  return {
    earthquakes
  };
}
