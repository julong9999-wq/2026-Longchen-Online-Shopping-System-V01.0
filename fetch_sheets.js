async function run() {
  const res = await fetch("https://docs.google.com/spreadsheets/d/e/2PACX-1vSnkojvITxtjSfxyv0D85BEfMv80ANLdGyXGZih5prz6-W_0KfP1Fr5fRFwx8jUGkvEIQjoVa4afbnJ/pub?html");
  const text = await res.text();
  const regex = /items\.push\(\{name:\s*"([^"]+)",[^}]*gid:\s*"([^"]+)"/g;
  let match;
  while ((match = regex.exec(text)) !== null) {
      console.log(`Sheet: ${match[1]} - GID: ${match[2]}`);
  }
}
run();
