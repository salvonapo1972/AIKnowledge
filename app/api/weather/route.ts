import { NextResponse } from "next/server";

export async function GET() {
  const lat = 40.9261;
  const lon = 14.5275;

  const response = await fetch(
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m`
  );
console.log('tempo',response);
  const data = await response.json();

  return NextResponse.json(data);
}