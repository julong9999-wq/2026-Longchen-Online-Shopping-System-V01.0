import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import Papa from 'papaparse';

const CSV_URL_AP217 = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQaRKeSBt4XfeC9uNf56p38DwscoPK0-eFM3J4-Vz8LeVBdgsClDZy0baU-FHyFv5cz-QNCXUVMwBfr/pub?output=csv'; 
const CSV_URL_AP213_HISTORY = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQaRKeSBt4XfeC9uNf56p38DwscoPK0-eFM3J4-Vz8LeVBdgsClDZy0baU-FHyFv5cz-QNCXUVMwBfr/pub?gid=462296829&single=true&output=csv';
const CSV_URL_WITHDRAWAL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSnkojvITxtjSfxyv0D85BEfMv80ANLdGyXGZih5prz6-W_0KfP1Fr5fRFwx8jUGkvEIQjoVa4afbnJ/pub?gid=24682956&single=true&output=csv';
const CSV_URL_LENDING = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSnkojvITxtjSfxyv0D85BEfMv80ANLdGyXGZih5prz6-W_0KfP1Fr5fRFwx8jUGkvEIQjoVa4afbnJ/pub?gid=1204781169&single=true&output=csv';
const CSV_URL_PLEDGE = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSnkojvITxtjSfxyv0D85BEfMv80ANLdGyXGZih5prz6-W_0KfP1Fr5fRFwx8jUGkvEIQjoVa4afbnJ/pub?gid=1021924150&single=true&output=csv';
const CSV_URL_BROKER = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSnkojvITxtjSfxyv0D85BEfMv80ANLdGyXGZih5prz6-W_0KfP1Fr5fRFwx8jUGkvEIQjoVa4afbnJ/pub?gid=1923278022&single=true&output=csv';
const CSV_URL_INV = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSnkojvITxtjSfxyv0D85BEfMv80ANLdGyXGZih5prz6-W_0KfP1Fr5fRFwx8jUGkvEIQjoVa4afbnJ/pub?gid=522688960&single=true&output=csv';
const CSV_URL_AP215 = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vR5JvOGT3eB4xq9phw2dXHApJKOgQkUZcs69CsJfL0Iw3s6egADwA8HdbimrWUceQZl_73pnsSLVnQw/pub?output=csv';

interface CombinedData {
  yearMonth: string;
  investmentAmount: number;
  marketValueCumulative: number;
  profitLoss: number;
  dividendIncome: number;
  withdrawalAmount: number;
  lendingIncome: number;
  marginInterest: number;
  securitiesInterest: number;
  marginLoanCumulative: number;
  securitiesLoanCumulative: number;
}

export default function InvestmentXXXXView({ activeAccount, refreshKey }: { activeAccount: string, refreshKey: number }) {
  const [data, setData] = useState<CombinedData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const [ap217Res, ap213Res, wdRes, lendRes, pledgeRes, invRes, ap215Res, brokerRes] = await Promise.all([
          fetch(CSV_URL_AP217).then(r => r.text()),
          fetch(CSV_URL_AP213_HISTORY).then(r => r.text()),
          fetch(CSV_URL_WITHDRAWAL).then(r => r.text()),
          fetch(CSV_URL_LENDING).then(r => r.text()),
          fetch(CSV_URL_PLEDGE).then(r => r.text()),
          fetch(CSV_URL_INV).then(r => r.text()),
          fetch(CSV_URL_AP215).then(r => r.text()),
          fetch(CSV_URL_BROKER).then(r => r.text()),
        ]);

        const parsedAP217 = Papa.parse(ap217Res, { header: true, skipEmptyLines: true }).data;
        const parsedAP213 = Papa.parse(ap213Res, { header: true, skipEmptyLines: true }).data;
        const parsedWd = Papa.parse(wdRes, { header: true, skipEmptyLines: true }).data;
        const parsedLend = Papa.parse(lendRes, { header: true, skipEmptyLines: true }).data;
        const parsedPledge = Papa.parse(pledgeRes, { header: true, skipEmptyLines: true }).data;
        const parsedInv = Papa.parse(invRes, { header: true, skipEmptyLines: true }).data;
        const parsedAP215 = Papa.parse(ap215Res, { header: true, skipEmptyLines: true }).data;
        const parsedBroker = Papa.parse(brokerRes, { header: true, skipEmptyLines: true }).data;

        const monthMap = new Map<string, CombinedData>();

        const getMonthKey = (dateStr: string) => {
          if (!dateStr) return null;
          const d = new Date(dateStr);
          if (isNaN(d.getTime())) return null;
          return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}`;
        };

        const initMonth = (m: string) => {
          if (!monthMap.has(m)) {
            monthMap.set(m, {
              yearMonth: m,
              investmentAmount: 0,
              marketValueCumulative: 0,
              profitLoss: 0,
              dividendIncome: 0,
              withdrawalAmount: 0,
              lendingIncome: 0,
              marginInterest: 0,
              securitiesInterest: 0,
              marginLoanCumulative: 0,
              securitiesLoanCumulative: 0
            });
          }
          return monthMap.get(m)!;
        };

        // 1. Withdrawal
        parsedWd.forEach((r: any) => {
          let acc = r['證券戶']?.trim();
          if (acc === '信用卡') acc = '俊龍';
          if (activeAccount !== 'all' && acc !== activeAccount) return;
          const m = getMonthKey(r['日期']);
          if (m) initMonth(m).withdrawalAmount += parseFloat(r['金額']?.replace(/,/g, '') || '0');
        });

        // 2. Lending
        parsedLend.forEach((r: any) => {
          const acc = r['證券戶']?.trim();
          if (activeAccount !== 'all' && acc !== activeAccount) return;
          const returnDate = r['還劵日期']?.trim();
          if (returnDate) {
            const m = getMonthKey(returnDate);
            if (m) {
              const income = parseFloat(r['出借收入']?.replace(/,/g, '') || '0');
              const fee = parseFloat(r['出借服務費']?.replace(/,/g, '') || '0');
              const tax = parseFloat(r['代扣稅額']?.replace(/,/g, '') || '0');
              const type = r['借劵方式']?.trim();
              const shares = parseFloat(r['張數']?.replace(/,/g, '') || '0');
              const base = income - fee - tax;
              initMonth(m).lendingIncome += type === '單張多筆' ? base * shares : base;
            }
          }
        });

        // 3. Pledge
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

        // 4. Prices Processing (AP217 + AP213 History)
        const priceHistory = new Map<string, Map<string, { date: Date, price: number }>>(); // monthKey -> stockId -> {date, price}
        
        const processPriceRow = (r: any) => {
          const dateStr = r['日期'];
          const stockId = r['ETF 代碼'] || r['ETF代碼'];
          const price = parseFloat(r['股價']?.replace(/,/g, '') || '0');
          if (dateStr && stockId && !isNaN(price)) {
            const d = new Date(dateStr);
            const mKey = getMonthKey(dateStr);
            if (mKey) {
              if (!priceHistory.has(mKey)) priceHistory.set(mKey, new Map());
              const current = priceHistory.get(mKey)!.get(stockId);
              if (!current || d.getTime() > current.date.getTime()) {
                priceHistory.get(mKey)!.set(stockId, { date: d, price });
              }
            }
          }
        };
        parsedAP217.forEach(processPriceRow);
        parsedAP213.forEach(processPriceRow);

        // 5. Investment processing (cumulative)
        // Sort inventory by date
        const validInv = (parsedInv as any[]).filter((r: any) => {
           if (activeAccount !== 'all' && r['證券戶']?.trim() !== activeAccount) return false;
           return r['日期'] && !isNaN(new Date(r['日期']).getTime());
        }).sort((a: any, b: any) => new Date(a['日期']).getTime() - new Date(b['日期']).getTime());

        // Calculate Dividends from AP215
        const dividendEvents = parsedAP215.map((r: any) => {
             const dps = parseFloat(String(r['除息金額 '] || r['除息金額'] || '0').replace(/,/g, ''));
             return {
                stockId: String(r['ETF 代碼'] || r['ETF代碼'] || '').trim(),
                exDate: String(r['除息日期 '] || r['除息日期'] || '').trim(),
                dividendPerShare: isNaN(dps) ? 0 : dps,
             };
        }).filter(r => r.exDate && r.exDate !== '-');

        dividendEvents.forEach(ev => {
            const exDateTime = new Date(ev.exDate).getTime();
            if (isNaN(exDateTime)) return;
            const mKey = getMonthKey(ev.exDate);
            if (!mKey) return;
            
            let heldShares = 0;
            for (const tx of validInv) {
                const txTime = new Date(tx['日期']).getTime();
                if (txTime <= exDateTime) {
                    const type = tx['買賣別']?.trim();
                    const stockId = tx['股號']?.trim();
                    const shares = parseFloat(tx['股數']?.replace(/,/g, '') || '0');
                    if (stockId === ev.stockId) {
                        if (type === '買入') heldShares += shares;
                        if (type === '賣出') heldShares -= shares;
                    }
                } else {
                    break;
                }
            }
            if (heldShares > 0) {
                initMonth(mKey).dividendIncome += heldShares * ev.dividendPerShare;
            }
        });

        // We want to calculate end-of-month portfolio for every month from the first transaction up to now.
        if (validInv.length > 0) {
          const firstDate = new Date(validInv[0]['日期']);
          const lastDate = new Date(); // current date
          let curYear = firstDate.getFullYear();
          let curMonth = firstDate.getMonth() + 1;
          const endYear = lastDate.getFullYear();
          const endMonth = lastDate.getMonth() + 1;

          let cumInv = 0; // Cumulative net investment
          const portfolio = new Map<string, number>(); // stockId -> cumulative shares
          let invIndex = 0;

          let lastKnownPrices = new Map<string, number>();

          while (curYear < endYear || (curYear === endYear && curMonth <= endMonth)) {
            const mKey = `${curYear}/${String(curMonth).padStart(2, '0')}`;
            
            // Process transactions up to the end of this month
            while (invIndex < validInv.length) {
              const r: any = validInv[invIndex];
              const d = new Date(r['日期']);
              if (d.getFullYear() < curYear || (d.getFullYear() === curYear && d.getMonth() + 1 <= curMonth)) {
                // Apply transaction
                const type = r['買賣別']?.trim();
                const stockId = r['股號']?.trim();
                const shares = parseFloat(r['股數']?.replace(/,/g, '') || '0');
                const price = parseFloat(r['價格']?.replace(/,/g, '') || '0');
                const fee = parseFloat(r['手續費']?.replace(/,/g, '') || '0');
                const tax = parseFloat(r['交易稅']?.replace(/,/g, '') || '0');

                if (stockId) {
                  if (type === '買入') {
                    portfolio.set(stockId, (portfolio.get(stockId) || 0) + shares);
                    cumInv += (price * shares) + fee + tax;
                  } else if (type === '賣出') {
                    portfolio.set(stockId, (portfolio.get(stockId) || 0) - shares);
                    cumInv -= ((price * shares) - fee - tax);
                  }
                }
                invIndex++;
              } else {
                break;
              }
            }

            // Update last known prices with prices from this month
            if (priceHistory.has(mKey)) {
               priceHistory.get(mKey)!.forEach((val, stockId) => {
                 lastKnownPrices.set(stockId, val.price);
               });
            }

            // Calculate market value
            let marketValue = 0;
            portfolio.forEach((shares, stockId) => {
               const price = lastKnownPrices.get(stockId) || 0; // if no price, assume 0 or use last known
               marketValue += shares * price;
            });

            const mData = initMonth(mKey);
            mData.investmentAmount = cumInv;
            mData.marketValueCumulative = marketValue;
            mData.profitLoss = marketValue - cumInv;
            
            curMonth++;
            if (curMonth > 12) {
              curMonth = 1;
              curYear++;
            }
          }
        }

        setData(Array.from(monthMap.values()).sort((a, b) => b.yearMonth.localeCompare(a.yearMonth)));

      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [activeAccount, refreshKey]);

  if (loading) {
    return <div className="p-4 text-center text-sm text-slate-500 font-bold">載入資料中...</div>;
  }

  const formatCurrency = (val: number) => Math.round(val).toLocaleString();

    const [activeTab, setActiveTab] = useState<'investment' | 'income' | 'expense' | 'return'>('investment');

  // Prepare Yearly Data
  const yearlyDataMap = new Map<string, any>();
  
  data.forEach(d => {
    const year = d.yearMonth.substring(0, 4);
    if (!yearlyDataMap.has(year)) {
      yearlyDataMap.set(year, {
        year,
        investmentAmount: 0,
        marginLoanCumulative: 0,
        securitiesLoanCumulative: 0,
        dividendIncome: 0,
        lendingIncome: 0,
        incomeTotal: 0,
        withdrawalAmount: 0,
        marginInterest: 0,
        securitiesInterest: 0,
        expenseTotal: 0,
        profitLoss: 0
      });
    }
    const yData = yearlyDataMap.get(year)!;
    
    yData.dividendIncome += d.dividendIncome;
    yData.lendingIncome += d.lendingIncome;
    yData.withdrawalAmount += d.withdrawalAmount;
    yData.marginInterest += d.marginInterest;
    yData.securitiesInterest += d.securitiesInterest;
    yData.profitLoss += d.profitLoss;
  });
  
  const processedYears = new Set<string>();
  data.forEach(d => {
    const year = d.yearMonth.substring(0, 4);
    if (!processedYears.has(year)) {
      processedYears.add(year);
      const yData = yearlyDataMap.get(year)!;
      yData.investmentAmount = d.investmentAmount;
      yData.marginLoanCumulative = d.marginLoanCumulative;
      yData.securitiesLoanCumulative = d.securitiesLoanCumulative;
    }
  });

  const yearlyData = Array.from(yearlyDataMap.values()).sort((a, b) => b.year.localeCompare(a.year));
  
  yearlyData.forEach(y => {
    y.incomeTotal = y.dividendIncome + y.lendingIncome;
    y.expenseTotal = y.withdrawalAmount + y.marginInterest + y.securitiesInterest;
    y.remainingInvestment = Math.max(0, y.investmentAmount - y.marginLoanCumulative - y.securitiesLoanCumulative);
    y.remainingIncome = Math.max(0, y.incomeTotal - y.withdrawalAmount - y.marginInterest - y.securitiesInterest);
  });

  const renderCustomLegend = (props: any) => {
    const { payload } = props;
    return (
      <ul className="flex flex-wrap justify-end gap-x-2 gap-y-1 mb-2">
        {payload?.map((entry: any, index: number) => (
          <li key={`item-${index}`} className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-sm shrink-0" style={{ backgroundColor: entry.color }} />
            <span className="text-slate-600 text-[9px]">{entry.value}</span>
          </li>
        ))}
      </ul>
    );
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 text-slate-900 overflow-hidden">
      <div className="flex justify-between items-center bg-white px-2 py-1.5 border-b border-slate-200 shrink-0">
        <div className="flex gap-1 overflow-x-auto no-scrollbar">
          <button 
            onClick={() => setActiveTab('investment')}
            className={`px-3 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition-colors ${activeTab === 'investment' ? 'bg-indigo-100 text-indigo-700' : 'text-slate-500 hover:bg-slate-100'}`}
          >投資</button>
          <button 
            onClick={() => setActiveTab('income')}
            className={`px-3 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition-colors ${activeTab === 'income' ? 'bg-indigo-100 text-indigo-700' : 'text-slate-500 hover:bg-slate-100'}`}
          >收入</button>
          <button 
            onClick={() => setActiveTab('expense')}
            className={`px-3 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition-colors ${activeTab === 'expense' ? 'bg-indigo-100 text-indigo-700' : 'text-slate-500 hover:bg-slate-100'}`}
          >支出</button>
          <button 
            onClick={() => setActiveTab('return')}
            className={`px-3 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition-colors ${activeTab === 'return' ? 'bg-indigo-100 text-indigo-700' : 'text-slate-500 hover:bg-slate-100'}`}
          >報酬</button>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto px-1 pt-1 pb-2 flex flex-col space-y-1">
        {activeTab === 'investment' && (
          <>
            <div className="shrink-0 bg-white rounded-lg shadow-sm border border-slate-200 p-1.5 h-52">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={[...yearlyData].reverse()} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} tickFormatter={(val) => `${val/10000}W`} />
                  <Tooltip cursor={{fill: '#f1f5f9'}} contentStyle={{fontSize: '12px', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} formatter={(val: number) => val.toLocaleString()} />
                  <Legend verticalAlign="top" align="right" content={renderCustomLegend} />
                  <Bar dataKey="securitiesLoanCumulative" name="證劵貸款(累)" stackId="a" fill="#fca5a5" />
                  <Bar dataKey="marginLoanCumulative" name="證金貸款(累)" stackId="a" fill="#f87171" />
                  <Bar dataKey="remainingInvestment" name="淨投資金額(累)" stackId="a" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="flex-1 bg-white rounded-lg shadow-sm border border-slate-200 flex flex-col min-h-0">
              <div className="flex-1 overflow-auto no-scrollbar">
                <table className="w-full text-[10px] text-center whitespace-nowrap">
                  <thead className="sticky top-0 z-30">
                    <tr className="bg-indigo-50 border-b border-slate-200 text-indigo-800">
                      <th className="p-1.5 font-bold sticky left-0 bg-indigo-50 border-r border-slate-200 z-40 text-center shadow-[1px_0_0_0_#e2e8f0]">年份</th>
                      <th className="p-1.5 font-bold text-right pr-4">投資金額(累)</th>
                      <th className="p-1.5 font-bold text-right pr-4">證金貸款(累)</th>
                      <th className="p-1.5 font-bold text-right pr-4">證劵貸款(累)</th>
                    </tr>
                  </thead>
                  <tbody className="text-slate-600 divide-y divide-slate-100">
                    {yearlyData.map(d => (
                      <tr key={d.year} className="hover:bg-slate-50 transition-colors">
                        <td className="p-1.5 font-bold bg-slate-50/50 border-r border-slate-200 sticky left-0 z-10 text-center shadow-[1px_0_0_0_#e2e8f0]">{d.year}</td>
                        <td className="p-1.5 text-right pr-4 font-bold text-indigo-600">{formatCurrency(d.investmentAmount)}</td>
                        <td className="p-1.5 text-right pr-4">{formatCurrency(d.marginLoanCumulative)}</td>
                        <td className="p-1.5 text-right pr-4">{formatCurrency(d.securitiesLoanCumulative)}</td>
                      </tr>
                    ))}
                    {yearlyData.length > 0 && (
                      <tr className="sticky bottom-0 z-30 bg-indigo-50 border-t border-slate-200 text-indigo-800 shadow-[0_-1px_2px_rgba(0,0,0,0.05)]">
                        <td className="p-1.5 font-bold border-r border-slate-200 sticky left-0 z-40 bg-indigo-50 text-center shadow-[1px_0_0_0_#e2e8f0]">合計</td>
                        <td className="p-1.5 text-right pr-4 font-bold text-indigo-600">{formatCurrency(yearlyData[0].investmentAmount)}</td>
                        <td className="p-1.5 text-right pr-4">{formatCurrency(yearlyData[0].marginLoanCumulative)}</td>
                        <td className="p-1.5 text-right pr-4">{formatCurrency(yearlyData[0].securitiesLoanCumulative)}</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {activeTab === 'income' && (
          <>
            <div className="shrink-0 bg-white rounded-lg shadow-sm border border-slate-200 p-1.5 h-52">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={[...yearlyData].reverse()} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} tickFormatter={(val) => `${val/10000}W`} />
                  <Tooltip cursor={{fill: '#f1f5f9'}} contentStyle={{fontSize: '12px', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} formatter={(val: number) => val.toLocaleString()} />
                  <Legend verticalAlign="top" align="right" content={renderCustomLegend} />
                  <Bar dataKey="dividendIncome" name="股息收益" stackId="a" fill="#10b981" />
                  <Bar dataKey="lendingIncome" name="借劵收入" stackId="a" fill="#fb923c" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="flex-1 bg-white rounded-lg shadow-sm border border-slate-200 flex flex-col min-h-0">
              <div className="flex-1 overflow-auto no-scrollbar">
                <table className="w-full text-[10px] text-center whitespace-nowrap">
                  <thead className="sticky top-0 z-30">
                    <tr className="bg-indigo-50 border-b border-slate-200 text-indigo-800">
                      <th className="p-1.5 font-bold sticky left-0 bg-indigo-50 border-r border-slate-200 z-40 text-center shadow-[1px_0_0_0_#e2e8f0]">年份</th>
                      <th className="p-1.5 font-bold text-right pr-4">股息收益</th>
                      <th className="p-1.5 font-bold text-right pr-4">借劵收入</th>
                      <th className="p-1.5 font-bold text-right pr-4">收入總額</th>
                    </tr>
                  </thead>
                  <tbody className="text-slate-600 divide-y divide-slate-100">
                    {yearlyData.map(d => (
                      <tr key={d.year} className="hover:bg-slate-50 transition-colors">
                        <td className="p-1.5 font-bold bg-slate-50/50 border-r border-slate-200 sticky left-0 z-10 text-center shadow-[1px_0_0_0_#e2e8f0]">{d.year}</td>
                        <td className="p-1.5 text-right pr-4 text-emerald-600 font-bold">{formatCurrency(d.dividendIncome)}</td>
                        <td className="p-1.5 text-right pr-4 text-orange-500 font-bold">{formatCurrency(d.lendingIncome)}</td>
                        <td className="p-1.5 text-right pr-4 text-indigo-600 font-bold">{formatCurrency(d.incomeTotal)}</td>
                      </tr>
                    ))}
                    {yearlyData.length > 0 && (
                      <tr className="sticky bottom-0 z-30 bg-indigo-50 border-t border-slate-200 text-indigo-800 shadow-[0_-1px_2px_rgba(0,0,0,0.05)]">
                        <td className="p-1.5 font-bold border-r border-slate-200 sticky left-0 z-40 bg-indigo-50 text-center shadow-[1px_0_0_0_#e2e8f0]">合計</td>
                        <td className="p-1.5 text-right pr-4 text-emerald-600 font-bold">{formatCurrency(yearlyData.reduce((s,d)=>s+d.dividendIncome, 0))}</td>
                        <td className="p-1.5 text-right pr-4 text-orange-500 font-bold">{formatCurrency(yearlyData.reduce((s,d)=>s+d.lendingIncome, 0))}</td>
                        <td className="p-1.5 text-right pr-4 text-indigo-600 font-bold">{formatCurrency(yearlyData.reduce((s,d)=>s+d.incomeTotal, 0))}</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {activeTab === 'expense' && (
          <>
            <div className="shrink-0 bg-white rounded-lg shadow-sm border border-slate-200 p-1.5 h-52">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={[...yearlyData].reverse()} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} tickFormatter={(val) => `${val/10000}W`} />
                  <Tooltip cursor={{fill: '#f1f5f9'}} contentStyle={{fontSize: '12px', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} formatter={(val: number) => val.toLocaleString()} />
                  <Legend verticalAlign="top" align="right" content={renderCustomLegend} />
                  <Bar dataKey="withdrawalAmount" name="領錢金額" stackId="a" fill="#fca5a5" />
                  <Bar dataKey="securitiesInterest" name="證劵利息" stackId="a" fill="#f87171" />
                  <Bar dataKey="marginInterest" name="證金利息" stackId="a" fill="#ef4444" />
                  <Bar dataKey="remainingIncome" name="淨收入" stackId="a" fill="#10b981" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="flex-1 bg-white rounded-lg shadow-sm border border-slate-200 flex flex-col min-h-0">
              <div className="flex-1 overflow-auto no-scrollbar">
                <table className="w-full text-[10px] text-center whitespace-nowrap">
                  <thead className="sticky top-0 z-30">
                    <tr className="bg-indigo-50 border-b border-slate-200 text-indigo-800">
                      <th className="p-1.5 font-bold sticky left-0 bg-indigo-50 border-r border-slate-200 z-40 text-center shadow-[1px_0_0_0_#e2e8f0]">年份</th>
                      <th className="p-1.5 font-bold text-right pr-4">收入總額</th>
                      <th className="p-1.5 font-bold text-right pr-4">領錢金額</th>
                      <th className="p-1.5 font-bold text-right pr-4">證金利息</th>
                      <th className="p-1.5 font-bold text-right pr-4">證劵利息</th>
                    </tr>
                  </thead>
                  <tbody className="text-slate-600 divide-y divide-slate-100">
                    {yearlyData.map(d => (
                      <tr key={d.year} className="hover:bg-slate-50 transition-colors">
                        <td className="p-1.5 font-bold bg-slate-50/50 border-r border-slate-200 sticky left-0 z-10 text-center shadow-[1px_0_0_0_#e2e8f0]">{d.year}</td>
                        <td className="p-1.5 text-right pr-4 text-emerald-600 font-bold">{formatCurrency(d.incomeTotal)}</td>
                        <td className="p-1.5 text-right pr-4">{formatCurrency(d.withdrawalAmount)}</td>
                        <td className="p-1.5 text-right pr-4">{formatCurrency(d.marginInterest)}</td>
                        <td className="p-1.5 text-right pr-4">{formatCurrency(d.securitiesInterest)}</td>
                      </tr>
                    ))}
                    {yearlyData.length > 0 && (
                      <tr className="sticky bottom-0 z-30 bg-indigo-50 border-t border-slate-200 text-indigo-800 shadow-[0_-1px_2px_rgba(0,0,0,0.05)]">
                        <td className="p-1.5 font-bold border-r border-slate-200 sticky left-0 z-40 bg-indigo-50 text-center shadow-[1px_0_0_0_#e2e8f0]">合計</td>
                        <td className="p-1.5 text-right pr-4 text-emerald-600 font-bold">{formatCurrency(yearlyData.reduce((s,d)=>s+d.incomeTotal, 0))}</td>
                        <td className="p-1.5 text-right pr-4">{formatCurrency(yearlyData.reduce((s,d)=>s+d.withdrawalAmount, 0))}</td>
                        <td className="p-1.5 text-right pr-4">{formatCurrency(yearlyData.reduce((s,d)=>s+d.marginInterest, 0))}</td>
                        <td className="p-1.5 text-right pr-4">{formatCurrency(yearlyData.reduce((s,d)=>s+d.securitiesInterest, 0))}</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {activeTab === 'return' && (
          <>
            <div className="shrink-0 bg-white rounded-lg shadow-sm border border-slate-200 p-1.5 h-52">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={[...yearlyData].reverse()} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} tickFormatter={(val) => `${val/10000}W`} />
                  <Tooltip cursor={{fill: '#f1f5f9'}} contentStyle={{fontSize: '12px', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} formatter={(val: number) => val.toLocaleString()} />
                  <Legend verticalAlign="top" align="right" content={renderCustomLegend} />
                  <Bar dataKey="dividendIncome" name="股息收入" stackId="a" fill="#10b981" />
                  <Bar dataKey="profitLoss" name="損益金額" stackId="a" fill="#ef4444" />
                  <Bar dataKey="investmentAmount" name="投資金額(累)" stackId="a" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="flex-1 bg-white rounded-lg shadow-sm border border-slate-200 flex flex-col min-h-0">
              <div className="flex-1 overflow-auto no-scrollbar">
                <table className="w-full text-[10px] text-center whitespace-nowrap">
                  <thead className="sticky top-0 z-30">
                    <tr className="bg-indigo-50 border-b border-slate-200 text-indigo-800">
                      <th className="p-1.5 font-bold sticky left-0 bg-indigo-50 border-r border-slate-200 z-40 text-center shadow-[1px_0_0_0_#e2e8f0]">年份</th>
                      <th className="p-1.5 font-bold text-right pr-4">投資金額(累)</th>
                      <th className="p-1.5 font-bold text-right pr-4">損益金額</th>
                      <th className="p-1.5 font-bold text-right pr-4">股息收入</th>
                    </tr>
                  </thead>
                  <tbody className="text-slate-600 divide-y divide-slate-100">
                    {yearlyData.map(d => (
                      <tr key={d.year} className="hover:bg-slate-50 transition-colors">
                        <td className="p-1.5 font-bold bg-slate-50/50 border-r border-slate-200 sticky left-0 z-10 text-center shadow-[1px_0_0_0_#e2e8f0]">{d.year}</td>
                        <td className="p-1.5 text-right pr-4 text-indigo-600 font-bold">{formatCurrency(d.investmentAmount)}</td>
                        <td className={`p-1.5 text-right pr-4 font-bold ${d.profitLoss >= 0 ? 'text-rose-600' : 'text-emerald-600'}`}>{formatCurrency(d.profitLoss)}</td>
                        <td className="p-1.5 text-right pr-4 text-emerald-600 font-bold">{formatCurrency(d.dividendIncome)}</td>
                      </tr>
                    ))}
                    {yearlyData.length > 0 && (
                      <tr className="sticky bottom-0 z-30 bg-indigo-50 border-t border-slate-200 text-indigo-800 shadow-[0_-1px_2px_rgba(0,0,0,0.05)]">
                        <td className="p-1.5 font-bold border-r border-slate-200 sticky left-0 z-40 bg-indigo-50 text-center shadow-[1px_0_0_0_#e2e8f0]">合計</td>
                        <td className="p-1.5 text-right pr-4 text-indigo-600 font-bold">{formatCurrency(yearlyData[0].investmentAmount)}</td>
                        <td className="p-1.5 text-right pr-4 text-rose-600 font-bold">{formatCurrency(yearlyData.reduce((s,d)=>s+d.profitLoss, 0))}</td>
                        <td className="p-1.5 text-right pr-4 text-emerald-600 font-bold">{formatCurrency(yearlyData.reduce((s,d)=>s+d.dividendIncome, 0))}</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
