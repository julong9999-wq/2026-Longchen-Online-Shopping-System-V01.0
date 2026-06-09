import fs from 'fs';

let content = fs.readFileSync('components/EcommerceAnalysisSystem.tsx', 'utf-8');

// 1. Fixing thead for the shipping/profit table
const oldThead1 = /<thead className=\{\`sticky top-0 z-10 shadow-sm \$\{activeTab === 'shipping' \? 'bg-emerald-600 text-white border-b border-emerald-700' : 'bg-rose-600 text-white border-b border-rose-700'\}\`\}>/;
const newThead = `<thead className={\`sticky top-0 z-10 shadow-sm border-b \${statusFilter === 'processing' ? 'bg-emerald-600 text-white border-emerald-700' : statusFilter === 'preorder' ? 'bg-rose-600 text-white border-rose-700' : 'bg-yellow-500 text-white border-yellow-600'}\`}>`;

content = content.replace(oldThead1, newThead);

// 2. Fixing thead for turnover table
const oldThead2 = /<thead className="bg-slate-100 text-slate-600 border-b border-slate-200 sticky top-0 z-10 shadow-sm">/;
content = content.replace(oldThead2, newThead);

// 3. Fixing tfoot for shipping/profit table
const oldTfoot1Str = `<tfoot className={\`sticky bottom-0 z-10 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] border-t-2 \${activeTab === 'shipping' ? 'bg-emerald-200 border-emerald-400 text-emerald-900' : 'bg-rose-200 border-rose-400 text-rose-900'}\`}>
                          <tr>
                              <td className="px-2 py-2 font-bold text-slate-900 border-r border-blue-300">合計</td>
                              <td className="px-2 py-2 text-right font-mono font-bold text-blue-800 border-r border-blue-300">
                                  {formatCurrency(filteredData.reduce((acc, item) => acc + item.revenue, 0))}
                              </td>
                              <td className={\`px-2 py-2 text-right font-mono font-bold border-r border-blue-300 \${activeTab === 'shipping' ? 'text-amber-800' : 'text-emerald-800'}\`}>
                                  {formatCurrency(filteredData.reduce((acc, item) => acc + (activeTab === 'shipping' ? item.intlShip : item.profit), 0))}
                              </td>
                              <td className="px-2 py-2 text-right font-mono font-bold text-slate-900">`;

const newTfoot1Str = `<tfoot className={\`sticky bottom-0 z-10 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] border-t-2 \${statusFilter === 'processing' ? 'bg-emerald-200 border-emerald-400 text-emerald-900' : statusFilter === 'preorder' ? 'bg-rose-200 border-rose-400 text-rose-900' : 'bg-yellow-200 border-yellow-400 text-yellow-900'}\`}>
                          <tr>
                              <td className={\`px-2 py-2 font-bold border-r \${statusFilter === 'processing' ? 'border-emerald-300 text-emerald-900' : statusFilter === 'preorder' ? 'border-rose-300 text-rose-900' : 'border-yellow-300 text-yellow-900'}\`}>合計</td>
                              <td className={\`px-2 py-2 text-right font-mono font-bold border-r \${statusFilter === 'processing' ? 'border-emerald-300 text-emerald-900' : statusFilter === 'preorder' ? 'border-rose-300 text-rose-900' : 'border-yellow-300 text-yellow-900'}\`}>
                                  {formatCurrency(filteredData.reduce((acc, item) => acc + item.revenue, 0))}
                              </td>
                              <td className={\`px-2 py-2 text-right font-mono font-bold border-r \${statusFilter === 'processing' ? 'border-emerald-300 text-emerald-900' : statusFilter === 'preorder' ? 'border-rose-300 text-rose-900' : 'border-yellow-300 text-yellow-900'}\`}>
                                  {formatCurrency(filteredData.reduce((acc, item) => acc + (activeTab === 'shipping' ? item.intlShip : item.profit), 0))}
                              </td>
                              <td className={\`px-2 py-2 text-right font-mono font-bold \${statusFilter === 'processing' ? 'text-emerald-900' : statusFilter === 'preorder' ? 'text-rose-900' : 'text-yellow-900'}\`}>`;

content = content.replace(oldTfoot1Str, newTfoot1Str);

// 4. Fixing tfoot for turnover table
const oldTfoot2Str = `<tfoot className="sticky bottom-0 z-10 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] border-t-2 bg-yellow-200 border-yellow-400 text-yellow-900">
                          <tr>
                              <td className="px-2 py-2 font-bold border-r border-amber-300">平均天數</td>
                              <td colSpan={2} className="px-2 py-2 font-bold text-center border-r border-amber-300"></td>
                              <td className="px-2 py-2 text-right font-mono font-bold">`;

const newTfoot2Str = `<tfoot className={\`sticky bottom-0 z-10 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] border-t-2 \${statusFilter === 'processing' ? 'bg-emerald-200 border-emerald-400 text-emerald-900' : statusFilter === 'preorder' ? 'bg-rose-200 border-rose-400 text-rose-900' : 'bg-yellow-200 border-yellow-400 text-yellow-900'}\`}>
                          <tr>
                              <td className={\`px-2 py-2 font-bold border-r \${statusFilter === 'processing' ? 'border-emerald-300' : statusFilter === 'preorder' ? 'border-rose-300' : 'border-yellow-300'}\`}>平均天數</td>
                              <td colSpan={2} className={\`px-2 py-2 font-bold text-center border-r \${statusFilter === 'processing' ? 'border-emerald-300' : statusFilter === 'preorder' ? 'border-rose-300' : 'border-yellow-300'}\`}></td>
                              <td className="px-2 py-2 text-right font-mono font-bold">`;

content = content.replace(oldTfoot2Str, newTfoot2Str);

// 5. Fixing the purchase summary area colors (bg-orange-50 -> bg-slate-50 border-slate-200) and fonts
const oldPurchaseStr = `<div className="px-3 py-2 bg-orange-50 border-b border-orange-100 shrink-0 shadow-sm">
                    <div className="flex justify-between items-center text-[10px] font-bold text-orange-800 mb-0.5">
                        <div className="w-1/3 text-left">訂單</div>
                        <div className="w-1/3 text-center">購買</div>
                        <div className="w-1/3 text-right"></div>
                    </div>
                    <div className="flex justify-between items-baseline text-xs font-bold text-slate-600">
                        <div className="w-1/3 text-left flex items-baseline">
                            <span className="text-slate-500">總收入</span> <span className="font-mono text-[13px] font-bold text-slate-600 ml-1.5">{formatCurrency(totalRevenue)}</span>
                        </div>
                        <div className="w-1/3 text-center flex items-baseline justify-center">
                            <span className="text-slate-500">總金額</span> <span className="font-mono text-[13px] font-bold text-slate-600 ml-1.5">{formatCurrency(totalPurchase)}</span>
                        </div>
                        <div className="w-1/3 text-right flex items-baseline justify-end">
                            <span className="text-slate-500">百分比</span> <span className="font-mono text-[13px] font-bold text-slate-600 ml-1.5">{percentage}%</span>
                        </div>
                    </div>
                </div>`;

const newPurchaseStr = `<div className="px-3 py-3 bg-slate-50 border-b border-slate-200 shrink-0 shadow-sm">
                    <div className="flex justify-between items-baseline font-bold">
                        <div className="w-1/3 text-left flex items-baseline">
                            <span className="text-slate-500 text-sm">訂單總收入</span> <span className="font-mono text-xl font-bold text-slate-700 ml-2">{formatCurrency(totalRevenue)}</span>
                        </div>
                        <div className="w-1/3 text-center flex items-baseline justify-center">
                            <span className="text-slate-500 text-sm">購買總金額</span> <span className="font-mono text-xl font-bold text-slate-700 ml-2">{formatCurrency(totalPurchase)}</span>
                        </div>
                        <div className="w-1/3 text-right flex items-baseline justify-end">
                            <span className="text-slate-500 text-sm">百分比</span> <span className="font-mono text-xl font-bold text-slate-700 ml-2">{percentage}%</span>
                        </div>
                    </div>
                </div>`;

content = content.replace(oldPurchaseStr, newPurchaseStr);

fs.writeFileSync('components/EcommerceAnalysisSystem.tsx', content);
console.log("Patched headers, colors, and purchase summary font size");
