const fs = require('fs');
let code = fs.readFileSync('components/WithdrawalView.tsx', 'utf8');

const monthlyJSXOld = `{overviewSubTab === 'monthly' && (
          <div className="flex-1 flex flex-col min-h-0 px-1 space-y-1 pb-16">
            <div className="flex-1 bg-white rounded-lg shadow-sm border border-slate-200 flex flex-col min-h-0 text-[10px]">
              <div className="shrink-0 grid grid-cols-[2fr_1.5fr_0.5fr_1.5fr_0.5fr_1.5fr] bg-slate-100 p-1 border-b border-slate-200 text-slate-600 font-bold text-center items-center rounded-t-lg">`;

const monthlyJSXNew = `{overviewSubTab === 'monthly' && overviewMonthlyData && (
          <div className="flex-1 flex flex-col min-h-0 px-1 space-y-1 pb-16">
            <div className="shrink-0 bg-white rounded-lg shadow-sm border border-slate-200 p-1.5 h-52">
              {overviewMonthlyData.chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={overviewMonthlyData.chartData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} tickFormatter={(val) => \`\${val}月\`} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} tickFormatter={(val) => \`\${val/1000}k\`} />
                    <Tooltip cursor={{fill: '#f1f5f9'}} contentStyle={{fontSize: '12px', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} formatter={(val: number) => val.toLocaleString()} />
                    <Legend verticalAlign="top" align="right" content={renderCustomLegend} />
                    {overviewMonthlyData.allFeeTypes.map((type, idx) => (
                      <Bar key={type} dataKey={type} stackId="a" fill={COLORS[idx % COLORS.length]} />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-slate-400">
                  <span className="font-bold text-sm">無資料</span>
                </div>
              )}
            </div>
            
            <div className="flex-1 bg-white rounded-lg shadow-sm border border-slate-200 flex flex-col min-h-0 text-[10px]">
              <div className="shrink-0 grid grid-cols-[2fr_1.5fr_0.5fr_1.5fr_0.5fr_1.5fr] bg-slate-100 p-1 border-b border-slate-200 text-slate-600 font-bold text-center items-center rounded-t-lg">`;

code = code.replace(monthlyJSXOld, monthlyJSXNew);

code = code.replace(/overviewMonthlyData\.map/g, 'overviewMonthlyData.tableData.map');
code = code.replace(/overviewMonthlyData\.length/g, 'overviewMonthlyData.tableData.length');
code = code.replace(/overviewMonthlyData\.reduce/g, 'overviewMonthlyData.tableData.reduce');

fs.writeFileSync('components/WithdrawalView.tsx', code);
