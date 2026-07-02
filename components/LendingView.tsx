import { useState, useEffect, useMemo } from 'react';
import Papa from 'papaparse';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Plus } from 'lucide-react';

const CSV_URL_LENDING = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSnkojvITxtjSfxyv0D85BEfMv80ANLdGyXGZih5prz6-W_0KfP1Fr5fRFwx8jUGkvEIQjoVa4afbnJ/pub?gid=1204781169&single=true&output=csv';
const CSV_URL_INV = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSnkojvITxtjSfxyv0D85BEfMv80ANLdGyXGZih5prz6-W_0KfP1Fr5fRFwx8jUGkvEIQjoVa4afbnJ/pub?gid=522688960&single=true&output=csv';
const CSV_URL_PRICE = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQaRKeSBt4XfeC9uNf56p38DwscoPK0-eFM3J4-Vz8LeVBdgsClDZy0baU-FHyFv5cz-QNCXUVMwBfr/pub?output=csv';

interface LendingRecord {
  type: string;
  lendDate: string;
  returnDate: string;
  account: string;
  stockId: string;
  stockName: string;
  shares: number;
  rate: number;
  income: number;
  fee: number;
  tax: number;
}

interface InvRecord {
  account: string;
  stockId: string;
  stockName: string;
  shares: number; 
}

export default function LendingView({ activeAccount, refreshKey }: { activeAccount: string, refreshKey: number }) {
  const [activeTab, setActiveTab] = useState<'year' | 'month' | 'stock' | 'chart' | 'detail'>('month');
  const [detailTab, setDetailTab] = useState<'estimate' | 'lent' | 'inventory'>('estimate');
  const [lendingRecords, setLendingRecords] = useState<LendingRecord[]>([]);
  const [priceRecords, setPriceRecords] = useState<Map<string, number>>(new Map());
  const [invRecords, setInvRecords] = useState<InvRecord[]>([]);
  const [yearWindowIndex, setYearWindowIndex] = useState(0);
  const [stockWindowIndex, setStockWindowIndex] = useState(0);
  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>(null);

  useEffect(() => {
    Papa.parse(CSV_URL_LENDING, {
      download: true, header: true, skipEmptyLines: true,
      complete: (results) => {
        const parsed = results.data.map((row: any) => ({
          type: String(row['借劵方式'] || '').trim(),
          lendDate: String(row['出借日期'] || '').trim(),
          returnDate: String(row['還劵日期'] || '').trim(),
          account: String(row['證券戶'] || '').trim(),
          stockId: String(row['股號'] || '').trim(),
          stockName: String(row['股名'] || '').trim(),
          shares: parseFloat(String(row['張數'] || '0').replace(/,/g, '')),
          rate: parseFloat(String(row['出借費率'] || '0').replace(/%/g, '')) / 100,
          income: parseFloat(String(row['出借收入'] || '0').replace(/,/g, '')),
          fee: parseFloat(String(row['出借服務費'] || '0').replace(/,/g, '')),
          tax: parseFloat(String(row['代扣稅額'] || '0').replace(/,/g, ''))
        })).filter(r => r.stockId && !isNaN(r.shares));
        setLendingRecords(parsed);
      }
    });

    Papa.parse(CSV_URL_PRICE, {
      download: true, header: true, skipEmptyLines: true,
      complete: (results) => {
        const pMap = new Map<string, number>();
        results.data.forEach((row: any) => {
          const sid = String(row['ETF 代碼'] || row['ETF代碼'] || '').trim();
          const p = parseFloat(String(row['股價'] || '0').replace(/,/g, ''));
          if (sid && !isNaN(p)) pMap.set(sid, p);
        });
        setPriceRecords(pMap);
      }
    });

    Papa.parse(CSV_URL_INV, {
      download: true, header: true, skipEmptyLines: true,
      complete: (results) => {
        const parsed = results.data.map((row: any) => {
          const bs = String(row['買賣別'] || '').trim();
          let shares = parseFloat(String(row['股數'] || '0').replace(/,/g, ''));
          if (bs === '賣出') shares = -shares;
          return {
            account: String(row['證券戶'] || '').trim(),
            stockId: String(row['股號'] || '').trim(),
            stockName: String(row['股名'] || '').trim(),
            shares
          };
        }).filter(r => r.stockId && !isNaN(r.shares));
        setInvRecords(parsed);
      }
    });
  }, [refreshKey]);

  const filteredLending = useMemo(() => {
    return activeAccount === 'all' ? lendingRecords : lendingRecords.filter(r => r.account === activeAccount);
  }, [lendingRecords, activeAccount]);

  const filteredInv = useMemo(() => {
    return activeAccount === 'all' ? invRecords : invRecords.filter(r => r.account === activeAccount);
  }, [invRecords, activeAccount]);

  const availableYears = useMemo(() => {
    const years = new Set<number>();
    filteredLending.forEach(r => {
      if (r.returnDate) {
        const d = new Date(r.returnDate);
        if (!isNaN(d.getTime())) years.add(d.getFullYear());
      }
    });
    return Array.from(years).sort((a, b) => b - a);
  }, [filteredLending]);

  const getRevenue = (r: LendingRecord) => {
    const base = r.income - r.fee - r.tax;
    return r.type === '單張多筆' ? base * r.shares : base;
  };

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

  const yearMonthData = useMemo(() => {
    if (activeTab !== 'month') return null;
    const returned = filteredLending.filter(r => r.returnDate);
    const months = Array.from({length: 12}, (_, i) => {
      const obj: any = { month: i + 1, total: 0 };
      availableYears.forEach(y => obj[y] = 0);
      return obj;
    });
    
    returned.forEach(r => {
      const d = new Date(r.returnDate);
      if (isNaN(d.getTime())) return;
      const y = d.getFullYear();
      const m = d.getMonth();
      const rev = getRevenue(r);
      if (months[m]) {
        months[m][y] += rev;
        months[m].total += rev;
      }
    });
    return months;
  }, [filteredLending, activeTab, availableYears]);

  const yearModeData = useMemo(() => {
    if (activeTab !== 'year') return null;
    const returned = filteredLending.filter(r => r.returnDate);
    const map = new Map<number, any>();
    const accounts = new Set<string>();
    
    returned.forEach(r => {
      const d = new Date(r.returnDate);
      if (isNaN(d.getTime())) return;
      const y = d.getFullYear();
      const rev = getRevenue(r);
      const acc = r.account || '未知';
      accounts.add(acc);
      
      if (!map.has(y)) map.set(y, { year: y, total: 0 });
      const record = map.get(y);
      record[acc] = (record[acc] || 0) + rev;
      record.total += rev;
    });
    
    return {
      data: Array.from(map.values()).sort((a, b) => b.year - a.year), // 近至遠
      accounts: Array.from(accounts).sort()
    };
  }, [filteredLending, activeTab]);

  const yearMonthChartData = useMemo(() => {
    if (activeTab !== 'month') return null;
    const returned = filteredLending.filter(r => r.returnDate);
    const months = Array.from({length: 12}, (_, i) => ({ month: i + 1 }) as any);
    
    returned.forEach(r => {
      const d = new Date(r.returnDate);
      if (isNaN(d.getTime())) return;
      const m = d.getMonth();
      const y = d.getFullYear().toString();
      months[m][y] = (months[m][y] || 0) + getRevenue(r);
    });
    return months;
  }, [filteredLending, activeTab]);

  const stockData = useMemo(() => {
    if (activeTab !== 'stock') return null;
    const returned = filteredLending.filter(r => r.returnDate);
    const map = new Map<string, any>();
    
    returned.forEach(r => {
      const d = new Date(r.returnDate);
      if (isNaN(d.getTime())) return;
      const y = d.getFullYear();
      const rev = getRevenue(r);
      
      if (!map.has(r.stockName)) {
        const obj: any = { stockName: r.stockName, total: 0 };
        availableYears.forEach(yr => obj[yr] = 0);
        map.set(r.stockName, obj);
      }
      
      const record = map.get(r.stockName);
      record[y] += rev;
      record.total += rev;
    });
    
    let result = Array.from(map.values());
    if (sortConfig) {
      result.sort((a, b) => {
        let aVal = a[sortConfig.key];
        let bVal = b[sortConfig.key];
        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    } else {
      result.sort((a, b) => b.total - a.total);
    }
    return result;
  }, [filteredLending, activeTab, sortConfig, availableYears]);

  const chartTabStockData = useMemo(() => {
    if (activeTab !== 'chart') return null;
    const returned = filteredLending.filter(r => r.returnDate);
    const map = new Map<string, any>();
    
    returned.forEach(r => {
      const d = new Date(r.returnDate);
      if (isNaN(d.getTime())) return;
      const y = d.getFullYear().toString();
      
      if (!map.has(r.stockName)) map.set(r.stockName, { stockName: r.stockName, total: 0 });
      const record = map.get(r.stockName)!;
      const rev = getRevenue(r);
      record[y] = (record[y] || 0) + rev;
      record.total += rev;
    });
    return Array.from(map.values()).sort((a, b) => b.total - a.total);
  }, [filteredLending, activeTab]);

  const detailData = useMemo(() => {
    if (activeTab !== 'detail') return null;
    const activeLent = filteredLending.filter(r => !r.returnDate);
    let result: any[] = [];
    
    if (detailTab === 'estimate') {
      const today = new Date().getTime();
      result = activeLent.map(r => {
        const price = priceRecords.get(r.stockId) || 0;
        const lendDate = new Date(r.lendDate).getTime();
        const days = isNaN(lendDate) ? 1 : Math.max(1, Math.floor((today - lendDate) / (1000 * 60 * 60 * 24)));
        const baseShares = r.type === '單張多筆' ? 1 : r.shares;
        const value = price * baseShares * 1000;
        const dailyInterest = (value * r.rate / 365);
        const actualDaily = dailyInterest < 0.8 ? 0.8 : dailyInterest;
        const est = actualDaily * days;
        const finalEst = r.type === '單張多筆' ? est * r.shares : est;
        
        return {
          ...r,
          days,
          price,
          estimate: finalEst
        };
      }).sort((a, b) => b.estimate - a.estimate);
    } 
    
    if (detailTab === 'lent') {
      const map = new Map<string, { stockId: string, stockName: string, shares: number }>();
      activeLent.forEach(r => {
        if (!map.has(r.stockId)) map.set(r.stockId, { stockId: r.stockId, stockName: r.stockName, shares: 0 });
        map.get(r.stockId)!.shares += r.shares;
      });
      result = Array.from(map.values()).sort((a, b) => b.shares - a.shares);
    }
    
    if (detailTab === 'inventory') {
      // Inventory total
      const invMap = new Map<string, { stockId: string, stockName: string, shares: number }>();
      filteredInv.forEach(r => {
        if (!invMap.has(r.stockId)) invMap.set(r.stockId, { stockId: r.stockId, stockName: r.stockName, shares: 0 });
        invMap.get(r.stockId)!.shares += r.shares;
      });
      // Subtract Lent
      activeLent.forEach(r => {
        if (invMap.has(r.stockId)) {
          invMap.get(r.stockId)!.shares -= (r.shares * 1000); // Because r.shares is in 'lots', inv is in 'shares'
        }
      });
      
      const res: any[] = [];
      invMap.forEach(v => {
        const lot = v.shares / 1000;
        if (lot > 0) res.push({ stockId: v.stockId, stockName: v.stockName, shares: lot });
      });
      result = res.sort((a, b) => b.shares - a.shares);
    }
    
    if (sortConfig && result.length > 0) {
      result.sort((a: any, b: any) => {
        const aVal = a[sortConfig.key];
        const bVal = b[sortConfig.key];
        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    
    return result;
  }, [filteredLending, filteredInv, activeTab, detailTab, priceRecords, sortConfig]);

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'desc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'desc') {
      direction = 'asc';
    }
    setSortConfig({ key, direction });
  };

  const formatCurrency = (val: number) => {
    return Math.round(val).toLocaleString();
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 text-slate-900 overflow-hidden">
      <div className="flex justify-between items-center bg-white px-2 py-1.5 border-b border-slate-200 shrink-0">
        <div className="flex gap-1 overflow-x-auto no-scrollbar">
          <button 
            onClick={() => setActiveTab('year')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors ${activeTab === 'year' ? 'bg-indigo-100 text-indigo-700' : 'text-slate-500 hover:bg-slate-100'}`}
          >年份</button>
          <button 
            onClick={() => setActiveTab('month')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors ${activeTab === 'month' ? 'bg-indigo-100 text-indigo-700' : 'text-slate-500 hover:bg-slate-100'}`}
          >月份</button>
          <button 
            onClick={() => setActiveTab('stock')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors ${activeTab === 'stock' ? 'bg-indigo-100 text-indigo-700' : 'text-slate-500 hover:bg-slate-100'}`}
          >個股</button>
          <button 
            onClick={() => setActiveTab('chart')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors ${activeTab === 'chart' ? 'bg-indigo-100 text-indigo-700' : 'text-slate-500 hover:bg-slate-100'}`}
          >圖表</button>
          <button 
            onClick={() => setActiveTab('detail')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors ${activeTab === 'detail' ? 'bg-indigo-100 text-indigo-700' : 'text-slate-500 hover:bg-slate-100'}`}
          >明細</button>
        </div>
        <a href="https://docs.google.com/forms/d/1X-s9lS79bF4C3_2o-Yt2E_n7Q4sM1X8rE-c3gZkO9fQ/viewform" target="_blank" rel="noreferrer" className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 transition-colors shrink-0">
          <Plus size={14} /> 新增
        </a>
      </div>
      
      <div className="flex-1 overflow-y-auto px-1 pt-1 pb-2 flex flex-col space-y-1">
        {activeTab === 'month' && yearMonthData && yearMonthChartData && (
          <>
            <div className="shrink-0 bg-white rounded-lg shadow-sm border border-slate-200 p-1.5 h-52">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={yearMonthChartData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} tickFormatter={(val) => `${val}月`} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} tickFormatter={(val) => `${val/1000}k`} />
                  <Tooltip cursor={{fill: '#f1f5f9'}} contentStyle={{fontSize: '12px', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} formatter={(val: number) => val.toLocaleString()} />
                  <Legend verticalAlign="top" align="right" content={renderCustomLegend} />
                  {availableYears.map((y, idx) => (
                    <Bar key={y} dataKey={y.toString()} stackId="a" fill={['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'][idx % 5]} />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>
            
            <div className="flex-1 bg-white rounded-lg shadow-sm border border-slate-200 flex flex-col min-h-0">
              <div className="flex-1 overflow-auto no-scrollbar">
                <table className="w-full text-[10px] text-center whitespace-nowrap">
                  <thead className="sticky top-0 z-30">
                    <tr className="bg-indigo-50 border-b border-slate-200 text-indigo-800">
                      <th className="p-1.5 font-bold sticky left-0 bg-indigo-50 border-r border-slate-200 z-40 text-center">月份</th>
                      {availableYears.slice(yearWindowIndex, yearWindowIndex + 3).map((y, idx, arr) => {
                        let canGoLeft = idx === 0 && yearWindowIndex > 0;
                        let canGoRight = idx === arr.length - 1 && yearWindowIndex + 3 < availableYears.length;
                        return (
                          <th key={y} className="p-1.5 font-bold text-right pr-4 min-w-[70px]">
                            {canGoLeft && <button onClick={() => setYearWindowIndex(i => i - 1)} className="hover:text-indigo-600 px-1">&lt;</button>}
                            {y}
                            {canGoRight && <button onClick={() => setYearWindowIndex(i => i + 1)} className="hover:text-indigo-600 px-1">&gt;</button>}
                          </th>
                        );
                      })}
                      <th className="p-1.5 font-bold text-indigo-600 text-right pr-4 sticky right-0 bg-indigo-50 border-l border-slate-200 z-40">合計</th>
                    </tr>
                  </thead>
                  <tbody className="text-slate-600 divide-y divide-slate-100">
                    {yearMonthData.map(d => (
                      <tr key={d.month} className="hover:bg-slate-50 transition-colors">
                        <td className="p-1.5 font-bold bg-slate-50/50 border-r border-slate-200 sticky left-0 z-10 text-center">{d.month}月</td>
                        {availableYears.slice(yearWindowIndex, yearWindowIndex + 3).map(y => (
                          <td key={y} className="p-1.5 text-right pr-4">{formatCurrency(d[y] || 0)}</td>
                        ))}
                        <td className="p-1.5 text-right pr-4 font-bold text-indigo-600 sticky right-0 bg-indigo-50 border-l border-slate-200 z-40">{formatCurrency(d.total)}</td>
                      </tr>
                    ))}
                    <tr className="sticky bottom-0 z-30 bg-indigo-50 border-t border-slate-200 text-indigo-800 shadow-[0_-1px_2px_rgba(0,0,0,0.05)]">
                      <td className="p-1.5 font-bold border-r border-slate-200 sticky left-0 z-40 bg-indigo-50 text-center">合計</td>
                      {availableYears.slice(yearWindowIndex, yearWindowIndex + 3).map(y => (
                        <td key={y} className="p-1.5 font-bold text-right pr-4">{formatCurrency(yearMonthData.reduce((s, d) => s + (d[y] || 0), 0))}</td>
                      ))}
                      <td className="p-1.5 font-bold text-indigo-600 text-right pr-4 sticky right-0 bg-indigo-50 border-l border-slate-200 z-40">{formatCurrency(yearMonthData.reduce((s, d) => s + d.total, 0))}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {activeTab === 'year' && yearModeData && (
          <>
            <div className="shrink-0 bg-white rounded-lg shadow-sm border border-slate-200 p-1.5 h-52">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={yearModeData.data} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} tickFormatter={(val) => `${val/1000}k`} />
                  <Tooltip cursor={{fill: '#f1f5f9'}} contentStyle={{fontSize: '12px', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} formatter={(val: number) => val.toLocaleString()} />
                  <Legend verticalAlign="top" align="right" content={renderCustomLegend} />
                  {yearModeData.accounts.map((acc, idx) => (
                    <Bar key={acc} dataKey={acc} stackId="a" fill={['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'][idx % 5]} />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>
            
            <div className="flex-1 bg-white rounded-lg shadow-sm border border-slate-200 flex flex-col min-h-0">
              <div className="flex-1 overflow-auto no-scrollbar">
                <table className="w-full text-[10px] text-center whitespace-nowrap">
                  <thead className="sticky top-0 z-30">
                    <tr className="bg-indigo-50 border-b border-slate-200 text-indigo-800">
                      <th className="p-1.5 font-bold sticky left-0 bg-indigo-50 border-r border-slate-200 z-40 text-center">年份</th>
                      {yearModeData.accounts.map(acc => (
                        <th key={acc} className="p-1.5 font-bold text-right pr-4">{acc}</th>
                      ))}
                      <th className="p-1.5 font-bold text-indigo-600 text-right pr-4 sticky right-0 bg-indigo-50 border-l border-slate-200 z-40">合計</th>
                    </tr>
                  </thead>
                  <tbody className="text-slate-600 divide-y divide-slate-100">
                    {yearModeData.data.map((d: any) => (
                      <tr key={d.year} className="hover:bg-slate-50 transition-colors">
                        <td className="p-1.5 font-bold bg-slate-50/50 border-r border-slate-200 sticky left-0 z-10 text-center">{d.year}</td>
                        {yearModeData.accounts.map(acc => (
                          <td key={acc} className="p-1.5 text-right pr-4">{formatCurrency(d[acc] || 0)}</td>
                        ))}
                        <td className="p-1.5 text-right pr-4 font-bold text-indigo-600 sticky right-0 bg-indigo-50 border-l border-slate-200 z-40">{formatCurrency(d.total)}</td>
                      </tr>
                    ))}
                    <tr className="sticky bottom-0 z-30 bg-indigo-50 border-t border-slate-200 text-indigo-800 shadow-[0_-1px_2px_rgba(0,0,0,0.05)]">
                      <td className="p-1.5 font-bold border-r border-slate-200 sticky left-0 z-40 bg-indigo-50 text-center">合計</td>
                      {yearModeData.accounts.map(acc => (
                        <td key={acc} className="p-1.5 font-bold text-right pr-4">{formatCurrency(yearModeData.data.reduce((s: number, d: any) => s + (d[acc] || 0), 0))}</td>
                      ))}
                      <td className="p-1.5 font-bold text-indigo-600 text-right pr-4 sticky right-0 bg-indigo-50 border-l border-slate-200 z-40">{formatCurrency(yearModeData.data.reduce((s: number, d: any) => s + d.total, 0))}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {activeTab === 'stock' && stockData && (
          <div className="flex-1 bg-white rounded-lg shadow-sm border border-slate-200 flex flex-col min-h-0">
            <div className="flex-1 overflow-auto no-scrollbar">
              <table className="w-full text-[10px] text-center whitespace-nowrap">
                <thead className="sticky top-0 z-30">
                  <tr className="bg-indigo-50 border-b border-slate-200 text-indigo-800">
                    <th className="p-1.5 font-bold sticky left-0 bg-indigo-50 border-r border-slate-200 z-40 text-left pl-2">股名</th>
                    {availableYears.slice(stockWindowIndex, stockWindowIndex + 2).map((y, idx, arr) => {
                      let canGoLeft = idx === 0 && stockWindowIndex > 0;
                      let canGoRight = idx === arr.length - 1 && stockWindowIndex + 2 < availableYears.length;
                      return (
                        <th key={y} className="p-1.5 font-bold text-right pr-4 min-w-[70px]">
                          {canGoLeft && <button onClick={() => setStockWindowIndex(i => i - 1)} className="hover:text-indigo-600 px-1">&lt;</button>}
                          {y}
                          {canGoRight && <button onClick={() => setStockWindowIndex(i => i + 1)} className="hover:text-indigo-600 px-1">&gt;</button>}
                        </th>
                      );
                    })}
                    <th className="p-1.5 font-bold text-indigo-600 text-right pr-4 sticky right-0 bg-indigo-50 border-l border-slate-200 z-40">合計</th>
                  </tr>
                </thead>
                <tbody className="text-slate-600 divide-y divide-slate-100">
                  {stockData.map((d, i) => (
                    <tr key={i} className="hover:bg-slate-50 transition-colors">
                      <td className="p-1.5 font-bold bg-slate-50/50 border-r border-slate-200 sticky left-0 z-10 text-left pl-2">{d.stockName}</td>
                      {availableYears.slice(stockWindowIndex, stockWindowIndex + 2).map(y => (
                        <td key={y} className="p-1.5 text-right pr-4">{formatCurrency(d[y] || 0)}</td>
                      ))}
                      <td className="p-1.5 text-right pr-4 font-bold text-indigo-600 sticky right-0 bg-indigo-50 border-l border-slate-200 z-40">{formatCurrency(d.total)}</td>
                    </tr>
                  ))}
                  <tr className="sticky bottom-0 z-30 bg-indigo-50 border-t border-slate-200 text-indigo-800 shadow-[0_-1px_2px_rgba(0,0,0,0.05)]">
                    <td className="p-1.5 font-bold border-r border-slate-200 sticky left-0 z-40 bg-indigo-50 text-left pl-2">合計</td>
                    {availableYears.slice(stockWindowIndex, stockWindowIndex + 2).map(y => (
                      <td key={y} className="p-1.5 font-bold text-right pr-4">{formatCurrency(stockData.reduce((s, d) => s + (d[y] || 0), 0))}</td>
                    ))}
                    <td className="p-1.5 font-bold text-indigo-600 text-right pr-4 sticky right-0 bg-indigo-50 border-l border-slate-200 z-40">{formatCurrency(stockData.reduce((s, d) => s + d.total, 0))}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'chart' && chartTabStockData && (
          <div className="flex-1 bg-white rounded-lg shadow-sm border border-slate-200 p-1.5 flex flex-col min-h-0 overflow-y-auto">
            <div style={{ height: `${Math.max(chartTabStockData.length * 45, 300)}px`, minHeight: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart layout="vertical" data={chartTabStockData} margin={{ top: 10, right: 10, left: 20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e2e8f0" />
                  <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} tickFormatter={(val) => `${val/1000}k`} />
                  <YAxis dataKey="stockName" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} width={140} />
                  <Tooltip cursor={{fill: '#f1f5f9'}} contentStyle={{fontSize: '12px', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} formatter={(val: number) => val.toLocaleString()} />
                  <Legend verticalAlign="top" align="right" content={renderCustomLegend} />
                  {availableYears.map((y, idx) => (
                    <Bar key={y} dataKey={y.toString()} stackId="a" fill={['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'][idx % 5]} barSize={24} />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {activeTab === 'detail' && detailData && (
          <div className="flex-1 flex flex-col min-h-0 bg-white rounded-lg shadow-sm border border-slate-200">
            <div className="flex p-1.5 gap-2 border-b border-slate-200 bg-slate-50 shrink-0">
              <button 
                onClick={() => setDetailTab('estimate')}
                className={`px-3 py-1 rounded-md text-[10px] font-bold border transition-colors ${detailTab === 'estimate' ? 'border-indigo-500 text-indigo-700 bg-indigo-50' : 'border-slate-200 text-slate-600 hover:border-indigo-300'}`}
              >預估收入</button>
              <button 
                onClick={() => setDetailTab('lent')}
                className={`px-3 py-1 rounded-md text-[10px] font-bold border transition-colors ${detailTab === 'lent' ? 'border-indigo-500 text-indigo-700 bg-indigo-50' : 'border-slate-200 text-slate-600 hover:border-indigo-300'}`}
              >借出清單</button>
              <button 
                onClick={() => setDetailTab('inventory')}
                className={`px-3 py-1 rounded-md text-[10px] font-bold border transition-colors ${detailTab === 'inventory' ? 'border-indigo-500 text-indigo-700 bg-indigo-50' : 'border-slate-200 text-slate-600 hover:border-indigo-300'}`}
              >庫存清單</button>
            </div>
            
            <div className="flex-1 overflow-auto no-scrollbar">
              <table className="w-full text-[10px] text-center whitespace-nowrap">
                <thead className="sticky top-0 z-30">
                  <tr className="bg-indigo-50 border-b border-slate-200 text-indigo-800">
                    {detailTab === 'estimate' && (
                      <>
                        <th className="p-1.5 font-bold sticky left-0 bg-indigo-50 border-r border-slate-200 z-40 text-left pl-2 cursor-pointer hover:bg-indigo-100" onClick={() => handleSort('stockName')}>股名</th>
                        <th className="p-1.5 font-bold text-center cursor-pointer hover:bg-indigo-100" onClick={() => handleSort('type')}>借劵方式</th>
                        <th className="p-1.5 font-bold text-right pr-4 cursor-pointer hover:bg-indigo-100" onClick={() => handleSort('shares')}>張數</th>
                        <th className="p-1.5 font-bold text-right pr-4 cursor-pointer hover:bg-indigo-100" onClick={() => handleSort('days')}>天數</th>
                        <th className="p-1.5 font-bold text-indigo-600 text-right pr-4 cursor-pointer hover:bg-indigo-100" onClick={() => handleSort('estimate')}>預估金額</th>
                      </>
                    )}
                    {(detailTab === 'lent' || detailTab === 'inventory') && (
                      <>
                        <th className="p-1.5 font-bold text-center cursor-pointer hover:bg-indigo-100" onClick={() => handleSort('stockId')}>股號</th>
                        <th className="p-1.5 font-bold text-left pl-2 cursor-pointer hover:bg-indigo-100" onClick={() => handleSort('stockName')}>股名</th>
                        <th className="p-1.5 font-bold text-indigo-600 text-right pr-4 cursor-pointer hover:bg-indigo-100" onClick={() => handleSort('shares')}>張數</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody className="text-slate-600 divide-y divide-slate-100">
                  {detailTab === 'estimate' && detailData.map((d: any, i) => (
                    <tr key={i} className="hover:bg-slate-50 transition-colors">
                      <td className="p-1.5 font-bold bg-slate-50/50 border-r border-slate-200 sticky left-0 z-10 text-left pl-2">{d.stockName}</td>
                      <td className="p-1.5 text-center">{d.type}</td>
                      <td className="p-1.5 text-right pr-4">{d.shares}</td>
                      <td className="p-1.5 text-right pr-4">{d.days}</td>
                      <td className="p-1.5 font-bold text-indigo-600 text-right pr-4">{formatCurrency(d.estimate)}</td>
                    </tr>
                  ))}
                  {detailTab === 'estimate' && (
                    <tr className="sticky bottom-0 z-30 bg-indigo-50 border-t border-slate-200 text-indigo-800 shadow-[0_-1px_2px_rgba(0,0,0,0.05)]">
                      <td colSpan={2} className="p-1.5 font-bold text-center border-r border-slate-200 sticky left-0 z-40 bg-indigo-50">合計</td>
                      <td className="p-1.5 font-bold text-right pr-4">{formatCurrency(detailData.reduce((s: number, d: any) => s + d.shares, 0))}</td>
                      <td className="p-1.5 font-bold text-right pr-4">{formatCurrency(detailData.reduce((s: number, d: any) => s + d.days, 0))}</td>
                      <td className="p-1.5 font-bold text-indigo-600 text-right pr-4">{formatCurrency(detailData.reduce((s: number, d: any) => s + d.estimate, 0))}</td>
                    </tr>
                  )}
                  
                  {(detailTab === 'lent' || detailTab === 'inventory') && detailData.map((d: any, i) => (
                    <tr key={i} className="hover:bg-slate-50 transition-colors">
                      <td className="p-1.5 text-center">{d.stockId}</td>
                      <td className="p-1.5 font-bold text-left pl-2">{d.stockName}</td>
                      <td className="p-1.5 font-bold text-indigo-600 text-right pr-4">{formatCurrency(d.shares)}</td>
                    </tr>
                  ))}
                  {(detailTab === 'lent' || detailTab === 'inventory') && (
                    <tr className="sticky bottom-0 z-30 bg-indigo-50 border-t border-slate-200 text-indigo-800 shadow-[0_-1px_2px_rgba(0,0,0,0.05)]">
                      <td colSpan={2} className="p-1.5 font-bold text-right border-r border-slate-200 pr-4 sticky left-0 z-40 bg-indigo-50">合計</td>
                      <td className="p-1.5 font-bold text-indigo-600 text-right pr-4">{formatCurrency(detailData.reduce((s: number, d: any) => s + d.shares, 0))}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
