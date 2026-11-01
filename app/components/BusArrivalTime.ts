import { transit_realtime } from 'gtfs-realtime-bindings';

export default async function getBusArrivalTime(busLine: string | number, stopId: string | number) {
    const normalizedBusLine = String(busLine).trim();
    const normalizedStopId = String(stopId).trim();

    if (!normalizedBusLine) {
        throw new Error('Il codice della linea bus è obbligatorio.');
    }

    

    // Nuovo URL ufficiale per gli aggiornamenti dei tempi e delle fermate
    
    const fileUrl = 'https://romamobilita.it/sites/default/files/rome_rtgtfs_trip_updates_feed.pb';
//console.log("passo getBusArrivalTime con Trip Updates feed");
    try {
        const response = await fetch(fileUrl, { cache: 'no-store' });
        if (!response.ok) {
            throw new Error(`Impossibile scaricare il file Trip Updates. Status: ${response.status}`);
        }
        const arrayBuffer = await response.arrayBuffer();
        const binaryData = new Uint8Array(arrayBuffer);

        // Decodifica il feed
        const feed = transit_realtime.FeedMessage.decode(binaryData);
        
        const oraCorrentePOSIX = Math.floor(Date.now() / 1000);
        let fermataTrovata: any = null;
        let infoCorsa: any = null;

        if (feed.entity && Array.isArray(feed.entity)) {
            for (const entity of feed.entity) {
                const tu = entity.tripUpdate;
                
                // Filtriamo per la linea dell'autobus cercata
                if (tu && tu.trip && String(tu.trip.routeId) === normalizedBusLine) {
                    
                    // Scansioniamo l'elenco delle fermate (stopTimeUpdate) programmate per questa corsa
                    if (tu.stopTimeUpdate && Array.isArray(tu.stopTimeUpdate)) {
                        const matchFermata = tu.stopTimeUpdate.find(
                            (stu) => String(stu.stopId) === normalizedStopId
                        );

                        if (matchFermata) {
                            fermataTrovata = matchFermata;
                            infoCorsa = tu.trip;
                            break; // Trovato il tempo stimato per la fermata richiesta
                        }
                    }
                }
            }
        }

        if (!fermataTrovata) {
            return {
                status: "not_found",
                message: `Nessuna previsione attiva per la linea ${normalizedBusLine} alla fermata ${normalizedStopId}.`
            };
        }

        // Estrazione dei dati di arrivo o partenza previsti alla fermata
        const stopTimeEvent = fermataTrovata.arrival || fermataTrovata.departure;
        if (!stopTimeEvent || !stopTimeEvent.time) {
            return {
                status: "no_time",
                message: `Previsione presente per la fermata, ma manca l'orario stimato.`
            };
        }

        const timestampPrevisione = Number(stopTimeEvent.time);
        
        // Calcolo del tempo residuo in minuti e secondi
        const secondiMancanti = timestampPrevisione - oraCorrentePOSIX;
        const minutiMancanti = Math.round(secondiMancanti / 60);

        // Calcolo del ritardo/anticipo rispetto all'orario teorico (se fornito dal feed)
        const ritardoSecondi = stopTimeEvent.delay ? Number(stopTimeEvent.delay) : 0;
        const ritardoMinuti = Math.round(ritardoSecondi / 60);

        return {
            status: "success",
            linea: infoCorsa.routeId || normalizedBusLine,
            tripId: infoCorsa.tripId || "N/D",
            fermataCercata: normalizedStopId,
            orarioStimatoPOSIX: timestampPrevisione,
            orarioStimatoLeggibile: new Date(timestampPrevisione * 1000).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' }),
            minutiResidui: minutiMancanti,
            secondiResidui: secondiMancanti,
            ritardoMinuti: ritardoMinuti,
            infoCorsa: {
                partenzaTeorica: infoCorsa.startTime || "N/D",
                dataCorsa: infoCorsa.startDate || "N/D"
            }
        };

    } catch (e) {
        console.error("Errore nel parsing del feed Trip Updates:", e);
        return {
            status: "error",
            message: "Impossibile elaborare i dati di previsione arrivo."
        };
    }

    
}
