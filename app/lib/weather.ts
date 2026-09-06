export async function getWeather(lat: number, lon: number) {
  const response = await fetch(
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,apparent_temperature&temperature_unit=celsius`
  );

  if (!response.ok) {
    throw new Error("Errore Open-Meteo");
  }

  return response.json();
}