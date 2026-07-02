const fs = require('fs');
let code = fs.readFileSync('components/LendingView.tsx', 'utf8');

code = code.replace(
  /<tr className="bg-slate-50\/50">\s*<td colSpan=\{2\} className="p-1\.5 font-bold text-center border-r border-slate-200">合計<\/td>/,
  '<tr className="sticky bottom-0 z-30 bg-indigo-50 border-t border-slate-200 text-indigo-800 shadow-[0_-1px_2px_rgba(0,0,0,0.05)]">\n                      <td colSpan={2} className="p-1.5 font-bold text-center border-r border-slate-200 sticky left-0 z-40 bg-indigo-50">合計</td>'
);

code = code.replace(
  /<tr className="bg-slate-50\/50">\s*<td colSpan=\{2\} className="p-1\.5 font-bold text-right border-r border-slate-200 pr-4">合計<\/td>/,
  '<tr className="sticky bottom-0 z-30 bg-indigo-50 border-t border-slate-200 text-indigo-800 shadow-[0_-1px_2px_rgba(0,0,0,0.05)]">\n                      <td colSpan={2} className="p-1.5 font-bold text-right border-r border-slate-200 pr-4 sticky left-0 z-40 bg-indigo-50">合計</td>'
);

fs.writeFileSync('components/LendingView.tsx', code);
