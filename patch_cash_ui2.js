import fs from 'fs';

let content = fs.readFileSync('components/EcommerceAnalysisSystem.tsx', 'utf-8');

const t2 = `{isWithdrawnView && (
                        <div className="bg-blue-100 shadow-sm p-3 border-b border-blue-200">
                            <div className="flex items-center border-b border-blue-300 pb-1.5 mb-1.5">
                               <span className="w-1/4 font-bold text-blue-900 text-left text-sm border-r border-blue-300">合計</span>
                               <span className="w-1/4 text-blue-900 font-mono font-bold text-right text-sm border-r border-blue-300">{formatCurrency(sumProfit)}</span>
                               <span className="w-1/4 text-blue-900 font-mono font-bold text-right text-sm border-r border-blue-300">{formatCurrency(sumDad)}</span>
                               <span className="w-1/4 text-blue-900 font-mono font-bold text-right text-sm">{formatCurrency(sumSister)}</span>
                            </div>
                            <div className="flex items-center text-[10px] text-slate-600">
                               <span className="w-1/2 font-bold text-left text-blue-800 border-r border-blue-300 pl-1">-</span>
                               <span className="w-1/4 text-orange-700 text-right font-mono font-bold border-r border-blue-300">{sumProfit > 0 ? ((sumDad / sumProfit) * 100).toFixed(1) : 0}%</span>
                               <span className="w-1/4 text-fuchsia-700 text-right font-mono font-bold">{sumProfit > 0 ? ((sumSister / sumProfit) * 100).toFixed(1) : 0}%</span>
                            </div>
                        </div>
                     )}`;

const t2New = `{isWithdrawnView && (
                        <div className={\`shadow-sm p-3 border-b \${cashFilter === 'withdrawn' ? 'bg-blue-100 border-blue-200' : 'bg-emerald-100 border-emerald-200'}\`}>
                            <div className={\`flex items-center border-b pb-1.5 mb-1.5 \${cashFilter === 'withdrawn' ? 'border-blue-300' : 'border-emerald-300'}\`}>
                               <span className={\`w-1/4 font-bold text-left text-sm border-r \${cashFilter === 'withdrawn' ? 'text-blue-900 border-blue-300' : 'text-emerald-900 border-emerald-300'}\`}>合計</span>
                               <span className={\`w-1/4 font-mono font-bold text-right text-sm border-r \${cashFilter === 'withdrawn' ? 'text-blue-900 border-blue-300' : 'text-emerald-900 border-emerald-300'}\`}>{formatCurrency(sumProfit)}</span>
                               <span className={\`w-1/4 font-mono font-bold text-right text-sm border-r \${cashFilter === 'withdrawn' ? 'text-blue-900 border-blue-300' : 'text-emerald-900 border-emerald-300'}\`}>{formatCurrency(sumDad)}</span>
                               <span className={\`w-1/4 font-mono font-bold text-right text-sm \${cashFilter === 'withdrawn' ? 'text-blue-900' : 'text-emerald-900'}\`}>{formatCurrency(sumSister)}</span>
                            </div>
                            <div className="flex items-center text-[10px] text-slate-600">
                               <span className={\`w-1/2 font-bold text-left border-r pl-1 \${cashFilter === 'withdrawn' ? 'text-blue-800 border-blue-300' : 'text-emerald-800 border-emerald-300'}\`}>-</span>
                               <span className={\`w-1/4 text-orange-700 text-right font-mono font-bold border-r \${cashFilter === 'withdrawn' ? 'border-blue-300' : 'border-emerald-300'}\`}>{sumProfit > 0 ? ((sumDad / sumProfit) * 100).toFixed(1) : 0}%</span>
                               <span className="w-1/4 text-fuchsia-700 text-right font-mono font-bold">{sumProfit > 0 ? ((sumSister / sumProfit) * 100).toFixed(1) : 0}%</span>
                            </div>
                        </div>
                     )}`;

content = content.replace(t2, t2New);

fs.writeFileSync('components/EcommerceAnalysisSystem.tsx', content);
console.log("Patched isWithdrawnView");
