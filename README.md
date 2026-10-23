# AIKnowledge

Applicazione web di knowledge base e assistente AI, realizzata con Next.js. Offre una chat interattiva con strumenti per cercare informazioni aggiornate sul web, consultare dati e contenuti del progetto (per esempio canti del coro e stazioni GPL) e usare servizi collegati come Contentful e Neon Postgres.

## Requisiti

- Node.js compatibile con Next.js 16
- npm
- Credenziali per i servizi esterni utilizzati dall'applicazione

## Avvio in locale

1. Clona il repository e installa le dipendenze:

   ```bash
   git clone https://github.com/salvonapo1972/AIKnowledge.git
   cd AIKnowledge
   npm install
   ```

2. Crea un file `.env.local` nella root e configura le variabili necessarie (non inserire mai segreti nel repository):

   ```dotenv
   OPENAI_API_KEY=
   SPACE_ID=
   ACCESS_TOKEN=
   DATABASE_URL=
   TAVILY_API_KEY=
   OPENROUTER_API_KEY=
   ```

   `SPACE_ID` e `ACCESS_TOKEN` servono per leggere gli elementi Contentful della home; `DATABASE_URL` deve puntare al database Neon/Postgres configurato per la ricerca vettoriale. Le chiavi OpenAI e Tavily servono rispettivamente alle funzioni AI/embedding e alla ricerca web. `OPENROUTER_API_KEY` è configurata nel route della chat.

3. Avvia l'ambiente di sviluppo:

   ```bash
   npm run dev
   ```

   Apri [http://localhost:3000](http://localhost:3000).

## Comandi disponibili

- `npm run dev` — avvia il server di sviluppo.
- `npm run build` — crea la build di produzione.
- `npm run start` — avvia la build di produzione.
- `npm run lint` — esegue ESLint.
- `npm run ingest -- <knowledge-id> <file>` — avvia l'ingestion di un PDF tramite `ingestion/run-ingestion.tsx`.

L'ingestion estrae il testo dal PDF, lo divide in frammenti, genera embedding e li salva nella tabella `document_sections` del database. Prima di eseguirla, verifica il percorso PDF previsto nello script: attualmente è impostato sul percorso Windows `D:/Progetti/NextJs/`. L'operazione elimina i frammenti esistenti per il `knowledge-id` indicato prima di inserirne di nuovi.

È disponibile anche `ingestion/run-ingestion-html.tsx` per importare dati da una pagina HTML; lo script accetta come argomenti un ID knowledge e un URL. Verifica che database e schema siano pronti prima di avviarlo.

## Struttura del progetto

- `app/` — pagine, componenti, route API e funzioni di supporto dell'applicazione.
- `app/api/chat/route.ts` — endpoint della chat AI e strumenti collegati.
- `app/elenco_canti.md` — contenuti usati dallo strumento dedicato ai canti.
- `app/lib/` — integrazioni e accesso al database.
- `ingestion/` — script per importare PDF e contenuti HTML nella knowledge base.

## Deploy

Il file `netlify.toml` configura Netlify per eseguire `npm run build` e pubblicare `.next`. Imposta nel provider di deploy le stesse variabili d'ambiente richieste in locale.
