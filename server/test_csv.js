const fetch = require('node-fetch');
const parseCSVLine = (text) => {
  const result = [];
  let curValue = '';
  let inQuote = false;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (char === '"') {
      inQuote = !inQuote;
    } else if (char === ',' && !inQuote) {
      result.push(curValue.trim());
      curValue = '';
    } else {
      curValue += char;
    }
  }
  result.push(curValue.trim());
  return result;
};

async function run() {
    const res = await fetch("https://docs.google.com/spreadsheets/d/e/2PACX-1vTDXIb-gUUd3pejijQAPQpgoOambCWNo8DfUgbdisLcB9i7YDy_SQxWI4vCsePoh2p1_n0FhuEkNQjI/pub?output=csv");
    const text = await res.text();
    const lines = text.split('\n').filter(l => l.trim() !== '');
    console.log("HEADERS:");
    parseCSVLine(lines[0]).forEach((h, i) => console.log(`${i}: ${h}`));
}
run();
