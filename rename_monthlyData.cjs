const fs = require('fs');
let code = fs.readFileSync('components/WithdrawalView.tsx', 'utf8');

code = code.replace(
  "const monthlyData = useMemo(() => {\n    if (activeTab !== 'overview' || overviewSubTab !== 'monthly') return [];",
  "const overviewMonthlyData = useMemo(() => {\n    if (activeTab !== 'overview' || overviewSubTab !== 'monthly') return [];"
);

// We know the JSX block for overviewSubTab === 'monthly' is where we need to replace monthlyData -> overviewMonthlyData
// But be careful not to replace it in the other tabs' code.
const parts = code.split("{overviewSubTab === 'monthly' && (");
if(parts.length > 1) {
    parts[1] = parts[1].replace(/monthlyData\.map/g, 'overviewMonthlyData.map');
    parts[1] = parts[1].replace(/monthlyData\.length/g, 'overviewMonthlyData.length');
    parts[1] = parts[1].replace(/monthlyData\.reduce/g, 'overviewMonthlyData.reduce');
    code = parts.join("{overviewSubTab === 'monthly' && (");
}

fs.writeFileSync('components/WithdrawalView.tsx', code);
