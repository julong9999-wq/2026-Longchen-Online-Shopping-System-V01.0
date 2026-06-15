const fs = require('fs');
let txt = fs.readFileSync('components/TravelSystem.tsx', 'utf-8');

const targetEnd = `                 </div>
             )}
          </div>

          {/* Slogan Modal */}`;

const insertView = `                 </div>
             )}
             
             {view === 'analysis' && (
                 <div className="flex flex-col h-full bg-slate-50 p-4">
                     <h2 className="text-xl font-bold text-slate-800 mb-4">{activeTrip?.location ? \`\${activeTrip.location} - 花費分析\` : '花費分析'}</h2>
                     <div className="flex-1 overflow-y-auto">
                         {activeExpenses.length === 0 ? (
                             <div className="text-center py-10 text-slate-400 bg-white rounded-xl shadow-sm border border-slate-200">目前無任何記帳紀錄</div>
                         ) : (
                             <div className="flex flex-col gap-6 pb-6 pt-1">
                                 {/* 年月金額 Table & Bar Chart */}
                                 <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                                     <h3 className="font-bold text-slate-700 mb-3 flex items-center gap-2">
                                         <BarChartIcon size={18} className="text-purple-600" /> 年月金額
                                     </h3>
                                     <div className="h-48 mb-4">
                                         <ResponsiveContainer width="100%" height="100%">
                                             <BarChart data={Object.entries(activeExpenses.reduce((acc, exp) => {
                                                 const ym = exp.date.substring(0, 7);
                                                 acc[ym] = (acc[ym] || 0) + exp.amount;
                                                 return acc;
                                             }, {})).map(([name, value]) => ({name, value}))}>
                                                 <XAxis dataKey="name" fontSize={12} tickMargin={5} />
                                                 <YAxis fontSize={12} />
                                                 <Tooltip formatter={(value) => formatCurrency(value)} />
                                                 <Bar dataKey="value" fill="#8b5cf6" radius={[4,4,0,0]} />
                                             </BarChart>
                                         </ResponsiveContainer>
                                     </div>
                                     <table className="w-full text-sm text-left">
                                         <thead className="bg-slate-50 text-slate-500"><tr><th className="p-2 font-bold rounded-tl-lg">年月</th><th className="p-2 text-right font-bold rounded-tr-lg">金額</th></tr></thead>
                                         <tbody className="divide-y divide-slate-100">
                                             {Object.entries(activeExpenses.reduce((acc, exp) => {
                                                 const ym = exp.date.substring(0, 7);
                                                 acc[ym] = (acc[ym] || 0) + exp.amount;
                                                 return acc;
                                             }, {})).sort().map(([ym, total]) => (
                                                 <tr key={ym}><td className="p-2 text-slate-600 font-mono">{ym}</td><td className="p-2 text-right font-bold text-slate-800">{formatCurrency(total)}</td></tr>
                                             ))}
                                         </tbody>
                                     </table>
                                 </div>

                                 {/* 分類金額 Pie Chart & Table */}
                                 <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                                     <h3 className="font-bold text-slate-700 mb-3 flex items-center gap-2">
                                         <PieChartIcon size={18} className="text-orange-500" /> 分類金額
                                     </h3>
                                     <div className="h-48 mb-4">
                                         <ResponsiveContainer width="100%" height="100%">
                                             <PieChart>
                                                 <Pie data={Object.entries(activeExpenses.reduce((acc, exp) => {
                                                     acc[exp.category] = (acc[exp.category] || 0) + exp.amount;
                                                     return acc;
                                                 }, {})).map(([name, value]) => ({name, value}))} cx="50%" cy="50%" innerRadius={40} outerRadius={70} dataKey="value" stroke="none">
                                                     {Object.entries(activeExpenses.reduce((acc, exp) => {
                                                         acc[exp.category] = (acc[exp.category] || 0) + exp.amount;
                                                         return acc;
                                                     }, {})).map((entry, index) => (
                                                         <Cell key={\`cell-\${index}\`} fill={['#f97316', '#3b82f6', '#10b981', '#f43f5e', '#ec4899', '#6366f1'][index % 6]} />
                                                     ))}
                                                 </Pie>
                                                 <Tooltip formatter={(value) => formatCurrency(value)} />
                                             </PieChart>
                                         </ResponsiveContainer>
                                     </div>
                                     <table className="w-full text-sm text-left">
                                         <thead className="bg-slate-50 text-slate-500"><tr><th className="p-2 font-bold rounded-tl-lg">分類</th><th className="p-2 text-right font-bold rounded-tr-lg">金額</th></tr></thead>
                                         <tbody className="divide-y divide-slate-100">
                                             {Object.entries(activeExpenses.reduce((acc, exp) => {
                                                 acc[exp.category] = (acc[exp.category] || 0) + exp.amount;
                                                 return acc;
                                             }, {})).sort((a,b)=>b[1]-a[1]).map(([cat, total]) => (
                                                 <tr key={cat}><td className="p-2 text-slate-600"><span className="inline-block w-2 h-2 rounded-full mr-2" style={{backgroundColor: ['#f97316', '#3b82f6', '#10b981', '#f43f5e', '#ec4899', '#6366f1'][Object.keys(activeExpenses.reduce((o, e) => { o[e.category] = 1; return o; }, {})).indexOf(cat) % 6 || 0]}}></span>{cat}</td><td className="p-2 text-right font-bold text-slate-800">{formatCurrency(total)}</td></tr>
                                             ))}
                                         </tbody>
                                     </table>
                                 </div>

                                 {/* 付款人金額 Table & Bar Chart */}
                                 <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                                     <h3 className="font-bold text-slate-700 mb-3 flex items-center gap-2">
                                         <BarChartIcon size={18} className="text-emerald-500" /> 付款人金額
                                     </h3>
                                      <div className="h-48 mb-4">
                                         <ResponsiveContainer width="100%" height="100%">
                                             <BarChart data={Object.entries(activeExpenses.reduce((acc, exp) => {
                                                 acc[exp.payer] = (acc[exp.payer] || 0) + exp.amount;
                                                 return acc;
                                             }, {})).map(([name, value]) => ({name, value}))} layout="vertical">
                                                 <XAxis type="number" fontSize={12} />
                                                 <YAxis dataKey="name" type="category" fontSize={12} width={50} />
                                                 <Tooltip formatter={(value) => formatCurrency(value)} />
                                                 <Bar dataKey="value" fill="#10b981" radius={[0,4,4,0]} />
                                             </BarChart>
                                         </ResponsiveContainer>
                                     </div>
                                     <table className="w-full text-sm text-left">
                                         <thead className="bg-slate-50 text-slate-500"><tr><th className="p-2 font-bold rounded-tl-lg">付款人</th><th className="p-2 text-right font-bold rounded-tr-lg">金額</th></tr></thead>
                                         <tbody className="divide-y divide-slate-100">
                                             {Object.entries(activeExpenses.reduce((acc, exp) => {
                                                 acc[exp.payer] = (acc[exp.payer] || 0) + exp.amount;
                                                 return acc;
                                             }, {})).sort((a,b)=>b[1]-a[1]).map(([payer, total]) => (
                                                 <tr key={payer}><td className="p-2 text-slate-600">{payer}</td><td className="p-2 text-right font-bold text-slate-800">{formatCurrency(total)}</td></tr>
                                             ))}
                                         </tbody>
                                     </table>
                                 </div>
                             </div>
                         )}
                     </div>
                 </div>
             )}
          </div>

          {/* Slogan Modal */}`;

txt = txt.replace(targetEnd, insertView);
fs.writeFileSync('components/TravelSystem.tsx', txt);
