import Papa from 'papaparse';

async function run() {
  const res = await fetch("https://docs.google.com/spreadsheets/d/e/2PACX-1vQaRKeSBt4XfeC9uNf56p38DwscoPK0-eFM3J4-Vz8LeVBdgsClDZy0baU-FHyFv5cz-QNCXUVMwBfr/pub?output=csv");
  const text = await res.text();
  const parsed = Papa.parse(text, { header: true });
  console.log("AP213 Headers:", parsed.meta.fields);
  console.log("AP213 First 3 rows:", parsed.data.slice(0, 3));
}
run();
