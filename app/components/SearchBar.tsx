"use client";



export default function SearchBar(props:any) {
  return (
    <div className="grid-cols-1 grid  max-w-7xl mx-auto p-3 my-4 flex">
      <h2 className="font-semibold py-4 text-xl text-white">Elenco dei canti</h2>
      <input
        type="text"
        onChange={(e) => props.onSearch(e.target.value)}
        value={props.value}
        placeholder="Cerca canto"
        className="text-center grid-cols-1 p-2 m-0 m-auto w-full text-white border-solid border-2"
      />
    </div>
  );
}