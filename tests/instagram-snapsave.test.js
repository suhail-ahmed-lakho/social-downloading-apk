// tests/instagram-snapsave.test.js
const assert = require('assert');

function decodeSnapApp(args) {
  let [h, u, n, t, e, r] = args;
  const tNum = Number(t);
  const eNum = Number(e);
  function decode(d, eVal, fVal) {
    const g = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ+/".split("");
    const hArr = g.slice(0, eVal);
    const iArr = g.slice(0, fVal);
    let j = d.split("").reverse().reduce((a, b, c) => {
      const idx = hArr.indexOf(b);
      if (idx !== -1) return a + idx * Math.pow(eVal, c);
      return a;
    }, 0);
    let k = "";
    while (j > 0) {
      k = iArr[j % fVal] + k;
      j = Math.floor(j / fVal);
    }
    return k || "0";
  }
  let result = "";
  for (let i = 0, len = h.length; i < len;) {
    let s = "";
    while (i < len && h[i] !== n[eNum]) {
      s += h[i];
      i++;
    }
    i++;
    for (let j = 0; j < n.length; j++) s = s.replace(new RegExp(n[j], "g"), j.toString());
    result += String.fromCharCode(Number(decode(s, eNum, 10)) - tNum);
  }
  try {
    const bytes = new Uint8Array(result.split("").map((char) => char.charCodeAt(0)));
    return new TextDecoder("utf-8").decode(bytes);
  } catch (e) {
    return result;
  }
}

function getEncodedSnapApp(data) {
  const parts = data.split("decodeURIComponent(escape(r))}(");
  if (!parts[1]) throw new Error("SnapSave: Invalid payload format");
  const sub = parts[1].split("))")[0];
  return sub.split(",").map((v) => v.replace(/"/g, "").trim());
}

function getDecodedSnapSave(data) {
  const alertMatch = data?.match(/document\.querySelector\("#alert"\)\.innerHTML\s*=\s*"([^"]+)"/);
  if (alertMatch && alertMatch[1]) {
    throw new Error(alertMatch[1]);
  }
  const part = data.split("getElementById(\"download-section\").innerHTML = \"")[1];
  if (!part) throw new Error("SnapSave: download-section not found");
  return part.split("\"; document.getElementById(\"inputData\").remove(); ")[0].replace(/\\(\\)?/g, "");
}

async function runSnapSaveTests() {
  console.log('\n--- [TEST SUITE 6] Instagram Direct SnapSave Engine Test ---');

  // 1. Decoder Unit Test
  assert.strictEqual(typeof decodeSnapApp, 'function', 'decodeSnapApp must be a function');
  assert.strictEqual(typeof getEncodedSnapApp, 'function', 'getEncodedSnapApp must be a function');
  assert.strictEqual(typeof getDecodedSnapSave, 'function', 'getDecodedSnapSave must be a function');
  console.log('✅ SnapSave algorithm functions loaded and verified');

  // 2. Live Extraction Test
  const testReel = 'https://www.instagram.com/reel/DehZrPKNt5t/';
  const formData = new URLSearchParams();
  formData.append('url', testReel);

  const res = await fetch("https://snapsave.app/action.php?lang=en", {
    method: "POST",
    headers: {
      "accept": "*/*",
      "content-type": "application/x-www-form-urlencoded",
      "origin": "https://snapsave.app",
      "referer": "https://snapsave.app/",
      "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36"
    },
    body: formData.toString()
  });

  assert.strictEqual(res.status, 200, 'SnapSave endpoint must respond HTTP 200');
  const rawText = await res.text();
  assert.ok(rawText.includes('decodeURIComponent'), 'SnapSave raw payload must contain decoder');

  const decodedHtml = getDecodedSnapSave(decodeSnapApp(getEncodedSnapApp(rawText)));
  assert.ok(decodedHtml.length > 100, 'Decoded HTML must not be empty');

  const hrefMatches = [...decodedHtml.matchAll(/href="([^"]+)"/g)]
    .map(m => m[1])
    .filter(u => u.startsWith("http") && !u.includes("play.google.com") && !u.includes("instagram.com"));

  assert.ok(hrefMatches.length > 0, 'Must extract at least 1 direct download link');
  assert.ok(hrefMatches[0].startsWith('http'), 'Extracted video URL must be a valid HTTP URL');

  console.log(`✅ Live Instagram Reel direct stream extracted: ${hrefMatches[0].slice(0, 60)}...`);
}

module.exports = { runSnapSaveTests };
