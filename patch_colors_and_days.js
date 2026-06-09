import fs from 'fs';

let content = fs.readFileSync('components/EcommerceAnalysisSystem.tsx', 'utf-8');

// 1. thead & tfoot for shipping/profit combo table
content = content.replace(
  /<thead className="bg-slate-100 text-slate-600 border-b border-slate-200 sticky top-0 z-10 shadow-sm">/g,
  `<thead className={\`sticky top-0 z-10 shadow-sm \${activeTab === 'shipping' ? 'bg-sky-600 text-white border-b border-sky-700' : activeTab === 'profit' ? 'bg-emerald-600 text-white border-b border-emerald-700' : activeTab === 'turnover' ? 'bg-amber-500 text-white border-b border-amber-600' : 'bg-slate-100 text-slate-600 border-b border-slate-200'}\`}>`
);

content = content.replace(
  /<tfoot className="bg-sky-100 border-t-2 border-sky-300 sticky bottom-0 z-10 shadow-\[0_-4px_6px_-1px_rgba\(0,0,0,0\.1\)\]">/g,
  `<tfoot className={\`sticky bottom-0 z-10 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] border-t-2 \${activeTab === 'shipping' ? 'bg-sky-200 border-sky-400 text-sky-900' : 'bg-emerald-200 border-emerald-400 text-emerald-900'}\`}>`
);

// 3. Cash tab header deeper colors
content = content.replace(
    /className="bg-sky-50 shadow-sm p-3"/g,
    `className="bg-blue-100 shadow-sm p-3 border-b border-blue-200"`
);
content = content.replace(
    /className="bg-rose-50 shadow-sm p-3"/g,
    `className="bg-rose-100 shadow-sm p-3 border-b border-rose-200"`
);
// Cash table header text updates
content = content.replace(/text-slate-900 text-left text-sm border-r border-sky-200/g, 'text-blue-900 text-left text-sm border-r border-blue-300');
content = content.replace(/text-emerald-800 font-mono font-bold text-right text-sm border-r border-sky-200/g, 'text-blue-900 font-mono font-bold text-right text-sm border-r border-blue-300');
content = content.replace(/text-orange-800 font-mono font-bold text-right text-sm border-r border-sky-200/g, 'text-blue-900 font-mono font-bold text-right text-sm border-r border-blue-300');
content = content.replace(/border-r border-sky-200 pl-1"-"/g, 'border-r border-blue-300 pl-1"-"');
content = content.replace(/text-sky-800 border-r border-sky-200 pl-1/g, 'text-blue-800 border-r border-blue-300 pl-1');
content = content.replace(/border-r border-sky-200/g, 'border-r border-blue-300');
content = content.replace(/border-b border-sky-200/g, 'border-b border-blue-300');
content = content.replace(/text-fuchsia-800 font-mono font-bold text-right text-sm/g, 'text-blue-900 font-mono font-bold text-right text-sm');

content = content.replace(/text-slate-900 text-left text-sm border-r border-rose-200/g, 'text-rose-900 text-left text-sm border-r border-rose-300');
content = content.replace(/text-emerald-800 font-mono font-bold text-right text-sm border-r border-rose-200/g, 'text-rose-900 font-mono font-bold text-right text-sm border-r border-rose-300');
content = content.replace(/text-orange-800 font-mono font-bold text-right text-sm border-r border-rose-200/g, 'text-rose-900 font-mono font-bold text-right text-sm border-r border-rose-300');
content = content.replace(/border-b border-rose-200/g, 'border-b border-rose-300');
content = content.replace(/text-rose-800 border-r border-rose-200/g, 'text-rose-800 border-r border-rose-300');
content = content.replace(/border-r border-rose-200/g, 'border-r border-rose-300');


// 4. Update turnover table to fix date logic and add average days footer
const turnoverTableRegex = /<table className="w-full text-left text-sm whitespace-nowrap">[\s\S]+?<\/table>/;

const newTurnoverTableStr = `<table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className={\`sticky top-0 z-10 shadow-sm \${activeTab === 'shipping' ? 'bg-sky-600 text-white border-b border-sky-700' : activeTab === 'profit' ? 'bg-emerald-600 text-white border-b border-emerald-700' : activeTab === 'turnover' ? 'bg-amber-500 text-white border-b border-amber-600' : 'bg-slate-100 text-slate-600 border-b border-slate-200'}\`}>
                      <tr>
                          <th className="px-2 py-2 font-bold">訂單序</th>
                          <th className="px-2 py-2 font-bold text-center">訂單日</th>
                          <th className="px-2 py-2 font-bold text-center">結案日</th>
                          <th className="px-2 py-2 font-bold text-right">天數</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                      {filteredData.length === 0 ? (
                          <tr>
                              <td colSpan={4} className="px-2 py-6 text-center text-slate-400">沒有符合的資料</td>
                          </tr>
                      ) : (
                          filteredData.map(item => {
                              // Calculate date and days
                              const items = orderItems.filter(i => i.orderGroupId === item.id);
                              
                              let orderDate = '';
                              if (items.length > 0) {
                                  // extract from items.date
                                  const dates = items.map(i => i.date).filter(Boolean);
                                  
                                  if (dates.length > 0) {
                                      const sorted = dates.sort((a,b) => {
                                          let da = new Date(a).getTime();
                                          let db = new Date(b).getTime();
                                          if (!isNaN(da) && !isNaN(db)) return da - db;
                                          return a.localeCompare(b);
                                      });
                                      
                                      const dObj = new Date(sorted[0]);
                                      if (!isNaN(dObj.getTime())) {
                                          orderDate = \`\${dObj.getMonth()+1}/\${dObj.getDate()}\`;
                                      } else {
                                          orderDate = sorted[0];
                                          let m = orderDate.match(/(\\d{1,2}\\/\\d{1,2})/);
                                          if (m) orderDate = m[1];
                                      }
                                  }
                              }

                              let closedDate = '';
                              if (item.status === 'closed') {
                                  const m = item.paymentNote?.match(/(\\d{1,2}\\/\\d{1,2})/);
                                  if (m) closedDate = m[1];
                                  if (!closedDate) {
                                      const m2 = items.map(i => i.remarks).join(' ').match(/(\\d{1,2}\\/\\d{1,2})/);
                                      if (m2) closedDate = m2[1];
                                  }
                                  if (!closedDate) {
                                      const m3 = items.map(i => i.note).join(' ').match(/(\\d{1,2}\\/\\d{1,2})/);
                                      if (m3) closedDate = m3[1];
                                  }
                              }
                              
                              let days = 0;
                              if (orderDate) {
                                  const oPts = orderDate.split('/');
                                  let dStart = oPts.length === 2 ? new Date(new Date().getFullYear(), parseInt(oPts[0])-1, parseInt(oPts[1])) : new Date(orderDate);
                                  let dEnd = new Date(); // If not closed, calculate until today
                                  
                                  if (closedDate) {
                                      const cPts = closedDate.split('/');
                                      if (cPts.length === 2) {
                                          dEnd = new Date(new Date().getFullYear(), parseInt(cPts[0])-1, parseInt(cPts[1]));
                                      }
                                  }
                                  
                                  if (!isNaN(dStart.getTime()) && !isNaN(dEnd.getTime())) {
                                      days = Math.max(0, Math.floor((dEnd.getTime() - dStart.getTime()) / (1000 * 3600 * 24)));
                                  }
                                  // Assign computed days to item object so we can use it in Footer reducing
                                  (item as any).turnoverDays = days;
                              }

                              return (
                                  <tr key={item.id} className={\`\${item.status === 'processing' ? 'bg-emerald-50/80 hover:bg-emerald-100/80' : item.status === 'preorder' ? 'bg-rose-50/80 hover:bg-rose-100/80' : 'bg-yellow-50/80 hover:bg-yellow-100/80'}\`}>
                                      <td className="px-2 py-2 font-mono font-bold text-slate-600 truncate">{item.id}</td>
                                      <td className="px-2 py-2 text-center font-mono font-bold text-slate-500">{orderDate || '-'}</td>
                                      <td className="px-2 py-2 text-center font-mono font-bold text-slate-500">{closedDate || '-'}</td>
                                      <td className={\`px-2 py-2 text-right font-mono font-bold \${days > 14 ? 'text-rose-600' : 'text-slate-700'}\`}>
                                          {days > 0 ? days : '-'}
                                      </td>
                                  </tr>
                              );
                          })
                      )}
                  </tbody>
                  {filteredData.length > 0 && (
                      <tfoot className="sticky bottom-0 z-10 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] border-t-2 bg-amber-200 border-amber-400 text-amber-900">
                          <tr>
                              <td className="px-2 py-2 font-bold border-r border-amber-300">平均天數</td>
                              <td colSpan={2} className="px-2 py-2 font-bold text-center border-r border-amber-300"></td>
                              <td className="px-2 py-2 text-right font-mono font-bold">
                                  {(() => {
                                      const validItems = filteredData.filter(d => (d as any).turnoverDays > 0);
                                      if (validItems.length === 0) return '-';
                                      const sumDays = validItems.reduce((acc, obj) => acc + (obj as any).turnoverDays, 0);
                                      return (sumDays / validItems.length).toFixed(1);
                                  })()}
                              </td>
                          </tr>
                      </tfoot>
                  )}
              </table>`;
              
content = content.replace(turnoverTableRegex, newTurnoverTableStr);

// 5. Update Purchase summary text colors
const purchaseSummaryAreaStrOld = `<div className="w-1/3 text-left flex items-baseline">
                            總收入 <span className="font-mono text-[15px] font-bold text-slate-800 ml-1.5">{formatCurrency(totalRevenue)}</span>
                        </div>
                        <div className="w-1/3 text-center flex items-baseline justify-center">
                            總金額 <span className="font-mono text-[15px] font-bold text-orange-600 ml-1.5">{formatCurrency(totalPurchase)}</span>
                        </div>
                        <div className="w-1/3 text-right flex items-baseline justify-end">
                            百分比 <span className="font-mono text-[15px] font-bold text-fuchsia-600 ml-1.5">{percentage}%</span>
                        </div>`;
const purchaseSummaryAreaStrNew = `<div className="w-1/3 text-left flex items-baseline">
                            <span className="text-slate-500">總收入</span> <span className="font-mono text-[13px] font-bold text-slate-600 ml-1.5">{formatCurrency(totalRevenue)}</span>
                        </div>
                        <div className="w-1/3 text-center flex items-baseline justify-center">
                            <span className="text-slate-500">總金額</span> <span className="font-mono text-[13px] font-bold text-slate-600 ml-1.5">{formatCurrency(totalPurchase)}</span>
                        </div>
                        <div className="w-1/3 text-right flex items-baseline justify-end">
                            <span className="text-slate-500">百分比</span> <span className="font-mono text-[13px] font-bold text-slate-600 ml-1.5">{percentage}%</span>
                        </div>`;
                        
content = content.replace(purchaseSummaryAreaStrOld, purchaseSummaryAreaStrNew);

fs.writeFileSync('components/EcommerceAnalysisSystem.tsx', content);
console.log("Patched all requirements");
