/* page.tsx */
import { createClient } from "contentful";
import { SongQueryResult } from "./types";
import Hero from "./components/Hero";

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
 // console.log("Home -> blogEntries", songEntries);
  return (
    <main className="flex min-h-screen flex-col  gap-y-8 bg-gradient-to-b from-blue-100 to-pink-100">
      <Hero />
      
    </main>
  );
}
