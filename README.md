# AIKnowledge

AIKnowledge è un’applicazione web basata su Next.js che offre una chat con un assistente AI. L’assistente può rispondere a domande generali e, quando opportuno, consultare strumenti e fonti esterne per fornire informazioni aggiornate o riferite a una località.

## Funzionalità

- **Chat AI** con risposte in streaming.
- **Ricerca sul web** tramite Tavily.
- **Meteo** tramite Open-Meteo.
- **Terremoti** usando dati INGV e USGS.
- **Farmacie di turno a Roma**, ricavate dal sito dell’Ordine dei Farmacisti di Roma.
- **Ricerca di parcheggi** su OpenStreetMap/Overpass, con visualizzazione su mappa Leaflet.
- **Geocodifica e fuso orario** per località e coordinate.
- **Consultazione dell’archivio dei canti**, contenuto in `app/elenco_canti.md`.
- **Ricerca semantica di documenti** tramite embeddings OpenAI e database Neon/PostgreSQL.
- **Input vocale** nei browser che supportano la Web Speech API.

La disponibilità e l’accuratezza dei dati dipendono dai servizi esterni utilizzati e dalla loro raggiungibilità.

## Tecnologie

- Next.js e React
- TypeScript
- Vercel AI SDK e OpenAI
- Neon PostgreSQL
- Tailwind CSS
- Leaflet e React Leaflet
- Contentful
- Tavily

## Requisiti

- Node.js compatibile con la versione di Next.js installata
- npm
- Credenziali per i servizi configurati nell’applicazione

## Installazione

Clona il repository e installa le dipendenze:

```bash
git clone https://github.com/salvonapo1972/AIKnowledge.git
cd AIKnowledge
npm install


