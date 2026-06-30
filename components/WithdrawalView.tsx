import { useState, useEffect, useMemo } from 'react';
import Papa from 'papaparse';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';

const CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSnkojvITxtjSfxyv0D85BEfMv80ANLdGyXGZih5prz6-W_0KfP1Fr5fRFwx8jUGkvEIQjoVa4afbnJ/pub?gid=24682956&single=true&output=csv';

interface WithdrawalRecord {
  date: string;
  year: number;
  month: number;
  amount: number;
  account: string;
  feeType: string;
  usageType: string;
  expenseType: string;
  note: string;
}

interface PurchaseRecord {
  account: string;
  stockId: string;
  date: string; 
  buySell: string; 
  price: number;
  shares: number;
  fee: number;
  tax: number;
}

interface DividendEvent {
  stockId: string;
  exDate: string; 
  dividendPerShare: number;
}

export default function WithdrawalView({ activeAccount = 'all', refreshKey = 0 }: { activeAccount?: string, refreshKey?: number }) {
  const [records, setRecords] = useState<WithdrawalRecord[]>([]);
  const [purchaseRecords, setPurchaseRecords] = useState<PurchaseRecord[]>([]);
  const [dividendEvents, setDividendEvents] = useState<DividendEvent[]>([]);

  const [activeTab, setActiveTab] = useState('overview'); // overview, company, life, highschool, virtual
  const [overviewSubTab, setOverviewSubTab] = useState('amount'); // amount, dividend, year
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [categorySubTabs, setCategorySubTabs] = useState<Record<string, string>>({
    company: 'summary', life: 'summary', highschool: 'summary', virtual: 'summary'
  });
  const [dividendChartMode, setDividendChartMode] = useState<'purchase' | 'dividend'>('purchase');

  const filteredRecords = useMemo(() => {
    if (activeAccount === 'all') return records;
    return records.filter(r => r.account === activeAccount);
  }, [records, activeAccount]);

  const availableYears = useMemo(() => {
    const yearSums = new Map<number, number>();
    const source = activeTab === 'virtual' ? records : filteredRecords;
    source.forEach(r => {
      if (r.year > 0) {
        yearSums.set(r.year, (yearSums.get(r.year) || 0) + r.amount);
      }
    });
    return Array.from(yearSums.entries())
      .filter(([_, sum]) => sum > 0)
      .map(([year]) => year)
      .sort((a, b) => a - b);
  }, [filteredRecords, records, activeTab]);

  const handleNextYear = () => {
    const next = availableYears.find(y => y > selectedYear);
    if (next) setSelectedYear(next);
  };
  
  const handlePrevYear = () => {
    const prev = [...availableYears].reverse().find(y => y < selectedYear);
    if (prev) setSelectedYear(prev);
  };

  const fetchData = async () => {
    try {
      const [res203, res219, res215] = await Promise.all([
        fetch(CSV_URL),
        fetch('https://docs.google.com/spreadsheets/d/e/2PACX-1vSnkojvITxtjSfxyv0D85BEfMv80ANLdGyXGZih5prz6-W_0KfP1Fr5fRFwx8jUGkvEIQjoVa4afbnJ/pub?gid=522688960&single=true&output=csv'),
        fetch('https://docs.google.com/spreadsheets/d/e/2PACX-1vR5JvOGT3eB4xq9phw2dXHApJKOgQkUZcs69CsJfL0Iw3s6egADwA8HdbimrWUceQZl_73pnsSLVnQw/pub?output=csv')
      ]);

      const [csv203, csv219, csv215] = await Promise.all([
        res203.text(),
        res219.text(),
        res215.text()
      ]);
      
      Papa.parse(csv203, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          const parsedRecords: WithdrawalRecord[] = results.data.map((row: any) => {
            const dateStr = row['日期'] || '';
            let year = 0, month = 0;
            if (dateStr) {
              const parts = dateStr.split('/');
              if (parts.length >= 2) {
                year = parseInt(parts[0], 10);
                month = parseInt(parts[1], 10);
              }
            }
            const amountStr = row['金額'] || '0';
            const amount = parseFloat(String(amountStr).replace(/,/g, ''));
            let parsedAccount = row['證券戶'] || '';
            if (parsedAccount === '信用卡') parsedAccount = '俊龍';
            return {
              date: dateStr,
              year,
              month,
              amount: isNaN(amount) ? 0 : amount,
              account: parsedAccount,
              feeType: row['費用說明'] || '',
              usageType: row['領用說明'] || '',
              expenseType: row['支出說明'] || '',
              note: row['備註'] || '',
            };
          });
          setRecords(parsedRecords.filter(r => r.year > 0));
        },
      });

      Papa.parse(csv219, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          const parsed: PurchaseRecord[] = results.data.map((row: any) => {
            const price = parseFloat(String(row['價格'] || '0').replace(/,/g, ''));
            const shares = parseFloat(String(row['股數'] || '0').replace(/,/g, ''));
            const fee = parseFloat(String(row['手續費'] || '0').replace(/,/g, ''));
            const tax = parseFloat(String(row['交易稅'] || '0').replace(/,/g, ''));
            
            let parsedAccount = row['證券戶'] || '';
            if (parsedAccount === '信用卡') parsedAccount = '俊龍';

            return {
              account: parsedAccount,
              stockId: String(row['股號'] || '').trim(),
              date: String(row['日期'] || '').trim(),
              buySell: row['買賣別'] || '',
              price: isNaN(price) ? 0 : price,
              shares: isNaN(shares) ? 0 : shares,
              fee: isNaN(fee) ? 0 : fee,
              tax: isNaN(tax) ? 0 : tax,
            };
          });
          setPurchaseRecords(parsed.filter(r => r.date));
        },
      });

      Papa.parse(csv215, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          const parsed: DividendEvent[] = results.data.map((row: any) => {
            const dps = parseFloat(String(row['除息金額 '] || row['除息金額'] || '0').replace(/,/g, ''));
            return {
              stockId: String(row['ETF 代碼'] || row['ETF代碼'] || '').trim(),
              exDate: String(row['除息日期 '] || row['除息日期'] || '').trim(),
              dividendPerShare: isNaN(dps) ? 0 : dps,
            };
          });
          setDividendEvents(parsed.filter(r => r.exDate && r.exDate !== '-'));
        }
      });

    } catch (err: any) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchData();
  }, [refreshKey]);

  // UseMemos for data crunching
  const overviewAmountData = useMemo(() => {
    if (activeTab !== 'overview' || overviewSubTab !== 'amount') return null;
    const chartMap = new Map<number, any>();
    const feeTypeMap = new Map<string, { current: number, prev: number, total: number, children: Map<string, { current: number, prev: number, total: number }> }>();
  
    filteredRecords.forEach(r => {
      if (r.feeType === '虛擬帳戶') return;
      if (!chartMap.has(r.year)) chartMap.set(r.year, { year: r.year });
      const cData = chartMap.get(r.year);
      cData[r.feeType] = (cData[r.feeType] || 0) + r.amount;
  
      if (r.feeType) {
        if (!feeTypeMap.has(r.feeType)) feeTypeMap.set(r.feeType, { current: 0, prev: 0, total: 0, children: new Map() });
        const fData = feeTypeMap.get(r.feeType)!;
        fData.total += r.amount;
        if (r.year === selectedYear) fData.current += r.amount;
        if (r.year === selectedYear - 1) fData.prev += r.amount;

        if (r.usageType) {
            if (!fData.children.has(r.usageType)) fData.children.set(r.usageType, { current: 0, prev: 0, total: 0 });
            const uData = fData.children.get(r.usageType)!;
            uData.total += r.amount;
            if (r.year === selectedYear) uData.current += r.amount;
            if (r.year === selectedYear - 1) uData.prev += r.amount;
        }
      }
    });
  
    const tree = Array.from(feeTypeMap.entries()).map(([name, v]) => ({
       name,
       current: v.current,
       prev: v.prev,
       total: v.total,
       children: Array.from(v.children.entries()).map(([cName, cV]) => ({ name: cName, ...cV })).sort((a,b) => a.name.localeCompare(b.name, 'zh-TW'))
    })).sort((a,b) => a.name.localeCompare(b.name, 'zh-TW'));

    return {
      chartData: Array.from(chartMap.values()).sort((a, b) => a.year - b.year),
      allFeeTypes: Array.from(new Set(filteredRecords.filter(r => r.feeType !== '虛擬帳戶').map(r => r.feeType).filter(Boolean))).sort((a, b) => a.localeCompare(b, 'zh-TW')),
      tree
    };
  }, [filteredRecords, activeTab, overviewSubTab, selectedYear]);

  const dividendTableData = useMemo(() => {
    if (activeTab !== 'overview' || overviewSubTab !== 'dividend') return null;

    const purchases = activeAccount === 'all' ? purchaseRecords : purchaseRecords.filter(r => r.account === activeAccount);
    
    const yearlyData = new Map<number, { year: number, purchase: number, dividend: number, withdrawal: number }>();
    
    filteredRecords.forEach(r => {
      if (r.year > 0 && r.feeType !== '虛擬帳戶') {
        if (!yearlyData.has(r.year)) yearlyData.set(r.year, { year: r.year, purchase: 0, dividend: 0, withdrawal: 0 });
        yearlyData.get(r.year)!.withdrawal += r.amount;
      }
    });

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
    
    const parseDate = (dStr: string) => new Date(dStr).getTime();
    
    const holdingsByAccAndStock = new Map<string, PurchaseRecord[]>();
    purchases.forEach(r => {
        const key = `${r.account}_${r.stockId}`;
        if (!holdingsByAccAndStock.has(key)) holdingsByAccAndStock.set(key, []);
        holdingsByAccAndStock.get(key)!.push(r);
    });
    
    holdingsByAccAndStock.forEach(arr => arr.sort((a,b) => parseDate(a.date) - parseDate(b.date)));

    dividendEvents.forEach(ev => {
      const exDateTime = parseDate(ev.exDate);
      const year = new Date(ev.exDate).getFullYear();
      
      let totalDividendsForEvent = 0;
      
      holdingsByAccAndStock.forEach((txs, key) => {
         const stockId = key.split('_')[1];
         if (stockId === ev.stockId) {
             let heldShares = 0;
             for (const tx of txs) {
                 const txTime = parseDate(tx.date);
                 if (txTime <= exDateTime) {
                     if (tx.buySell === '買入') heldShares += tx.shares;
                     if (tx.buySell === '賣出') heldShares -= tx.shares;
                 } else {
                     break; 
                 }
             }
             if (heldShares > 0) {
                 totalDividendsForEvent += (heldShares * ev.dividendPerShare);
             }
         }
      });
      
      if (totalDividendsForEvent > 0 && !isNaN(year) && year > 2000) {
          if (!yearlyData.has(year)) yearlyData.set(year, { year, purchase: 0, dividend: 0, withdrawal: 0 });
          yearlyData.get(year)!.dividend += totalDividendsForEvent;
      }
    });

    const sortedData = Array.from(yearlyData.values()).sort((a, b) => a.year - b.year);
    let cumulativePurchase = 0;
    return sortedData.map(d => {
      cumulativePurchase += d.purchase;
      return { ...d, purchase: Math.round(cumulativePurchase), dividend: Math.round(d.dividend), withdrawal: Math.round(d.withdrawal) };
    })
    .filter(d => d.purchase > 0 || d.dividend > 0 || d.withdrawal > 0)
    .sort((a, b) => b.year - a.year);
  }, [activeTab, overviewSubTab, purchaseRecords, dividendEvents, filteredRecords, activeAccount]);

  const dividendChartData = useMemo(() => {
    if (!dividendTableData) return [];
    return [...dividendTableData].reverse().map(d => ({
      year: d.year,
      purchaseRatio: d.purchase > 0 ? parseFloat(((d.withdrawal / d.purchase) * 100).toFixed(1)) : 0,
      dividendRatio: d.dividend > 0 ? parseFloat(((d.withdrawal / d.dividend) * 100).toFixed(1)) : 0,
    }));
  }, [dividendTableData]);

  const summaryData = useMemo(() => {
    if (activeTab === 'overview') return null;
    const targetFeeType = activeTab === 'company' ? '公司費用' : activeTab === 'highschool' ? '高中費用' : activeTab === 'life' ? '生活費用' : '虛擬帳戶';
    const sourceRecords = activeTab === 'virtual' ? records : filteredRecords;
    const filtered = sourceRecords.filter(r => r.feeType === targetFeeType);
    
    const chartMap = new Map<number, any>();
    const usageTypeMap = new Map<string, { current: number, prev: number, total: number, children: Map<string, { current: number, prev: number, total: number }> }>();
    const chartKeysSet = new Set<string>();
  
    filtered.forEach(r => {
      if (!chartMap.has(r.year)) chartMap.set(r.year, { year: r.year });
      const cData = chartMap.get(r.year);
      
      const stackKey = activeTab === 'virtual' ? (r.expenseType || '未分類') : (r.usageType || '未分類');
      cData[stackKey] = (cData[stackKey] || 0) + r.amount;
      chartKeysSet.add(stackKey);
  
      if (r.usageType) {
        if (!usageTypeMap.has(r.usageType)) usageTypeMap.set(r.usageType, { current: 0, prev: 0, total: 0, children: new Map() });
        const uData = usageTypeMap.get(r.usageType)!;
        uData.total += r.amount;
        if (r.year === selectedYear) uData.current += r.amount;
        if (r.year === selectedYear - 1) uData.prev += r.amount;

        if (r.expenseType) {
            if (!uData.children.has(r.expenseType)) uData.children.set(r.expenseType, { current: 0, prev: 0, total: 0 });
            const eData = uData.children.get(r.expenseType)!;
            eData.total += r.amount;
            if (r.year === selectedYear) eData.current += r.amount;
            if (r.year === selectedYear - 1) eData.prev += r.amount;
        }
      }
    });
  
    const tree = Array.from(usageTypeMap.entries()).map(([name, v]) => ({
       name,
       current: v.current,
       prev: v.prev,
       total: v.total,
       children: Array.from(v.children.entries()).map(([cName, cV]) => ({ name: cName, ...cV })).sort((a,b) => a.name.localeCompare(b.name, 'zh-TW'))
    })).sort((a,b) => a.name.localeCompare(b.name, 'zh-TW'));

    return {
      chartData: Array.from(chartMap.values()).sort((a, b) => a.year - b.year),
      allUsageTypes: Array.from(new Set(filtered.map(r => r.usageType).filter(Boolean))).sort((a, b) => a.localeCompare(b, 'zh-TW')),
      chartKeys: Array.from(chartKeysSet).sort((a, b) => a.localeCompare(b, 'zh-TW')),
      tree
    };
  }, [filteredRecords, activeTab, selectedYear]);

  const monthlyData = useMemo(() => {
    if (activeTab === 'overview') return null;
    const targetFeeType = activeTab === 'company' ? '公司費用' : activeTab === 'highschool' ? '高中費用' : activeTab === 'life' ? '生活費用' : '虛擬帳戶';
    const sourceRecords = activeTab === 'virtual' ? records : filteredRecords;
    const filtered = sourceRecords.filter(r => r.feeType === targetFeeType);
    let allUsageTypes = Array.from(new Set(filtered.map(r => r.usageType).filter(Boolean))).sort((a, b) => a.localeCompare(b, 'zh-TW'));
    
    // Default subTab is 'monthly' or 'summary'
    let currentUsageType = '全部支出';
    const subTab = categorySubTabs[activeTab] || 'summary';
    if (subTab !== 'summary' && subTab !== 'monthly') {
      currentUsageType = subTab;
    }

    const yearFiltered = filtered.filter(r => r.year === selectedYear && (currentUsageType === '全部支出' ? true : r.usageType === currentUsageType));
    
    const chartMap = new Map<number, any>();
    const expenseTypeTotals = new Map<string, number[]>();
    const allExpenseTypes = new Set<string>();
  
    yearFiltered.forEach(r => {
      if (r.month >= 1 && r.month <= 12) {
        if (!chartMap.has(r.month)) chartMap.set(r.month, { month: r.month });
        const cData = chartMap.get(r.month);
        cData[r.expenseType] = (cData[r.expenseType] || 0) + r.amount;
        
        allExpenseTypes.add(r.expenseType);
        
        if (!expenseTypeTotals.has(r.expenseType)) expenseTypeTotals.set(r.expenseType, Array(12).fill(0));
        expenseTypeTotals.get(r.expenseType)![r.month - 1] += r.amount;
      }
    });
    
    return {
      allUsageTypes,
      activeUsageType: currentUsageType,
      chartData: Array.from({length: 12}, (_, i) => ({ month: i+1, ...chartMap.get(i+1) || {} })),
      allExpenseTypes: Array.from(allExpenseTypes).sort((a,b) => a.localeCompare(b, 'zh-TW')),
      expenseTypeTotals: Array.from(expenseTypeTotals.entries()).map(([name, months]) => ({ name, months, total: months.reduce((a,b)=>a+b, 0) })).sort((a,b) => a.name.localeCompare(b.name, 'zh-TW'))
    };
  }, [filteredRecords, records, activeTab, selectedYear, categorySubTabs]);

  const formatCurrency = (val: number) => val === 0 ? '-' : val.toLocaleString();
  const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#eab308'];
  
  // Render sub-tabs for withdrawal
  const renderNav = () => (
    <div className="flex flex-col shrink-0">
      <div className="bg-white px-2 py-1.5 flex justify-between gap-1 border-b border-slate-200 overflow-x-auto no-scrollbar">
        {[
          { id: 'overview', label: '總表' },
          { id: 'company', label: '公司' },
          { id: 'life', label: '生活' },
          { id: 'highschool', label: '高中' },
          { id: 'virtual', label: '虛擬' }
        ].map(tab => (
          <button 
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-3 py-1.5 rounded-md text-xs transition-all flex-none text-center ${activeTab === tab.id ? 'bg-indigo-50 text-indigo-700 font-bold shadow-sm' : 'text-slate-500'}`}
          >
            {tab.label}
          </button>
        ))}
        <button className="px-3 py-1.5 rounded-md text-xs transition-all flex-none text-center text-indigo-600 font-bold bg-indigo-50/50 flex items-center gap-1">
          <Plus size={14} /> 新增
        </button>
      </div>
      {activeTab !== 'overview' && (
        <div className="bg-slate-50 px-2 py-1 flex gap-2 border-b border-slate-200 overflow-x-auto no-scrollbar">
          {getSubTabsForCategory(activeTab).map(sub => (
            <button
              key={sub.id}
              onClick={() => setCategorySubTabs(prev => ({ ...prev, [activeTab]: sub.id }))}
              className={`px-3 py-1 rounded-md text-xs font-bold transition-colors ${
                (categorySubTabs[activeTab] || 'summary') === sub.id
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-white text-slate-600 border border-slate-200 hover:border-indigo-300'
              }`}
            >
              {sub.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );

  const getSubTabsForCategory = (cat: string) => {
    const summary = { id: 'summary', label: '總表明細' };
    const monthly = { id: 'monthly', label: '月份明細' };
    const life = { id: '生活支出', label: '生活支出' };
    const bank = { id: '銀行支出', label: '銀行支出' };
    
    if (cat === 'life') return [summary, life, bank];
    if (cat === 'highschool') return [summary, { id: '禹君學習', label: '禹君學習' }, { id: '禹辰學習', label: '禹辰學習' }];
    if (cat === 'company') return [summary, { id: '公司支出', label: '公司支出' }, { id: '公司紅利', label: '公司紅利' }];
    return [summary, monthly];
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

  const renderOverview = () => {
    const { chartData = [], allFeeTypes = [], tree = [] } = overviewAmountData || {};

    return (
      <div className="flex flex-col h-full space-y-2">
        <div className="flex gap-2 p-1.5 bg-white border-b border-slate-200">
          <button onClick={() => setOverviewSubTab('amount')} className={`px-2.5 py-1 text-xs rounded-md font-bold transition-colors ${overviewSubTab === 'amount' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'}`}>領用金額</button>
          <button onClick={() => setOverviewSubTab('dividend')} className={`px-2.5 py-1 text-xs rounded-md font-bold transition-colors ${overviewSubTab === 'dividend' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'}`}>領用率</button>
        </div>
        
        {overviewSubTab === 'amount' && (
          <div className="flex-1 flex flex-col min-h-0 px-1 space-y-1 pb-16">
            <div className="shrink-0 bg-white rounded-lg shadow-sm border border-slate-200 p-1.5 h-52">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} tickFormatter={(val) => `${val/10000}W`} />
                    <Tooltip cursor={{fill: '#f1f5f9'}} contentStyle={{fontSize: '12px', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} formatter={(val: number) => val.toLocaleString()} />
                    <Legend verticalAlign="top" align="right" content={renderCustomLegend} />
                    {allFeeTypes.map((type, idx) => (
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
              <div className="shrink-0 grid grid-cols-[2fr_1.5fr_0.5fr_1.5fr_0.5fr_1.5fr] bg-slate-100 p-1 border-b border-slate-200 text-slate-600 font-bold text-center items-center rounded-t-lg">
                <div className="text-left pl-1">項目</div>
                <div className="text-indigo-600 text-right">{selectedYear}</div>
                <button onClick={handleNextYear} disabled={!availableYears.find(y => y > selectedYear)} className="hover:bg-slate-300 rounded p-0.5 disabled:opacity-30 mx-auto"><ChevronRight size={14}/></button>
                <div className="text-right">{selectedYear - 1}</div>
                <button onClick={handlePrevYear} disabled={!availableYears.find(y => y < selectedYear)} className="hover:bg-slate-300 rounded p-0.5 disabled:opacity-30 mx-auto"><ChevronLeft size={14}/></button>
                <div className="text-right pr-1">合計</div>
              </div>
              <div className="flex-1 overflow-y-auto no-scrollbar divide-y divide-slate-100">
                {tree.map(master => (
                  <div key={master.name}>
                    {/* Master Row */}
                    <div className="grid grid-cols-[2fr_1.5fr_0.5fr_1.5fr_0.5fr_1.5fr] p-1 items-center bg-indigo-50/30">
                      <div className="font-bold truncate text-left text-indigo-800 pl-1">{master.name}</div>
                      <div className="text-right text-indigo-600 font-bold">{formatCurrency(master.current)}</div>
                      <div></div>
                      <div className="text-right font-bold text-slate-600">{formatCurrency(master.prev)}</div>
                      <div></div>
                      <div className="text-right font-bold text-slate-700 pr-1">{formatCurrency(master.total)}</div>
                    </div>
                    {/* Detail Rows */}
                    {master.children.map(child => (
                      <div key={child.name} className="grid grid-cols-[2fr_1.5fr_0.5fr_1.5fr_0.5fr_1.5fr] p-1 items-center hover:bg-slate-50 transition-colors">
                        <div className="truncate text-left pl-4 text-slate-500 before:content-['└_'] before:mr-0.5 before:text-slate-300">{child.name}</div>
                        <div className="text-right text-indigo-500">{formatCurrency(child.current)}</div>
                        <div></div>
                        <div className="text-right text-slate-500">{formatCurrency(child.prev)}</div>
                        <div></div>
                        <div className="text-right text-slate-600 pr-1">{formatCurrency(child.total)}</div>
                      </div>
                    ))}
                  </div>
                ))}
                {tree.length > 0 && (
                  <div className="grid grid-cols-[2fr_1.5fr_0.5fr_1.5fr_0.5fr_1.5fr] p-1 items-center bg-indigo-100/50 sticky bottom-0 border-t border-indigo-200">
                    <div className="font-bold truncate text-left text-indigo-900 pl-1">合計</div>
                    <div className="text-right text-indigo-700 font-bold">{formatCurrency(tree.reduce((sum, m) => sum + m.current, 0))}</div>
                    <div></div>
                    <div className="text-right font-bold text-slate-700">{formatCurrency(tree.reduce((sum, m) => sum + m.prev, 0))}</div>
                    <div></div>
                    <div className="text-right font-bold text-slate-800 pr-1">{formatCurrency(tree.reduce((sum, m) => sum + m.total, 0))}</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {overviewSubTab === 'dividend' && (
          <div className="flex-1 flex flex-col min-h-0 px-1 space-y-1 pb-16">
            <div className="shrink-0 bg-white rounded-lg shadow-sm border border-slate-200 p-1.5 h-52 flex flex-col">
              <div className="flex justify-start gap-2 mb-1 shrink-0 pl-1">
                <button onClick={() => setDividendChartMode('purchase')} className={`px-3 py-1 rounded-md text-[10px] font-bold border ${dividendChartMode === 'purchase' ? 'border-indigo-500 text-indigo-700 bg-indigo-50' : 'border-slate-200 text-slate-600 hover:border-indigo-300'}`}>本金領用率</button>
                <button onClick={() => setDividendChartMode('dividend')} className={`px-3 py-1 rounded-md text-[10px] font-bold border ${dividendChartMode === 'dividend' ? 'border-indigo-500 text-indigo-700 bg-indigo-50' : 'border-slate-200 text-slate-600 hover:border-indigo-300'}`}>股息領用率</button>
              </div>
              <div className="flex-1 min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dividendChartData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} dy={5} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} dx={-5} tickFormatter={(val) => `${val}%`} />
                    <Tooltip cursor={{fill: '#f1f5f9'}} contentStyle={{fontSize: '12px', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} formatter={(val: number) => [`${val}%`, dividendChartMode === 'purchase' ? '領用/購買' : '領用/股息']} />
                    <Bar dataKey={dividendChartMode === 'purchase' ? 'purchaseRatio' : 'dividendRatio'} fill="#4f46e5" radius={[4, 4, 0, 0]} barSize={32} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="flex-1 bg-white rounded-lg shadow-sm border border-slate-200 flex flex-col min-h-0 text-xs">
              <div className="shrink-0 grid grid-cols-[1fr_2fr_2fr_2fr] bg-slate-100 p-1.5 border-b border-slate-200 text-slate-600 font-bold text-center items-center rounded-t-lg">
                <div>年份</div>
                <div className="text-right">購買金額</div>
                <div className="text-right">股息金額</div>
                <div className="text-right pr-2">領用金額</div>
              </div>
              <div className="flex-1 overflow-y-auto no-scrollbar divide-y divide-slate-100">
                {dividendTableData?.map(item => (
                  <div key={item.year} className="grid grid-cols-[1fr_2fr_2fr_2fr] p-1.5 items-center hover:bg-slate-50 transition-colors text-slate-600">
                    <div className="font-bold text-indigo-700 text-center">{item.year}</div>
                    <div className="text-right">{formatCurrency(item.purchase)}</div>
                    <div className="text-right text-green-600 font-bold">{formatCurrency(item.dividend)}</div>
                    <div className="text-right text-indigo-600 font-bold pr-2">{formatCurrency(item.withdrawal)}</div>
                  </div>
                ))}
                {(!dividendTableData || dividendTableData.length === 0) && (
                  <div className="flex items-center justify-center h-32 text-slate-400">
                    尚無資料
                  </div>
                )}
                {dividendTableData && dividendTableData.length > 0 && (
                  <div className="grid grid-cols-[1fr_2fr_2fr_2fr] p-1.5 items-center bg-indigo-100/50 sticky bottom-0 border-t border-indigo-200 text-slate-600">
                    <div className="font-bold text-indigo-900 text-center">合計</div>
                    <div className="text-right text-indigo-700 font-bold">{formatCurrency(Math.max(...dividendTableData.map(d => d.purchase), 0))}</div>
                    <div className="text-right text-green-700 font-bold">{formatCurrency(dividendTableData.reduce((sum, item) => sum + item.dividend, 0))}</div>
                    <div className="text-right text-indigo-700 font-bold pr-2">{formatCurrency(dividendTableData.reduce((sum, item) => sum + item.withdrawal, 0))}</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderSummaryView = () => {
    if (!summaryData) return null;
    const { chartData, chartKeys = [], tree } = summaryData;

    return (
      <div className="flex-1 flex flex-col min-h-0 px-1 space-y-1 pb-16 pt-1">
        <div className="shrink-0 bg-white rounded-lg shadow-sm border border-slate-200 p-1.5 h-52">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} tickFormatter={(val) => `${val/10000}W`} />
                <Tooltip cursor={{fill: '#f1f5f9'}} contentStyle={{fontSize: '12px', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} formatter={(val: number) => val.toLocaleString()} />
                <Legend verticalAlign="top" align="right" content={renderCustomLegend} />
                {chartKeys.map((type, idx) => (
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
          <div className="shrink-0 grid grid-cols-[2fr_1.5fr_0.5fr_1.5fr_0.5fr_1.5fr] bg-slate-100 p-1 border-b border-slate-200 text-slate-600 font-bold text-center items-center rounded-t-lg">
            <div className="text-left pl-1">項目</div>
            <div className="text-indigo-600 text-right">{selectedYear}</div>
            <button onClick={handleNextYear} disabled={!availableYears.find(y => y > selectedYear)} className="hover:bg-slate-300 rounded p-0.5 disabled:opacity-30 mx-auto"><ChevronRight size={14}/></button>
            <div className="text-right">{selectedYear - 1}</div>
            <button onClick={handlePrevYear} disabled={!availableYears.find(y => y < selectedYear)} className="hover:bg-slate-300 rounded p-0.5 disabled:opacity-30 mx-auto"><ChevronLeft size={14}/></button>
            <div className="text-right pr-1">合計</div>
          </div>
          <div className="flex-1 overflow-y-auto no-scrollbar divide-y divide-slate-100">
            {tree.map(master => (
              <div key={master.name}>
                {/* Master Row */}
                <div className="grid grid-cols-[2fr_1.5fr_0.5fr_1.5fr_0.5fr_1.5fr] p-1 items-center bg-indigo-50/30">
                  <div className="font-bold truncate text-left text-indigo-800 pl-1">{master.name}</div>
                  <div className="text-right text-indigo-600 font-bold">{formatCurrency(master.current)}</div>
                  <div></div>
                  <div className="text-right font-bold text-slate-600">{formatCurrency(master.prev)}</div>
                  <div></div>
                  <div className="text-right font-bold text-slate-700 pr-1">{formatCurrency(master.total)}</div>
                </div>
                {/* Detail Rows */}
                {master.children.map(child => (
                  <div key={child.name} className="grid grid-cols-[2fr_1.5fr_0.5fr_1.5fr_0.5fr_1.5fr] p-1 items-center hover:bg-slate-50 transition-colors">
                    <div className="truncate text-left pl-4 text-slate-500 before:content-['└_'] before:mr-0.5 before:text-slate-300">{child.name}</div>
                    <div className="text-right text-indigo-500">{formatCurrency(child.current)}</div>
                    <div></div>
                    <div className="text-right text-slate-500">{formatCurrency(child.prev)}</div>
                    <div></div>
                    <div className="text-right text-slate-600 pr-1">{formatCurrency(child.total)}</div>
                  </div>
                ))}
              </div>
            ))}
            {tree.length > 0 && (
              <div className="grid grid-cols-[2fr_1.5fr_0.5fr_1.5fr_0.5fr_1.5fr] p-1 items-center bg-indigo-100/50 sticky bottom-0 border-t border-indigo-200">
                <div className="font-bold truncate text-left text-indigo-900 pl-1">合計</div>
                <div className="text-right text-indigo-700 font-bold">{formatCurrency(tree.reduce((sum, m) => sum + m.current, 0))}</div>
                <div></div>
                <div className="text-right font-bold text-slate-700">{formatCurrency(tree.reduce((sum, m) => sum + m.prev, 0))}</div>
                <div></div>
                <div className="text-right font-bold text-slate-800 pr-1">{formatCurrency(tree.reduce((sum, m) => sum + m.total, 0))}</div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderMonthlyView = () => {
    if (!monthlyData) return null;
    const { activeUsageType, chartData, allExpenseTypes, expenseTypeTotals } = monthlyData;

    return (
      <div className="flex-1 flex flex-col min-h-0 px-1 space-y-1 pb-16 pt-1">
        <div className="shrink-0 bg-white rounded-lg shadow-sm border border-slate-200 p-1.5 h-52 relative flex flex-col">
          <div className="flex justify-between items-start gap-2 px-1 mb-1 z-10">
            <div className="flex justify-start items-center gap-2 shrink-0">
              <button onClick={handlePrevYear} disabled={!availableYears.find(y => y < selectedYear)} className="p-1 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors disabled:opacity-30"><ChevronLeft size={16}/></button>
              <span className="text-xs font-bold text-slate-700">{selectedYear} 年</span>
              <button onClick={handleNextYear} disabled={!availableYears.find(y => y > selectedYear)} className="p-1 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors disabled:opacity-30"><ChevronRight size={16}/></button>
            </div>
            <ul className="flex flex-wrap justify-end gap-x-1 gap-y-1">
              {allExpenseTypes.map((type, index) => (
                <li key={`item-${index}`} className="flex items-center gap-0.5">
                  <span className="w-2 h-2 rounded-sm shrink-0" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                  <span className="text-slate-600 text-[9px]">{type}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="flex-1 min-h-0 relative">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} tickFormatter={(val) => `${val}月`} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} tickFormatter={(val) => `${val/1000}k`} />
                  <Tooltip cursor={{fill: '#f1f5f9'}} contentStyle={{fontSize: '12px', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} formatter={(val: number) => val.toLocaleString()} />
                  {allExpenseTypes.map((type, idx) => (
                    <Bar key={type} dataKey={type} stackId="a" fill={COLORS[idx % COLORS.length]} />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-slate-400 absolute inset-0">
                <span className="font-bold text-sm">無資料</span>
              </div>
            )}
          </div>
        </div>
  
        <div className="flex-1 bg-white rounded-lg shadow-sm border border-slate-200 flex flex-col min-h-0">
          <div className="flex-1 overflow-auto no-scrollbar">
            <table className="w-full text-[10px] text-center whitespace-nowrap">
              <thead className="sticky top-0 z-30">
                <tr className="bg-indigo-50 border-b border-slate-200 text-indigo-800">
                  <th className="p-1.5 font-bold sticky left-0 bg-indigo-50 border-r border-slate-200 z-40 shadow-[1px_0_0_0_#e2e8f0]">月份</th>
                  {allExpenseTypes.map(type => (
                    <th key={type} className="p-1.5 font-bold text-right pr-2" style={activeUsageType === '全部支出' ? { minWidth: '25vw', width: '25vw' } : {}}>{type}</th>
                  ))}
                  <th className="p-1.5 font-bold text-indigo-600 sticky right-0 bg-indigo-50 border-l border-slate-200 z-40 shadow-[-1px_0_0_0_#e2e8f0] text-right pr-2">合計</th>
                </tr>
              </thead>
              <tbody className="text-slate-600 divide-y divide-slate-100">
                {Array.from({length: 12}).map((_, i) => {
                  let rowTotal = 0;
                  return (
                    <tr key={i} className="hover:bg-slate-50 transition-colors">
                      <td className="p-1.5 font-bold bg-slate-50/50 border-r border-slate-200 sticky left-0 z-10 text-slate-700 shadow-[1px_0_0_0_#e2e8f0] text-center">{i + 1}月</td>
                      {allExpenseTypes.map(type => {
                        const amount = expenseTypeTotals.find(e => e.name === type)?.months[i] || 0;
                        rowTotal += amount;
                        return <td key={type} className="p-1.5 text-right pr-2" style={activeUsageType === '全部支出' ? { minWidth: '25vw', width: '25vw' } : {}}>{formatCurrency(amount)}</td>;
                      })}
                      <td className="p-1.5 font-bold text-indigo-600 sticky right-0 bg-slate-50/50 border-l border-slate-200 z-10 shadow-[-1px_0_0_0_#e2e8f0] text-right pr-2">{formatCurrency(rowTotal)}</td>
                    </tr>
                  );
                })}
                <tr className="bg-slate-50/50">
                  <td className="p-1.5 font-bold border-r border-slate-200 sticky left-0 z-10 shadow-[1px_0_0_0_#e2e8f0] text-center">合計</td>
                  {allExpenseTypes.map(type => {
                    const total = expenseTypeTotals.find(e => e.name === type)?.total || 0;
                    return <td key={type} className="p-1.5 font-bold text-right pr-2" style={activeUsageType === '全部支出' ? { minWidth: '25vw', width: '25vw' } : {}}>{formatCurrency(total)}</td>;
                  })}
                  <td className="p-1.5 font-bold text-indigo-600 sticky right-0 bg-slate-50/50 border-l border-slate-200 z-10 shadow-[-1px_0_0_0_#e2e8f0] text-right pr-2">
                    {formatCurrency(expenseTypeTotals.reduce((sum, e) => sum + e.total, 0))}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 flex-1 overflow-hidden">
      {renderNav()}
      {activeTab === 'overview' && renderOverview()}
      {activeTab !== 'overview' && (
        (categorySubTabs[activeTab] || 'summary') === 'summary' ? renderSummaryView() : renderMonthlyView()
      )}
    </div>
  );
}
