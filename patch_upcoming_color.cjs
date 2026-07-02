const fs = require('fs');
let code = fs.readFileSync('components/ShiftSystem.tsx', 'utf8');

const oldSpan = /<span className="font-mono font-bold text-slate-600 shrink-0">\{r\.startTime\}-\{r\.endTime\} \(\{Number\(hrs\.toFixed\(2\)\)\}H\)<\/span>/;
const newSpan = `<span className={\`font-mono font-bold shrink-0 \${getTimeColor(r.startTime)}\`}>{r.startTime}-{r.endTime} ({Number(hrs.toFixed(2))}H)</span>`;

code = code.replace(oldSpan, newSpan);

fs.writeFileSync('components/ShiftSystem.tsx', code);
