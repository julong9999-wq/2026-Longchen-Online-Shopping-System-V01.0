async function test() {
  const ap219 = await fetch("https://docs.google.com/spreadsheets/d/e/2PACX-1vSnkojvITxtjSfxyv0D85BEfMv80ANLdGyXGZih5prz6-W_0KfP1Fr5fRFwx8jUGkvEIQjoVa4afbnJ/pub?gid=522688960&single=true&output=csv").then(r=>r.text());
  const ap215 = await fetch("https://docs.google.com/spreadsheets/d/e/2PACX-1vR5JvOGT3eB4xq9phw2dXHApJKOgQkUZcs69CsJfL0Iw3s6egADwA8HdbimrWUceQZl_73pnsSLVnQw/pub?output=csv").then(r=>r.text());
  
  console.log("AP219 head:", ap219.split('\n').slice(0,2));
  console.log("AP215 head:", ap215.split('\n').slice(0,2));
}
test();
