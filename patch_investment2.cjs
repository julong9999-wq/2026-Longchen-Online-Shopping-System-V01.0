const fs = require('fs');
let code = fs.readFileSync('components/InvestmentXXXXView.tsx', 'utf8');

// Update Withdrawal logic
const oldWd = /\/\/ 1\. Withdrawal[\s\S]*?\/\/ 2\. Lending/;
const newWd = `// 1. Withdrawal
        parsedWd.forEach((r: any) => {
          let acc = r['證券戶']?.trim();
          if (acc === '信用卡') acc = '俊龍';
          if (activeAccount !== 'all' && acc !== activeAccount) return;
          const m = getMonthKey(r['日期']);
          if (m) initMonth(m).withdrawalAmount += parseFloat(r['金額']?.replace(/,/g, '') || '0');
        });

        // 2. Lending`;
code = code.replace(oldWd, newWd);

// Update Pledge & Broker logic
const oldPledge = /\/\/ 3\. Pledge[\s\S]*?\/\/ 4\. Prices Processing/;
const newPledge = `// 3. Pledge
        const marginLoanMonthlyDelta = new Map<string, number>();
        parsedPledge.forEach((r: any) => {
          const acc = r['證券戶']?.trim();
          if (activeAccount !== 'all' && acc !== activeAccount) return;
          const loanAmt = parseFloat(r['貸款金額']?.replace(/,/g, '') || '0');
          
          if (!isNaN(loanAmt)) {
            const lendM = getMonthKey(r['貸款日期']);
            if (lendM) marginLoanMonthlyDelta.set(lendM, (marginLoanMonthlyDelta.get(lendM) || 0) + loanAmt);

            const returnM = getMonthKey(r['還款日期']);
            if (returnM) marginLoanMonthlyDelta.set(returnM, (marginLoanMonthlyDelta.get(returnM) || 0) - loanAmt);
          }
          
          const returnM = getMonthKey(r['還款日期']);
          if (returnM) {
            initMonth(returnM).marginInterest += parseFloat(r['貸款利息']?.replace(/,/g, '') || '0');
          }
        });

        const secLoanMonthlyDelta = new Map<string, number>();
        parsedBroker.forEach((r: any) => {
          let acc = r['證劵戶']?.trim();
          if (activeAccount !== 'all' && acc !== activeAccount) return;
          const m = getMonthKey(r['交易日']);
          if (!m) return;
          
          const summary = r['摘要']?.trim();
          if (summary === '撥款') {
            const amt = parseFloat(r['收入']?.replace(/,/g, '') || '0');
            secLoanMonthlyDelta.set(m, (secLoanMonthlyDelta.get(m) || 0) + amt);
          } else if (summary === '還款') {
            const amt = parseFloat(r['支出']?.replace(/,/g, '') || '0');
            secLoanMonthlyDelta.set(m, (secLoanMonthlyDelta.get(m) || 0) - amt);
          } else if (summary === '利息') {
            const amt = parseFloat(r['支出']?.replace(/,/g, '') || '0');
            initMonth(m).securitiesInterest += amt;
          }
        });

        // 4. Prices Processing`;
code = code.replace(oldPledge, newPledge);

fs.writeFileSync('components/InvestmentXXXXView.tsx', code);
