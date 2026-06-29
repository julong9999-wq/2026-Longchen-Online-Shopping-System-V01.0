import Papa from 'papaparse';
async function run() {
  const res = await fetch("https://docs.google.com/spreadsheets/d/e/2PACX-1vR5JvOGT3eB4xq9phw2dXHApJKOgQkUZcs69CsJfL0Iw3s6egADwA8HdbimrWUceQZl_73pnsSLVnQw/pub?output=csv");
  const text = await res.text();
  const parsed = Papa.parse(text, { header: true });
  console.log("Headers AP215 default:", parsed.meta.fields);
  console.log("First 3 rows AP215 default:", parsed.data.slice(0, 3));
}
run();
