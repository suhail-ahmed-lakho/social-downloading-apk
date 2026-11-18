const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'app', 'admin', 'page.tsx');
let code = fs.readFileSync(filePath, 'utf8');

code = code.replace(/fontVariantNumeric:\s*"tabular-nums"JetBrains Mono',\s*monospace"/g, 'fontVariantNumeric: "tabular-nums"');

fs.writeFileSync(filePath, code, 'utf8');
const countAfter = (code.match(/monospace/gi) || []).length;
console.log('Final occurrences of monospace in admin/page.tsx:', countAfter);
