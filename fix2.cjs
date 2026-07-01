const fs = require('fs');
let code = fs.readFileSync('components/WithdrawalView.tsx', 'utf8');

const overviewMonthlyDataHook = `
  const overviewMonthlyData = useMemo(() => {
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

if (!code.includes('const overviewMonthlyData = useMemo')) {
  code = code.replace('const renderOverview = () => {', overviewMonthlyDataHook + 'const renderOverview = () => {');
}

// Ensure the monthly view uses overviewMonthlyData instead of monthlyData
// Replace in the block starting from {overviewSubTab === 'monthly' && (
const monthlyBlockStart = "{overviewSubTab === 'monthly' && (";
const parts = code.split(monthlyBlockStart);
if(parts.length > 1) {
    let monthlyBlock = parts[1];
    
    // The block ends before `{overviewSubTab === 'dividend' && (`
    const nextBlockStart = "{overviewSubTab === 'dividend' && (";
    const innerParts = monthlyBlock.split(nextBlockStart);
    
    if (innerParts.length > 1) {
        innerParts[0] = innerParts[0].replace(/monthlyData\.map/g, 'overviewMonthlyData.map');
        innerParts[0] = innerParts[0].replace(/monthlyData\.length/g, 'overviewMonthlyData.length');
        innerParts[0] = innerParts[0].replace(/monthlyData\.reduce/g, 'overviewMonthlyData.reduce');
        
        parts[1] = innerParts.join(nextBlockStart);
        code = parts.join(monthlyBlockStart);
    }
}

fs.writeFileSync('components/WithdrawalView.tsx', code);
