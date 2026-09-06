// src/db/index.ts
import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';

// Se esegui lo script in ambiente Node.js (fuori dai motori Edge), 
// Neon richiede la configurazione di WebSocket per i Pool.
if (typeof window === 'undefined') {
  neonConfig.webSocketConstructor = ws;
}

if (!process.env.DATABASE_URL) {
  throw new Error("La variabile d'ambiente DATABASE_URL non è configurata.");
}

// Crea e esporta il pool di connessioni
export const db = new Pool({ 
  connectionString: process.env.DATABASE_URL 
});
