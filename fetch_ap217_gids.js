async function run() {
  const res = await fetch("https://docs.google.com/spreadsheets/d/e/2PACX-1vQaRKeSBt4XfeC9uNf56p38DwscoPK0-eFM3J4-Vz8LeVBdgsClDZy0baU-FHyFv5cz-QNCXUVMwBfr/pub?html");
  const text = await res.text();
  const regex = /items\.push\(\{name:\s*"([^"]+)",[^}]*gid:\s*"([^"]+)"/g;
  let match;
  while ((match = regex.exec(text)) !== null) {
      console.log(`Sheet: ${match[1]} - GID: ${match[2]}`);
  }
}
run();
