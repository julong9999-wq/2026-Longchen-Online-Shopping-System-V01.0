import Papa from 'papaparse';
async function run() {
  const res = await fetch("https://docs.google.com/spreadsheets/d/e/2PACX-1vQaRKeSBt4XfeC9uNf56p38DwscoPK0-eFM3J4-Vz8LeVBdgsClDZy0baU-FHyFv5cz-QNCXUVMwBfr/pub?gid=395511934&single=true&output=csv");
  const text = await res.text();
  const parsed = Papa.parse(text, { header: true });
  console.log("Headers Daily:", parsed.meta.fields);
  console.log("First 3 rows Daily:", parsed.data.slice(0, 3));
}
run();
