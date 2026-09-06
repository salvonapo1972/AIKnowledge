/* page.tsx */

"use client";

import Link from "next/link";
import SearchBar from "../components/SearchBar";
import { SongItem } from "@/app/types";
import { useState } from "react";



export default function ElencoCanti({ items }: { items: ReadonlyArray<SongItem> }) {

  //console.log("items", items)
  const [searchValue, setSearchValue] = useState("");
  const filterNames = (title: string) => {
    return title.toLowerCase().indexOf(searchValue.toLowerCase()) !== -1;
  };
  return (
    <main className="flex bckelenco min-h-screen flex-col  gap-y-8 bg-gradient-to-b from-blue-100 to-pink-100">
       <SearchBar onSearch={setSearchValue} search={searchValue} />
        <div id="searchid" className="grid-cols-1 sm:grid md:grid-cols-3 max-w-7xl mx-auto px-3">
      {items.filter((singlePost) => filterNames(singlePost.fields.title)).map((itemFiltered,index) => {
       // console.log("singlePost.fields",itemFiltered.fields);
        const { slug, title, date } = itemFiltered.fields;

        return (
          <div className="song p-2"  key={index}>
            <div className="max-w-sm rounded overflow-hidden shadow-lg p-1 text-white">
              <img className="w-full" src="canti.png" alt="Sunset in the mountains"/>
              <div className="px-6 py-4">
                <div className="font-bold text-xl mb-2">

                  <Link className="no-underline hover:underline" href={`/songs/${slug}`}>
             
                      <h2 className="font-extrabold text-sm group-hover:text-blue-500 transition-colors">{title}</h2>
              
                  </Link>
                </div>
               
              </div>
              
            </div>
            
          </div>
        );
      })}
       </div>
    </main>
  );
}
