import { tool } from 'ai';
import { z } from 'zod';

import getBusArrivalTime from '@/app/components/BusArrivalTime';



export const busArrivalTools = {
   getBusArrival: tool({
        description: "Ottiene i minuti rimanenti prima dell'arrivo di un autobus a una determinata fermata.",
        inputSchema: z.object({
          busLine: z.string().describe("Il numero o nome della linea dell'autobus (es. '60', '90', 'Express')"),
          stopId: z.string().describe("L'identificativo numerico o codice della fermata dell'autobus"),
        }),
        execute: async ({ busLine, stopId }) => {
          const data = await getBusArrivalTime(busLine,stopId);
         // console.log("data",data);
          return data; // Il risultato viene passato al modello
        },
      }),

   
}