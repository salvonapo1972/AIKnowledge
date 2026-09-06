import { createClient } from "contentful";
import { documentToReactComponents } from "@contentful/rich-text-react-renderer";
import Link from "next/link";
import { SongItem } from "@/app/types";



const client = createClient({
  space: process.env.SPACE_ID!,
  accessToken: process.env.ACCESS_TOKEN!,
});

export async function generateStaticParams() {
  const queryOptions = {
    content_type: "song",
    select: "fields.slug",
  };

  const songs = await client.getEntries(queryOptions);

  return songs.items.map((song) => ({
    slug: song.fields.slug,
  }));
}

const fetchSong = async (slug: string): Promise<SongItem> => {
  const queryOptions = {
    content_type: "song",
    "fields.slug[match]": slug,
  };

  const queryResult = await client.getEntries(queryOptions);
 // console.log("song",queryResult);

  return queryResult.items[0] as unknown as SongItem;
};

type SongPageProps = {
  params: Promise<{ slug: string }>;
};

export default async function SongPage({ params }: SongPageProps) {
  const { slug } = await params;

  const options = {
    renderText: (text: string) =>
      text
        .split("\n")
        .flatMap((line, i) => (i > 0 ? [<br key={i} />, line] : [line])),
  };

  const song = await fetchSong(slug);
 // console.log("songs.fields", song.fields);
  const { title, date, testoCanzone, urlVideo } = song?.fields || 'null';

  return (
    <main className="bckelenco text-white min-h-screen p-5  text-center">
       <div className="mb-10 text-right">
                <Link className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800" href={`/elenco`}>Torna Indietro</Link>
              </div>
      <div className="canto">
        <div className="[&>p]:mb-8 [&>h1]:font-extrabold [&>h1]:text-2xl text-center">
          {documentToReactComponents(testoCanzone, options)}
        </div>
        
      </div>
      <div>
          <iframe
            className="w-full aspect-video mt-4"
            src={(urlVideo!==null && typeof urlVideo !== 'undefined' )?urlVideo.replace("https://youtu.be/","https://www.youtube.com/embed/"):""}
            title="YouTube video player"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          ></iframe>
        </div>
    </main>
  );
}
