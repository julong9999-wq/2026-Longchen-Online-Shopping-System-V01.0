const fs = require('fs');
let code = fs.readFileSync('components/ShiftSystem.tsx', 'utf8');

const oldStart = /<div className="text-\[9px\] md:text-xs font-bold leading-none">\{r\.startTime\}<\/div>/;
const newStart = `<div className={\`text-[9px] md:text-xs font-bold leading-none \${getTimeColor(r.startTime)}\`}>{r.startTime}</div>`;
code = code.replace(oldStart, newStart);

const oldEnd = /<div className="text-\[9px\] md:text-xs font-bold leading-none">\{r\.endTime\}<\/div>/;
const newEnd = `<div className={\`text-[9px] md:text-xs font-bold leading-none \${getTimeColor(r.endTime)}\`}>{r.endTime}</div>`;
code = code.replace(oldEnd, newEnd);

fs.writeFileSync('components/ShiftSystem.tsx', code);
