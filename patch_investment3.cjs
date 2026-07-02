const fs = require('fs');
let code = fs.readFileSync('components/InvestmentXXXXView.tsx', 'utf8');

// Update cumulative properties assignment
const oldCum = /mData\.investmentAmount = cumInv;\s*mData\.profitLoss = marketValue - prevMarketValue - monthlyNetInvestment;/;
const newCum = `mData.investmentAmount = cumInv;
            mData.marketValueCumulative = marketValue;
            mData.profitLoss = marketValue - cumInv;`;
code = code.replace(oldCum, newCum);

// Add cumulative loans loop after investment processing
const oldSort = /const sortedData = Array\.from\(monthMap\.values\(\)\)\.sort\(\(a, b\) => b\.yearMonth\.localeCompare\(a\.yearMonth\)\);/;
const newSort = `
        const allMonths = Array.from(monthMap.keys()).sort();
        let runningMarginLoan = 0;
        let runningSecLoan = 0;
        
        for (const m of allMonths) {
          runningMarginLoan += (marginLoanMonthlyDelta.get(m) || 0);
          runningSecLoan += (secLoanMonthlyDelta.get(m) || 0);
          
          const mData = monthMap.get(m)!;
          mData.marginLoanCumulative = runningMarginLoan;
          mData.securitiesLoanCumulative = runningSecLoan;
        }

        const sortedData = Array.from(monthMap.values()).sort((a, b) => b.yearMonth.localeCompare(a.yearMonth));`;
code = code.replace(oldSort, newSort);

// Finally, update the UI table
const oldThead = /<th className="p-1\.5 font-bold text-right pr-4">投資金額<\/th>\s*<th className="p-1\.5 font-bold text-right pr-4">損益金額<\/th>\s*<th className="p-1\.5 font-bold text-right pr-4">股息收益<\/th>\s*<th className="p-1\.5 font-bold text-right pr-4">領錢金額<\/th>\s*<th className="p-1\.5 font-bold text-right pr-4">借劵收入<\/th>\s*<th className="p-1\.5 font-bold text-right pr-4">貸款利息<\/th>/;
const newThead = `<th className="p-1.5 font-bold text-right pr-4">投資金額(累)</th>
              <th className="p-1.5 font-bold text-right pr-4">資產市值(累)</th>
              <th className="p-1.5 font-bold text-right pr-4">損益金額</th>
              <th className="p-1.5 font-bold text-right pr-4">股息收益</th>
              <th className="p-1.5 font-bold text-right pr-4">領錢金額</th>
              <th className="p-1.5 font-bold text-right pr-4">借劵收入</th>
              <th className="p-1.5 font-bold text-right pr-4">證金利息</th>
              <th className="p-1.5 font-bold text-right pr-4">證劵利息</th>
              <th className="p-1.5 font-bold text-right pr-4">證金貸款(累)</th>
              <th className="p-1.5 font-bold text-right pr-4">證劵貸款(累)</th>`;
code = code.replace(oldThead, newThead);

const oldTbodyRow = /<td className="p-1\.5 text-right pr-4">\{formatCurrency\(d\.investmentAmount\)\}<\/td>\s*<td className="p-1\.5 text-indigo-600 font-bold text-right pr-4">\{formatCurrency\(d\.profitLoss\)\}<\/td>\s*<td className="p-1\.5 text-green-600 font-bold text-right pr-4">\{formatCurrency\(d\.dividendIncome\)\}<\/td>\s*<td className="p-1\.5 text-right pr-4">\{formatCurrency\(d\.withdrawalAmount\)\}<\/td>\s*<td className="p-1\.5 text-right pr-4">\{formatCurrency\(d\.lendingIncome\)\}<\/td>\s*<td className="p-1\.5 text-right pr-4">\{formatCurrency\(d\.pledgeInterest\)\}<\/td>/;
const newTbodyRow = `<td className="p-1.5 text-right pr-4">{formatCurrency(d.investmentAmount)}</td>
                <td className="p-1.5 text-right pr-4 font-bold">{formatCurrency(d.marketValueCumulative)}</td>
                <td className={\`p-1.5 font-bold text-right pr-4 \${d.profitLoss >= 0 ? 'text-rose-600' : 'text-emerald-600'}\`}>{formatCurrency(d.profitLoss)}</td>
                <td className="p-1.5 text-green-600 font-bold text-right pr-4">{formatCurrency(d.dividendIncome)}</td>
                <td className="p-1.5 text-right pr-4">{formatCurrency(d.withdrawalAmount)}</td>
                <td className="p-1.5 text-right pr-4">{formatCurrency(d.lendingIncome)}</td>
                <td className="p-1.5 text-right pr-4">{formatCurrency(d.marginInterest)}</td>
                <td className="p-1.5 text-right pr-4">{formatCurrency(d.securitiesInterest)}</td>
                <td className="p-1.5 text-right pr-4">{formatCurrency(d.marginLoanCumulative)}</td>
                <td className="p-1.5 text-right pr-4">{formatCurrency(d.securitiesLoanCumulative)}</td>`;
code = code.replace(oldTbodyRow, newTbodyRow);

const oldTotalRow = /<td className="p-1\.5 text-right pr-4 text-indigo-600">\{formatCurrency\(data\.reduce\(\(s, d\) => s \+ d\.profitLoss, 0\)\)\}<\/td>\s*<td className="p-1\.5 text-right pr-4 text-green-600">\{formatCurrency\(data\.reduce\(\(s, d\) => s \+ d\.dividendIncome, 0\)\)\}<\/td>\s*<td className="p-1\.5 text-right pr-4">\{formatCurrency\(data\.reduce\(\(s, d\) => s \+ d\.withdrawalAmount, 0\)\)\}<\/td>\s*<td className="p-1\.5 text-right pr-4">\{formatCurrency\(data\.reduce\(\(s, d\) => s \+ d\.lendingIncome, 0\)\)\}<\/td>\s*<td className="p-1\.5 text-right pr-4">\{formatCurrency\(data\.reduce\(\(s, d\) => s \+ d\.pledgeInterest, 0\)\)\}<\/td>/;

// For cumulative columns, it doesn't make sense to sum them up in the total row. 
// investmentAmount, marketValueCumulative, marginLoanCumulative, securitiesLoanCumulative are running totals.
// Typically you'd show the LATEST month's cumulative value, or just leave it blank.
// Let's just leave it empty or show the latest (data[0] since it's sorted descending) for cumulative, and sum for others.
const newTotalRow = `<td className="p-1.5 text-right pr-4 text-indigo-600">{data.length > 0 ? formatCurrency(data[0].marketValueCumulative) : 0}</td>
                <td className="p-1.5 text-right pr-4 text-indigo-600">{data.length > 0 ? formatCurrency(data[0].profitLoss) : 0}</td>
                <td className="p-1.5 text-right pr-4 text-green-600">{formatCurrency(data.reduce((s, d) => s + d.dividendIncome, 0))}</td>
                <td className="p-1.5 text-right pr-4">{formatCurrency(data.reduce((s, d) => s + d.withdrawalAmount, 0))}</td>
                <td className="p-1.5 text-right pr-4">{formatCurrency(data.reduce((s, d) => s + d.lendingIncome, 0))}</td>
                <td className="p-1.5 text-right pr-4">{formatCurrency(data.reduce((s, d) => s + d.marginInterest, 0))}</td>
                <td className="p-1.5 text-right pr-4">{formatCurrency(data.reduce((s, d) => s + d.securitiesInterest, 0))}</td>
                <td className="p-1.5 text-right pr-4">{data.length > 0 ? formatCurrency(data[0].marginLoanCumulative) : 0}</td>
                <td className="p-1.5 text-right pr-4">{data.length > 0 ? formatCurrency(data[0].securitiesLoanCumulative) : 0}</td>`;
code = code.replace(oldTotalRow, newTotalRow);

// Wait, the original total row for investmentAmount: `<td className="p-1.5 text-right pr-4">{formatCurrency(data.reduce((s, d) => s + d.investmentAmount, 0))}</td>`
// We should replace that one too.
const oldTotalRowFull = /<td className="p-1\.5 font-bold border-r border-slate-200 sticky left-0 z-40 bg-indigo-50\/90 backdrop-blur-sm">合計<\/td>\s*<td className="p-1\.5 text-right pr-4">\{formatCurrency\(data\.reduce\(\(s, d\) => s \+ d\.investmentAmount, 0\)\)\}<\/td>[\s\S]*?<td className="p-1\.5 text-right pr-4">\{formatCurrency\(data\.reduce\(\(s, d\) => s \+ d\.pledgeInterest, 0\)\)\}<\/td>/;

const newTotalRowFull = `<td className="p-1.5 font-bold border-r border-slate-200 sticky left-0 z-40 bg-indigo-50/90 backdrop-blur-sm">合計</td>
                <td className="p-1.5 text-right pr-4 text-indigo-600">{data.length > 0 ? formatCurrency(data[0].investmentAmount) : 0}</td>
                <td className="p-1.5 text-right pr-4 text-indigo-600">{data.length > 0 ? formatCurrency(data[0].marketValueCumulative) : 0}</td>
                <td className="p-1.5 text-right pr-4 text-indigo-600">{data.length > 0 ? formatCurrency(data[0].profitLoss) : 0}</td>
                <td className="p-1.5 text-right pr-4 text-green-600">{formatCurrency(data.reduce((s, d) => s + d.dividendIncome, 0))}</td>
                <td className="p-1.5 text-right pr-4">{formatCurrency(data.reduce((s, d) => s + d.withdrawalAmount, 0))}</td>
                <td className="p-1.5 text-right pr-4">{formatCurrency(data.reduce((s, d) => s + d.lendingIncome, 0))}</td>
                <td className="p-1.5 text-right pr-4">{formatCurrency(data.reduce((s, d) => s + d.marginInterest, 0))}</td>
                <td className="p-1.5 text-right pr-4">{formatCurrency(data.reduce((s, d) => s + d.securitiesInterest, 0))}</td>
                <td className="p-1.5 text-right pr-4">{data.length > 0 ? formatCurrency(data[0].marginLoanCumulative) : 0}</td>
                <td className="p-1.5 text-right pr-4">{data.length > 0 ? formatCurrency(data[0].securitiesLoanCumulative) : 0}</td>`;

code = code.replace(oldTotalRowFull, newTotalRowFull);

fs.writeFileSync('components/InvestmentXXXXView.tsx', code);
