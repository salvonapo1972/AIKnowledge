export async function getTimezone(latitude: number,longitude: number) {
  const response = await fetch(
    `https://timeapi.io/api/v1/time/current/coordinate?latitude=${latitude}&longitude=${longitude}`
  );

  const data = await response.json();
 //  console.log("data",data)
 
console.log("data.results[0].timezone",data.timezone)
  return {
    timezone: data.timezone,
  };
}