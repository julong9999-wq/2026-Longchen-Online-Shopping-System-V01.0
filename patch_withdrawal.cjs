const fs = require('fs');
let code = fs.readFileSync('components/WithdrawalView.tsx', 'utf8');

// 1. Rename 'amount' button to '總表明細' and add 'monthly' button
code = code.replace(
  `<button onClick={() => setOverviewSubTab('amount')} className={\`px-2.5 py-1 text-xs rounded-md font-bold transition-colors \${overviewSubTab === 'amount' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'}\`}>領用金額</button>`,
  `<button onClick={() => setOverviewSubTab('amount')} className={\`px-2.5 py-1 text-xs rounded-md font-bold transition-colors \${overviewSubTab === 'amount' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'}\`}>總表明細</button>
          <button onClick={() => setOverviewSubTab('monthly')} className={\`px-2.5 py-1 text-xs rounded-md font-bold transition-colors \${overviewSubTab === 'monthly' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'}\`}>月份明細</button>`
);

// 2. Add monthlyData useMemo
const monthlyDataMemo = `
  const monthlyData = useMemo(() => {
    if (activeTab !== 'overview' || overviewSubTab !== 'monthly') return [];
    
    const currentYear = selectedYear;
    const prevYear = selectedYear - 1;
    const months = Array.from({ length: 12 }, (_, i) => i + 1);
    
    return months.map(m => {
       const currentSum = filteredRecords.filter(r => r.year === currentYear && r.month === m && r.feeType !== '虛擬帳戶').reduce((sum, r) => sum + r.amount, 0);
       const prevSum = filteredRecords.filter(r => r.year === prevYear && r.month === m && r.feeType !== '虛擬帳戶').reduce((sum, r) => sum + r.amount, 0);
       const totalSum = filteredRecords.filter(r => r.month === m && r.feeType !== '虛擬帳戶').reduce((sum, r) => sum + r.amount, 0);
       return {
          month: m,
          current: currentSum,
          prev: prevSum,
          total: totalSum
       };
    });
  }, [filteredRecords, selectedYear, activeTab, overviewSubTab]);
`;

// Insert it before `const chartData = useMemo(() => {`
code = code.replace(`const chartData = useMemo(() => {`, monthlyDataMemo + '\n  const chartData = useMemo(() => {');

// 3. Render 'monthly' view block
const monthlyViewBlock = `
        {overviewSubTab === 'monthly' && (
          <div className="flex-1 flex flex-col min-h-0 px-1 space-y-1 pb-16">
            <div className="flex-1 bg-white rounded-lg shadow-sm border border-slate-200 flex flex-col min-h-0 text-[10px]">
              <div className="shrink-0 grid grid-cols-[2fr_1.5fr_0.5fr_1.5fr_0.5fr_1.5fr] bg-slate-100 p-1 border-b border-slate-200 text-slate-600 font-bold text-center items-center rounded-t-lg">
                <div className="text-left pl-1">月份</div>
                <div className="text-indigo-600 text-right">{selectedYear}</div>
                <button onClick={handleNextYear} disabled={!availableYears.find(y => y > selectedYear)} className="hover:bg-slate-300 rounded p-0.5 disabled:opacity-30 mx-auto"><ChevronRight size={14}/></button>
                <div className="text-right">{selectedYear - 1}</div>
                <button onClick={handlePrevYear} disabled={!availableYears.find(y => y < selectedYear)} className="hover:bg-slate-300 rounded p-0.5 disabled:opacity-30 mx-auto"><ChevronLeft size={14}/></button>
                <div className="text-right pr-1">合計</div>
              </div>
              <div className="flex-1 overflow-y-auto no-scrollbar divide-y divide-slate-100">
                {monthlyData.map(item => (
                  <div key={item.month} className="grid grid-cols-[2fr_1.5fr_0.5fr_1.5fr_0.5fr_1.5fr] p-1.5 items-center hover:bg-slate-50 transition-colors">
                    <div className="font-bold text-left text-slate-700 pl-1">{item.month}月</div>
                    <div className="text-right text-indigo-600 font-bold">{formatCurrency(item.current)}</div>
                    <div></div>
                    <div className="text-right font-bold text-slate-600">{formatCurrency(item.prev)}</div>
                    <div></div>
                    <div className="text-right font-bold text-slate-700 pr-1">{formatCurrency(item.total)}</div>
                  </div>
                ))}
                {monthlyData.length > 0 && (
                  <div className="grid grid-cols-[2fr_1.5fr_0.5fr_1.5fr_0.5fr_1.5fr] p-1.5 items-center bg-indigo-100/50 sticky bottom-0 border-t border-indigo-200">
                    <div className="font-bold text-left text-indigo-900 pl-1">合計</div>
                    <div className="text-right text-indigo-700 font-bold">{formatCurrency(monthlyData.reduce((sum, m) => sum + m.current, 0))}</div>
                    <div></div>
                    <div className="text-right font-bold text-slate-700">{formatCurrency(monthlyData.reduce((sum, m) => sum + m.prev, 0))}</div>
                    <div></div>
                    <div className="text-right font-bold text-slate-800 pr-1">{formatCurrency(monthlyData.reduce((sum, m) => sum + m.total, 0))}</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
`;

code = code.replace(`{overviewSubTab === 'dividend' && (`, monthlyViewBlock + `\n        {overviewSubTab === 'dividend' && (`);

// 4. Update the '購買金額' to '投資金額(累)'
code = code.replace(`<div className="text-right">購買金額</div>`, `<div className="text-right">投資金額(累)</div>`);

// 5. Fix cumulative investment formula
// Find:
/*
    purchases.forEach(r => {
      if (r.buySell === '買入') {
        const parts = r.date.split('/');
        if (parts.length >= 2) {
          const year = parseInt(parts[0], 10);
          if (!yearlyData.has(year)) yearlyData.set(year, { year, purchase: 0, dividend: 0, withdrawal: 0 });
          yearlyData.get(year)!.purchase += (r.price * r.shares + r.fee + r.tax);
        }
      }
    });
*/
// Replace with logic that tracks cumulative investment correctly over the years.
const oldPurchaseLogic = `
    purchases.forEach(r => {
      if (r.buySell === '買入') {
        const parts = r.date.split('/');
        if (parts.length >= 2) {
          const year = parseInt(parts[0], 10);
          if (!yearlyData.has(year)) yearlyData.set(year, { year, purchase: 0, dividend: 0, withdrawal: 0 });
          yearlyData.get(year)!.purchase += (r.price * r.shares + r.fee + r.tax);
        }
      }
    });
`;

const newPurchaseLogic = `
    purchases.forEach(r => {
      const parts = r.date.split('/');
      if (parts.length >= 2) {
        const year = parseInt(parts[0], 10);
        if (!yearlyData.has(year)) yearlyData.set(year, { year, purchase: 0, dividend: 0, withdrawal: 0 });
        if (r.buySell === '買入') {
          yearlyData.get(year)!.purchase += (r.price * r.shares + r.fee + r.tax);
        } else if (r.buySell === '賣出') {
          yearlyData.get(year)!.purchase -= (r.price * r.shares - r.fee - r.tax);
        }
      }
    });
`;
code = code.replace(oldPurchaseLogic.trim(), newPurchaseLogic.trim());

fs.writeFileSync('components/WithdrawalView.tsx', code);
