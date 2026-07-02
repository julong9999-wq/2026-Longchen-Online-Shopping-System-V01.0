import { useState, useEffect } from 'react';
import Papa from 'papaparse';

const CSV_URL_AP217 = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQaRKeSBt4XfeC9uNf56p38DwscoPK0-eFM3J4-Vz8LeVBdgsClDZy0baU-FHyFv5cz-QNCXUVMwBfr/pub?output=csv'; 
const CSV_URL_AP213_HISTORY = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQaRKeSBt4XfeC9uNf56p38DwscoPK0-eFM3J4-Vz8LeVBdgsClDZy0baU-FHyFv5cz-QNCXUVMwBfr/pub?gid=462296829&single=true&output=csv';
const CSV_URL_WITHDRAWAL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSnkojvITxtjSfxyv0D85BEfMv80ANLdGyXGZih5prz6-W_0KfP1Fr5fRFwx8jUGkvEIQjoVa4afbnJ/pub?gid=24682956&single=true&output=csv';
const CSV_URL_LENDING = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSnkojvITxtjSfxyv0D85BEfMv80ANLdGyXGZih5prz6-W_0KfP1Fr5fRFwx8jUGkvEIQjoVa4afbnJ/pub?gid=1204781169&single=true&output=csv';
const CSV_URL_PLEDGE = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSnkojvITxtjSfxyv0D85BEfMv80ANLdGyXGZih5prz6-W_0KfP1Fr5fRFwx8jUGkvEIQjoVa4afbnJ/pub?gid=1021924150&single=true&output=csv';
const CSV_URL_INV = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSnkojvITxtjSfxyv0D85BEfMv80ANLdGyXGZih5prz6-W_0KfP1Fr5fRFwx8jUGkvEIQjoVa4afbnJ/pub?gid=522688960&single=true&output=csv';
const CSV_URL_AP215 = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vR5JvOGT3eB4xq9phw2dXHApJKOgQkUZcs69CsJfL0Iw3s6egADwA8HdbimrWUceQZl_73pnsSLVnQw/pub?output=csv';

interface CombinedData {
  yearMonth: string;
  investmentAmount: number; // 投資金額
  profitLoss: number; // 損益金額
  dividendIncome: number; // 股息收益
  withdrawalAmount: number; // 領錢金額
  lendingIncome: number; // 借劵收入
  pledgeInterest: number; // 貸款利息
}

export default function InvestmentXXXXView({ activeAccount, refreshKey }: { activeAccount: string, refreshKey: number }) {
  const [data, setData] = useState<CombinedData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const [ap217Res, ap213Res, wdRes, lendRes, pledgeRes, invRes, ap215Res] = await Promise.all([
          fetch(CSV_URL_AP217).then(r => r.text()),
          fetch(CSV_URL_AP213_HISTORY).then(r => r.text()),
          fetch(CSV_URL_WITHDRAWAL).then(r => r.text()),
          fetch(CSV_URL_LENDING).then(r => r.text()),
          fetch(CSV_URL_PLEDGE).then(r => r.text()),
          fetch(CSV_URL_INV).then(r => r.text()),
          fetch(CSV_URL_AP215).then(r => r.text()),
        ]);

        const parsedAP217 = Papa.parse(ap217Res, { header: true, skipEmptyLines: true }).data;
        const parsedAP213 = Papa.parse(ap213Res, { header: true, skipEmptyLines: true }).data;
        const parsedWd = Papa.parse(wdRes, { header: true, skipEmptyLines: true }).data;
        const parsedLend = Papa.parse(lendRes, { header: true, skipEmptyLines: true }).data;
        const parsedPledge = Papa.parse(pledgeRes, { header: true, skipEmptyLines: true }).data;
        const parsedInv = Papa.parse(invRes, { header: true, skipEmptyLines: true }).data;
        const parsedAP215 = Papa.parse(ap215Res, { header: true, skipEmptyLines: true }).data;

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
              profitLoss: 0,
              dividendIncome: 0,
              withdrawalAmount: 0,
              lendingIncome: 0,
              pledgeInterest: 0
            });
          }
          return monthMap.get(m)!;
        };

        // 1. Withdrawal
        parsedWd.forEach((r: any) => {
          const acc = r['證券戶']?.trim();
          if (activeAccount !== 'all' && acc !== activeAccount) return;
          const m = getMonthKey(r['領錢日期']);
          if (m) initMonth(m).withdrawalAmount += parseFloat(r['領錢金額']?.replace(/,/g, '') || '0');
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
        parsedPledge.forEach((r: any) => {
          const acc = r['證券戶']?.trim();
          if (activeAccount !== 'all' && acc !== activeAccount) return;
          const returnDate = r['還款日期']?.trim();
          if (returnDate) {
            const m = getMonthKey(returnDate);
            if (m) initMonth(m).pledgeInterest += parseFloat(r['貸款利息']?.replace(/,/g, '') || '0');
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
          let prevMarketValue = 0;

          while (curYear < endYear || (curYear === endYear && curMonth <= endMonth)) {
            const mKey = `${curYear}/${String(curMonth).padStart(2, '0')}`;
            
            let monthlyNetInvestment = 0;

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
                    monthlyNetInvestment += (price * shares) + fee + tax;
                  } else if (type === '賣出') {
                    portfolio.set(stockId, (portfolio.get(stockId) || 0) - shares);
                    cumInv -= ((price * shares) - fee - tax);
                    monthlyNetInvestment -= ((price * shares) - fee - tax);
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
            mData.profitLoss = marketValue - prevMarketValue - monthlyNetInvestment;
            
            prevMarketValue = marketValue;

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

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-full">
      <div className="flex-1 overflow-auto no-scrollbar">
        <table className="w-full text-[10px] text-center whitespace-nowrap">
          <thead className="sticky top-0 z-30">
            <tr className="bg-indigo-50/90 backdrop-blur-sm border-b border-slate-200 text-indigo-800">
              <th className="p-1.5 font-bold sticky left-0 bg-indigo-50/90 backdrop-blur-sm border-r border-slate-200 z-40">年月</th>
              <th className="p-1.5 font-bold text-right pr-4">投資金額</th>
              <th className="p-1.5 font-bold text-right pr-4">損益金額</th>
              <th className="p-1.5 font-bold text-right pr-4">股息收益</th>
              <th className="p-1.5 font-bold text-right pr-4">領錢金額</th>
              <th className="p-1.5 font-bold text-right pr-4">借劵收入</th>
              <th className="p-1.5 font-bold text-right pr-4">貸款利息</th>
            </tr>
          </thead>
          <tbody className="text-slate-600 divide-y divide-slate-100">
            {data.map(d => (
              <tr key={d.yearMonth} className="hover:bg-slate-50 transition-colors">
                <td className="p-1.5 font-bold bg-slate-50/50 border-r border-slate-200 sticky left-0 z-10">{d.yearMonth}</td>
                <td className="p-1.5 text-right pr-4">{formatCurrency(d.investmentAmount)}</td>
                <td className="p-1.5 text-indigo-600 font-bold text-right pr-4">{formatCurrency(d.profitLoss)}</td>
                <td className="p-1.5 text-green-600 font-bold text-right pr-4">{formatCurrency(d.dividendIncome)}</td>
                <td className="p-1.5 text-right pr-4">{formatCurrency(d.withdrawalAmount)}</td>
                <td className="p-1.5 text-right pr-4">{formatCurrency(d.lendingIncome)}</td>
                <td className="p-1.5 text-right pr-4">{formatCurrency(d.pledgeInterest)}</td>
              </tr>
            ))}
            {data.length > 0 && (
              <tr className="sticky bottom-0 z-30 bg-indigo-50/90 backdrop-blur-sm border-t border-slate-200 text-indigo-800 font-bold shadow-[0_-1px_2px_rgba(0,0,0,0.05)]">
                <td className="p-1.5 font-bold border-r border-slate-200 sticky left-0 z-40 bg-indigo-50/90 backdrop-blur-sm">合計</td>
                <td className="p-1.5 text-right pr-4">{formatCurrency(data.reduce((s, d) => s + d.investmentAmount, 0))}</td>
                <td className="p-1.5 text-right pr-4 text-indigo-600">{formatCurrency(data.reduce((s, d) => s + d.profitLoss, 0))}</td>
                <td className="p-1.5 text-right pr-4 text-green-600">{formatCurrency(data.reduce((s, d) => s + d.dividendIncome, 0))}</td>
                <td className="p-1.5 text-right pr-4">{formatCurrency(data.reduce((s, d) => s + d.withdrawalAmount, 0))}</td>
                <td className="p-1.5 text-right pr-4">{formatCurrency(data.reduce((s, d) => s + d.lendingIncome, 0))}</td>
                <td className="p-1.5 text-right pr-4">{formatCurrency(data.reduce((s, d) => s + d.pledgeInterest, 0))}</td>
              </tr>
            )}
            {data.length === 0 && (
              <tr>
                <td colSpan={7} className="p-4 text-center text-slate-400">目前無資料</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
