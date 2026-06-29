async function run() {
  const res = await fetch("https://docs.google.com/spreadsheets/d/e/2PACX-1vR5JvOGT3eB4xq9phw2dXHApJKOgQkUZcs69CsJfL0Iw3s6egADwA8HdbimrWUceQZl_73pnsSLVnQw/pub?html");
  const text = await res.text();
  const regex = /items\.push\(\{name:\s*"([^"]+)",[^}]*gid:\s*"([^"]+)"/g;
  let match;
  while ((match = regex.exec(text)) !== null) {
      console.log(`Sheet: ${match[1]} - GID: ${match[2]}`);
  }
}
run();
