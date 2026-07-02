const fs = require('fs');
const files = [
  'components/WithdrawalView.tsx',
  'components/LendingView.tsx',
  'components/PledgeView.tsx'
];

files.forEach(file => {
  let code = fs.readFileSync(file, 'utf8');

  // Regex to replace all `<tr className="bg-slate-50/50">` (or similar) total rows.
  // We notice they all contain `<td ...>合計</td>`.
  // Let's do a more robust string replacement.
  
  if (file.includes('WithdrawalView.tsx')) {
    code = code.replace(
      /<tr className="bg-slate-50\/50">\s*<td className="p-1\.5 font-bold border-r border-slate-200 sticky left-0 z-10 shadow-\[1px_0_0_0_#e2e8f0\] text-center">合計<\/td>/g,
      '<tr className="sticky bottom-0 z-30 bg-indigo-50 border-t border-slate-200 text-indigo-800 shadow-[0_-1px_2px_rgba(0,0,0,0.05)]">\n                  <td className="p-1.5 font-bold border-r border-slate-200 sticky left-0 z-40 bg-indigo-50 shadow-[1px_0_0_0_#e2e8f0] text-center">合計</td>'
    );
    code = code.replace(
      /<td className="p-1\.5 font-bold text-indigo-600 sticky right-0 bg-slate-50\/50 border-l border-slate-200 z-10 shadow-\[-1px_0_0_0_#e2e8f0\] text-right pr-2">/g,
      '<td className="p-1.5 font-bold text-indigo-600 sticky right-0 bg-indigo-50 border-l border-slate-200 z-40 shadow-[-1px_0_0_0_#e2e8f0] text-right pr-2">'
    );
  }

  if (file.includes('LendingView.tsx')) {
    code = code.replace(
      /<tr className="bg-slate-50\/50">\s*<td className="p-1\.5 font-bold border-r border-slate-200 sticky left-0 z-10 text-center">合計<\/td>/g,
      '<tr className="sticky bottom-0 z-30 bg-indigo-50 border-t border-slate-200 text-indigo-800 shadow-[0_-1px_2px_rgba(0,0,0,0.05)]">\n                      <td className="p-1.5 font-bold border-r border-slate-200 sticky left-0 z-40 bg-indigo-50 text-center">合計</td>'
    );
    code = code.replace(
      /sticky right-0 bg-slate-50 border-l border-slate-200 z-10/g,
      'sticky right-0 bg-indigo-50 border-l border-slate-200 z-40'
    );
    code = code.replace(
      /sticky right-0 bg-slate-50\/50 border-l border-slate-200 z-10/g,
      'sticky right-0 bg-indigo-50 border-l border-slate-200 z-40'
    );
  }
  
  if (file.includes('PledgeView.tsx')) {
    code = code.replace(
      /<tr className="bg-slate-50\/50 font-bold">\s*<td className="p-1\.5 text-center border-r border-slate-200 sticky left-0 z-10">合計<\/td>/g,
      '<tr className="sticky bottom-0 z-30 bg-indigo-50/90 backdrop-blur-sm border-t border-slate-200 text-indigo-800 font-bold shadow-[0_-1px_2px_rgba(0,0,0,0.05)]">\n                        <td className="p-1.5 text-center border-r border-slate-200 sticky left-0 z-40 bg-indigo-50/90 backdrop-blur-sm">合計</td>'
    );
    code = code.replace(
      /<tr className="bg-slate-50\/50">\s*<td className="p-1\.5 font-bold text-center border-r border-slate-200 sticky left-0 z-10">合計<\/td>/g,
      '<tr className="sticky bottom-0 z-30 bg-indigo-50/90 backdrop-blur-sm border-t border-slate-200 text-indigo-800 font-bold shadow-[0_-1px_2px_rgba(0,0,0,0.05)]">\n                      <td className="p-1.5 font-bold text-center border-r border-slate-200 sticky left-0 z-40 bg-indigo-50/90 backdrop-blur-sm">合計</td>'
    );
  }

  fs.writeFileSync(file, code);
});
