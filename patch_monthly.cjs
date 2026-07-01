const fs = require('fs');
let code = fs.readFileSync('components/WithdrawalView.tsx', 'utf8');

const newMemo = `
  const overviewMonthlyData = useMemo(() => {
    if (activeTab !== 'overview' || overviewSubTab !== 'monthly') return null;
    
    const currentYear = selectedYear;
    const prevYear = selectedYear - 1;
    const months = Array.from({ length: 12 }, (_, i) => i + 1);
    
    const allFeeTypesSet = new Set<string>();
    
    const tableData = months.map(m => {
       const currentRecords = filteredRecords.filter(r => r.year === currentYear && r.month === m && r.feeType !== '虛擬帳戶');
       const prevRecords = filteredRecords.filter(r => r.year === prevYear && r.month === m && r.feeType !== '虛擬帳戶');
       const totalRecords = filteredRecords.filter(r => r.month === m && r.feeType !== '虛擬帳戶');
       
       const currentSum = currentRecords.reduce((sum, r) => sum + r.amount, 0);
       const prevSum = prevRecords.reduce((sum, r) => sum + r.amount, 0);
       const totalSum = totalRecords.reduce((sum, r) => sum + r.amount, 0);
       
       currentRecords.forEach(r => { if (r.feeType) allFeeTypesSet.add(r.feeType); });
       
       return {
          month: m,
          current: currentSum,
          prev: prevSum,
          total: totalSum
       };
    });
    
    const allFeeTypes = Array.from(allFeeTypesSet).sort((a, b) => a.localeCompare(b, 'zh-TW'));
    
    const chartData = months.map(m => {
      const currentRecords = filteredRecords.filter(r => r.year === currentYear && r.month === m && r.feeType !== '虛擬帳戶');
      const dataPoint: any = { month: m };
      currentRecords.forEach(r => {
         if (r.feeType) {
            dataPoint[r.feeType] = (dataPoint[r.feeType] || 0) + r.amount;
         }
      });
      return dataPoint;
    });

    return { tableData, chartData, allFeeTypes };
  }, [filteredRecords, selectedYear, activeTab, overviewSubTab]);
`;

code = code.replace(/const overviewMonthlyData = useMemo\(\(\) => \{[\s\S]*?\}, \[filteredRecords, selectedYear, activeTab, overviewSubTab\]\);/g, newMemo.trim());

fs.writeFileSync('components/WithdrawalView.tsx', code);
