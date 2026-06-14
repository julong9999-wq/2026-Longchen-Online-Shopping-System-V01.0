const fs = require('fs');
let txt = fs.readFileSync('components/TravelSystem.tsx', 'utf-8');

// Fix d.setDate logic:
txt = txt.replace(
    'd.setDate(d.getDate() + tripForm.days - 1);',
    'd.setDate(d.getDate() + Number(tripForm.days) - 1);'
);

// Update date header to include daily sum
const dateHeaderSearch = '<span className="font-bold text-slate-700 text-sm">{date}</span>';
const dateHeaderReplace = `<div className="flex items-center gap-2 flex-wrap">
                                             <span className="font-bold text-slate-700 text-sm">{date}</span>
                                             <span className="text-xs font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded border border-purple-100">
                                                 {Object.entries(exps.reduce((acc, exp) => { acc[exp.currency] = (acc[exp.currency] || 0) + exp.amount; return acc; }, {})).map(([c, a]) => \`\${c} \${formatCurrency(a)}\`).join(', ')}
                                             </span>
                                         </div>`;
txt = txt.replace(dateHeaderSearch, dateHeaderReplace);

// Update Totals area to be taller, single line: 合計 幣別 金額, same width style as date header container, light purple background
const origTotalsStart = '{/* Secondary Area: Totals */}';
const origTotalsEnd = ')}';
const origTotalsSection = txt.substring(txt.indexOf(origTotalsStart), txt.indexOf(origTotalsEnd, txt.indexOf(origTotalsStart)) + 2);

const newTotalsSection = `{/* Secondary Area: Totals */}
                    {summaryByCurrency.length > 0 && (
                        <div className="px-2 pt-2 shrink-0">
                             {summaryByCurrency.map(([curr, sum]) => (
                                 <div key={curr} className="mb-0 mt-2 bg-purple-100 rounded-xl shadow-sm border border-purple-200 overflow-hidden flex items-center px-4 py-3.5 gap-3">
                                     <span className="font-bold text-purple-800 text-base shrink-0">合計</span>
                                     <span className="text-sm font-bold text-purple-600 shrink-0">{curr}</span>
                                     <span className="text-lg font-mono font-bold text-purple-900 flex-1 min-w-0 break-all text-right">{formatCurrency(sum)}</span>
                                 </div>
                             ))}
                        </div>
                    )}`;

txt = txt.replace(origTotalsSection, newTotalsSection);

fs.writeFileSync('components/TravelSystem.tsx', txt);
