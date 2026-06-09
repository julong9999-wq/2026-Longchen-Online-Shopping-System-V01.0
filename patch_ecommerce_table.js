import fs from 'fs';

let content = fs.readFileSync('components/EcommerceAnalysisSystem.tsx', 'utf-8');

const tableBlockStart = `<table className="w-full text-left text-sm">
                  <thead className="bg-slate-100 text-slate-600 border-b border-slate-200 sticky top-0 z-10 shadow-sm">`;

const wholeTableRegex = /<table className="w-full text-left text-sm">[\s\S]+?<\/table>/;
const match = content.match(wholeTableRegex);

if (match) {
    const originalTable = match[0];
    
    const newTableLogic = `{activeTab !== 'turnover' ? (
              <table className="w-full text-left text-sm">
                  <thead className="bg-slate-100 text-slate-600 border-b border-slate-200 sticky top-0 z-10 shadow-sm">
                      <tr>
                          <th className="px-2 py-2 font-bold w-1/4">訂單序</th>
                          <th className="px-2 py-2 font-bold text-right w-1/4">收入</th>
                          <th className="px-2 py-2 font-bold text-right w-1/4">{activeTab === 'shipping' ? '國際運費' : '利潤'}</th>
                          <th className="px-2 py-2 font-bold text-right w-1/4">百分比</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                      {filteredData.length === 0 ? (
                          <tr>
                              <td colSpan={4} className="px-2 py-6 text-center text-slate-400">沒有符合的資料</td>
                          </tr>
                      ) : (
                          filteredData.map(item => {
                              const val = activeTab === 'shipping' ? item.intlShip : item.profit;
                              let percentage = 0;
                              if (item.revenue > 0) percentage = (val / item.revenue) * 100;
  
                              return (
                                  <tr key={item.id} className={\`\${item.status === 'processing' ? 'bg-emerald-50/80 hover:bg-emerald-100/80' : item.status === 'preorder' ? 'bg-rose-50/80 hover:bg-rose-100/80' : 'bg-yellow-50/80 hover:bg-yellow-100/80'}\`}>
                                      <td className="px-2 py-2 font-mono font-bold text-slate-600 truncate">{item.id}</td>
                                      <td className="px-2 py-2 text-right font-mono font-bold text-blue-600">{formatCurrency(item.revenue)}</td>
                                      <td className={\`px-2 py-2 text-right font-mono font-bold \${activeTab === 'shipping' ? 'text-amber-600' : (val > 0 ? 'text-emerald-600' : 'text-rose-600')}\`}>
                                          {formatCurrency(val)}
                                      </td>
                                      <td className="px-2 py-2 text-right font-mono font-bold text-slate-700">
                                          {percentage.toFixed(1)}%
                                      </td>
                                  </tr>
                              );
                          })
                      )}
                  </tbody>
                  {filteredData.length > 0 && (
                      <tfoot className="bg-sky-100 border-t-2 border-sky-300 sticky bottom-0 z-10 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
                          <tr>
                              <td className="px-2 py-2 font-bold text-slate-900 border-r border-sky-200">合計</td>
                              <td className="px-2 py-2 text-right font-mono font-bold text-blue-800 border-r border-sky-200">
                                  {formatCurrency(filteredData.reduce((acc, item) => acc + item.revenue, 0))}
                              </td>
                              <td className={\`px-2 py-2 text-right font-mono font-bold border-r border-sky-200 \${activeTab === 'shipping' ? 'text-amber-800' : 'text-emerald-800'}\`}>
                                  {formatCurrency(filteredData.reduce((acc, item) => acc + (activeTab === 'shipping' ? item.intlShip : item.profit), 0))}
                              </td>
                              <td className="px-2 py-2 text-right font-mono font-bold text-slate-900">
                                  {(() => {
                                      const sumRev = filteredData.reduce((acc, item) => acc + item.revenue, 0);
                                      const sumVal = filteredData.reduce((acc, item) => acc + (activeTab === 'shipping' ? item.intlShip : item.profit), 0);
                                      if (sumRev === 0) return '0.0%';
                                      return \`\${((sumVal / sumRev) * 100).toFixed(1)}%\`;
                                  })()}
                              </td>
                          </tr>
                      </tfoot>
                  )}
              </table>
           ) : (
              <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-slate-100 text-slate-600 border-b border-slate-200 sticky top-0 z-10 shadow-sm">
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
                                  // extract mm/dd from items, e.g. "06/04", find earliest
                                  const dates = items.map(i => {
                                      const m = i.description.match(/(\d{1,2}\/\d{1,2})/);
                                      return m ? m[1] : null;
                                  }).filter(Boolean);
                                  
                                  if (dates.length > 0) {
                                      // sort dates to find earliest
                                      const cleanDates = dates.map(d => {
                                          const pts = d.split('/');
                                          return { original: d, val: parseInt(pts[0])*100 + parseInt(pts[1]) };
                                      }).sort((a,b) => a.val - b.val);
                                      orderDate = cleanDates[0].original;
                                  }
                              }

                              let closedDate = '';
                              if (item.status === 'closed') {
                                  // Check remarks for something like "06/10 結案" or just extracting mm/dd
                                  const m = item.paymentNote?.match(/(\d{1,2}\/\d{1,2})/);
                                  if (m) closedDate = m[1];
                                  if (!closedDate) {
                                      // Check items remarks "已通知", etc., try finding date there
                                      const m2 = items.map(i => i.remarks).join(' ').match(/(\d{1,2}\/\d{1,2})/);
                                      if (m2) closedDate = m2[1];
                                  }
                                  // Fallback parsing note
                                  if (!closedDate) {
                                      const m3 = items.map(i => i.note).join(' ').match(/(\d{1,2}\/\d{1,2})/);
                                      if (m3) closedDate = m3[1];
                                  }
                              }
                              
                              let days = 0;
                              if (orderDate) {
                                  const oPts = orderDate.split('/');
                                  let dStart = new Date(new Date().getFullYear(), parseInt(oPts[0])-1, parseInt(oPts[1]));
                                  let dEnd = new Date();
                                  
                                  if (closedDate) {
                                      const cPts = closedDate.split('/');
                                      dEnd = new Date(new Date().getFullYear(), parseInt(cPts[0])-1, parseInt(cPts[1]));
                                  }
                                  
                                  days = Math.floor((dEnd.getTime() - dStart.getTime()) / (1000 * 3600 * 24));
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
              </table>
           )}`;

    content = content.replace(wholeTableRegex, newTableLogic);
}

fs.writeFileSync('components/EcommerceAnalysisSystem.tsx', content);
console.log("Patched table logic");
