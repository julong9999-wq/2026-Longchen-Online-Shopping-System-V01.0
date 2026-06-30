async function checkGids() {
  const gid = '1923278022';
  const res = await fetch(`https://docs.google.com/spreadsheets/d/e/2PACX-1vSnkojvITxtjSfxyv0D85BEfMv80ANLdGyXGZih5prz6-W_0KfP1Fr5fRFwx8jUGkvEIQjoVa4afbnJ/pub?gid=${gid}&single=true&output=csv`);
  const text = await res.text();
  const accounts = new Set();
  const lines = text.split('\n');
  for(let i=1; i<lines.length; i++) {
    const cols = lines[i].split(',');
    if(cols.length > 3) accounts.add(cols[3].trim());
  }
  console.log('1923278022 摘要:', Array.from(accounts));
}
checkGids();
