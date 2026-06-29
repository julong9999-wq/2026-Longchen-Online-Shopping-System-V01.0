import Papa from 'papaparse';

async function run() {
  const res = await fetch("https://docs.google.com/spreadsheets/d/e/2PACX-1vSnkojvITxtjSfxyv0D85BEfMv80ANLdGyXGZih5prz6-W_0KfP1Fr5fRFwx8jUGkvEIQjoVa4afbnJ/pub?gid=1021924150&single=true&output=csv");
  const text = await res.text();
  const parsed = Papa.parse(text, { header: true });
  console.log("Headers:", parsed.meta.fields);
  console.log("First 3 rows:", parsed.data.slice(0, 3));
}
run();
