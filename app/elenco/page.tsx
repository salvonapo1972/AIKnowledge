/* page.tsx */
export const dynamic = 'force-dynamic';

import { createClient } from "contentful";
import { SongQueryResult } from "../types";
import ElencoCanti from "../components/ElencoCanti";




const space = process.env.SPACE_ID;
const accessToken = process.env.ACCESS_TOKEN;

if (!space || !accessToken) {
  throw new Error("Missing Contentful credentials");
}

const client = createClient({
  space,
  accessToken,
});
const getSongEntries = async ():Promise<SongQueryResult> => {
  const entries = await client.getEntries({ content_type: "song" });
  return entries as unknown as SongQueryResult;
};

export default async function Home() {
  const songEntries = await getSongEntries();
   return(
    <ElencoCanti items={songEntries.items} />
   );
}
