import fs from 'fs';

let content = fs.readFileSync('components/EcommerceAnalysisSystem.tsx', 'utf-8');

content = content.replace(/match\(\/\(d\{1,2\}\/d\{1,2\}\)\/\)/g, 'match(/(\\d{1,2}\\/\\d{1,2})/)');

fs.writeFileSync('components/EcommerceAnalysisSystem.tsx', content);
console.log("Fixed regex");
