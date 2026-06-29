import Papa from 'papaparse';
async function run() {
  const res = await fetch("https://docs.google.com/spreadsheets/d/e/2PACX-1vQaRKeSBt4XfeC9uNf56p38DwscoPK0-eFM3J4-Vz8LeVBdgsClDZy0baU-FHyFv5cz-QNCXUVMwBfr/pub?gid=462296829&single=true&output=csv");
  const text = await res.text();
  const parsed = Papa.parse(text, { header: true });
  console.log("Total rows in History:", parsed.data.length);
  // group by year to see which years are available
  const years = {};
  parsed.data.forEach(row => {
     if (!row['日期']) return;
     const y = row['日期'].split('/')[0];
     years[y] = (years[y] || 0) + 1;
  });
  console.log("Years available in History:", years);
}
run();
