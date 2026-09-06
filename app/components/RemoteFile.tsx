// app/page.tsx (o qualsiasi altro Server Component)
export default async function RemoteFile() {
  const fileUrl = 'https://raw.githubusercontent.com/salvonapo1972/AppCantiReginaApostolorum/refs/heads/dev/elenco_canti.md'; // O il tuo file .json, .csv, ecc.
  
  try {
    const response = await fetch(fileUrl);
    
    if (!response.ok) {
      throw new Error(`Errore nel caricamento del file: ${response.status}`);
    }

    // Se il file è un testo semplice (.txt, .csv, .md)
    const fileContent = await response.text();

    // NOTA: Se il file fosse un JSON, useresti invece:
    // const fileContent = await response.json();

    return (
      {fileContent}
    );
  } catch (error) {
    return <p className="text-red-500">Impossibile leggere il file remoto.</p>;
  }
}
