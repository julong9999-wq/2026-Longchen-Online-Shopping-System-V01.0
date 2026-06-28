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

export default function WithdrawalView({ activeAccount = 'all', refreshKey = 0 }: { activeAccount?: string, refreshKey?: number }) {
  const [records, setRecords] = useState<WithdrawalRecord[]>([]);

  const [activeTab, setActiveTab] = useState('overview'); // overview, company, life, highschool, virtual
  const [overviewSubTab, setOverviewSubTab] = useState('amount'); // amount, dividend, year
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [lifeUsageType, setLifeUsageType] = useState<string>(''); // For life and virtual tabs

  const filteredRecords = useMemo(() => {
    if (activeAccount === 'all') return records;
    return records.filter(r => r.account === activeAccount);
  }, [records, activeAccount]);

  const availableYears = useMemo(() => {
    const yearSums = new Map<number, number>();
    filteredRecords.forEach(r => {
      if (r.year > 0) {
        yearSums.set(r.year, (yearSums.get(r.year) || 0) + r.amount);
      }
    });
    return Array.from(yearSums.entries())
      .filter(([_, sum]) => sum > 0)
      .map(([year]) => year)
      .sort((a, b) => a - b);
  }, [filteredRecords]);

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
      const response = await fetch(CSV_URL);
      const csvText = await response.text();
      
      Papa.parse(csvText, {
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
            return {
              date: dateStr,
              year,
              month,
              amount: isNaN(amount) ? 0 : amount,
              account: row['證券戶'] || '',
              feeType: row['費用說明'] || '',
              usageType: row['領用說明'] || '',
              expenseType: row['支出說明'] || '',
              note: row['備註'] || '',
            };
          });
          setRecords(parsedRecords.filter(r => r.year > 0));
        },
      });
    } catch (err: any) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchData();
  }, [refreshKey]);

  // Set default usage type for life/virtual when tab changes
  useEffect(() => {
    if (activeTab === 'life') {
      const types = Array.from(new Set(filteredRecords.filter(r => r.feeType === '生活費用').map(r => r.usageType))).filter(Boolean);
      if (types.length > 0 && !types.includes(lifeUsageType)) setLifeUsageType(types[0]);
    } else if (activeTab === 'virtual') {
      const types = Array.from(new Set(filteredRecords.filter(r => r.feeType === '虛擬帳戶').map(r => r.usageType))).filter(t => t && t !== '銀行費用');
      if (types.length > 0 && !types.includes(lifeUsageType)) setLifeUsageType(types[0]);
    }
  }, [activeTab, filteredRecords]);

  // UseMemos for data crunching
  const overviewAmountData = useMemo(() => {
    if (activeTab !== 'overview' || overviewSubTab !== 'amount') return null;
    const chartMap = new Map<number, any>();
    const feeTypeMap = new Map<string, { current: number, prev: number, total: number, children: Map<string, { current: number, prev: number, total: number }> }>();
  
    filteredRecords.forEach(r => {
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
       children: Array.from(v.children.entries()).map(([cName, cV]) => ({ name: cName, ...cV }))
    }));

    return {
      chartData: Array.from(chartMap.values()).sort((a, b) => a.year - b.year),
      allFeeTypes: Array.from(new Set(filteredRecords.map(r => r.feeType).filter(Boolean))),
      tree
    };
  }, [filteredRecords, activeTab, overviewSubTab, selectedYear]);

  const companySchoolData = useMemo(() => {
    if (activeTab !== 'company' && activeTab !== 'highschool') return null;
    const targetFeeType = activeTab === 'company' ? '公司費用' : '高中費用';
    const filtered = filteredRecords.filter(r => r.feeType === targetFeeType);
    
    const chartMap = new Map<number, any>();
    const usageTypeMap = new Map<string, { current: number, prev: number, total: number, children: Map<string, { current: number, prev: number, total: number }> }>();
  
    filtered.forEach(r => {
      if (!chartMap.has(r.year)) chartMap.set(r.year, { year: r.year });
      const cData = chartMap.get(r.year);
      cData[r.usageType] = (cData[r.usageType] || 0) + r.amount;
  
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
       children: Array.from(v.children.entries()).map(([cName, cV]) => ({ name: cName, ...cV }))
    }));

    return {
      chartData: Array.from(chartMap.values()).sort((a, b) => a.year - b.year),
      allUsageTypes: Array.from(new Set(filtered.map(r => r.usageType).filter(Boolean))),
      tree
    };
  }, [filteredRecords, activeTab, selectedYear]);

  const lifeVirtualData = useMemo(() => {
    if (activeTab !== 'life' && activeTab !== 'virtual') return null;
    const targetFeeType = activeTab === 'life' ? '生活費用' : '虛擬帳戶';
    const filtered = filteredRecords.filter(r => r.feeType === targetFeeType);
    let allUsageTypes = Array.from(new Set(filtered.map(r => r.usageType).filter(Boolean)));
    if (activeTab === 'virtual') {
      allUsageTypes = allUsageTypes.filter(t => t !== '銀行費用');
    }
    const yearFiltered = filtered.filter(r => r.year === selectedYear && r.usageType === lifeUsageType);
    
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
      chartData: Array.from({length: 12}, (_, i) => ({ month: i+1, ...chartMap.get(i+1) || {} })),
      allExpenseTypes: Array.from(allExpenseTypes),
      expenseTypeTotals: Array.from(expenseTypeTotals.entries()).map(([name, months]) => ({ name, months, total: months.reduce((a,b)=>a+b, 0) }))
    };
  }, [filteredRecords, activeTab, selectedYear, lifeUsageType]);

  const formatCurrency = (val: number) => val === 0 ? '-' : val.toLocaleString();
  const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#eab308'];
  
  // Render sub-tabs for withdrawal
  const renderNav = () => (
    <div className="bg-white px-2 py-1.5 flex justify-between gap-1 shrink-0 border-b border-slate-200 overflow-x-auto no-scrollbar">
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
  );

  const renderOverview = () => {
    if (!overviewAmountData) return null;
    const { chartData, allFeeTypes, tree } = overviewAmountData;

    return (
      <div className="flex flex-col h-full space-y-2">
        <div className="flex gap-2 p-1.5 bg-white border-b border-slate-200">
          <button onClick={() => setOverviewSubTab('amount')} className={`px-2.5 py-1 text-xs rounded-md font-bold transition-colors ${overviewSubTab === 'amount' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'}`}>領用金額</button>
          <button onClick={() => setOverviewSubTab('dividend')} className={`px-2.5 py-1 text-xs rounded-md font-bold transition-colors ${overviewSubTab === 'dividend' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'}`}>股息領用</button>
          <button onClick={() => setOverviewSubTab('year')} className={`px-2.5 py-1 text-xs rounded-md font-bold transition-colors ${overviewSubTab === 'year' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'}`}>YYYY</button>
        </div>
        
        {overviewSubTab === 'amount' && (
          <div className="flex-1 flex flex-col min-h-0 px-2 space-y-2 pb-20">
            <div className="shrink-0 bg-white rounded-lg shadow-sm border border-slate-200 p-2 h-48">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} tickFormatter={(val) => `${val/10000}W`} />
                    <Tooltip cursor={{fill: '#f1f5f9'}} contentStyle={{fontSize: '12px', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} formatter={(val: number) => val.toLocaleString()} />
                    <Legend wrapperStyle={{fontSize: '10px'}} />
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
              <div className="shrink-0 grid grid-cols-[2fr_1.5fr_0.5fr_1.5fr_0.5fr_1.5fr] bg-slate-100 p-1.5 border-b border-slate-200 text-slate-600 font-bold text-center items-center rounded-t-lg">
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
                    <div className="grid grid-cols-[2fr_1.5fr_0.5fr_1.5fr_0.5fr_1.5fr] p-1.5 items-center bg-indigo-50/30">
                      <div className="font-bold truncate text-left text-indigo-800 pl-1">{master.name}</div>
                      <div className="text-right text-indigo-600 font-bold">{formatCurrency(master.current)}</div>
                      <div></div>
                      <div className="text-right font-bold text-slate-600">{formatCurrency(master.prev)}</div>
                      <div></div>
                      <div className="text-right font-bold text-slate-700 pr-1">{formatCurrency(master.total)}</div>
                    </div>
                    {/* Detail Rows */}
                    {master.children.map(child => (
                      <div key={child.name} className="grid grid-cols-[2fr_1.5fr_0.5fr_1.5fr_0.5fr_1.5fr] p-1.5 items-center hover:bg-slate-50 transition-colors">
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
              </div>
            </div>
          </div>
        )}
        {overviewSubTab !== 'amount' && (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 text-sm pb-20">
            <span className="font-bold">{overviewSubTab === 'dividend' ? '股息領用' : 'YYYY'} 規劃中</span>
          </div>
        )}
      </div>
    );
  };

  const renderCompanyOrHighSchool = () => {
    if (!companySchoolData) return null;
    const { chartData, allUsageTypes, tree } = companySchoolData;

    return (
      <div className="flex-1 flex flex-col min-h-0 px-2 space-y-2 pb-20 pt-2">
        <div className="shrink-0 bg-white rounded-lg shadow-sm border border-slate-200 p-2 h-48">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} tickFormatter={(val) => `${val/10000}W`} />
                <Tooltip cursor={{fill: '#f1f5f9'}} contentStyle={{fontSize: '12px', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} formatter={(val: number) => val.toLocaleString()} />
                <Legend wrapperStyle={{fontSize: '10px'}} />
                {allUsageTypes.map((type, idx) => (
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
          <div className="shrink-0 grid grid-cols-[2fr_1.5fr_0.5fr_1.5fr_0.5fr_1.5fr] bg-slate-100 p-1.5 border-b border-slate-200 text-slate-600 font-bold text-center items-center rounded-t-lg">
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
                <div className="grid grid-cols-[2fr_1.5fr_0.5fr_1.5fr_0.5fr_1.5fr] p-1.5 items-center bg-indigo-50/30">
                  <div className="font-bold truncate text-left text-indigo-800 pl-1">{master.name}</div>
                  <div className="text-right text-indigo-600 font-bold">{formatCurrency(master.current)}</div>
                  <div></div>
                  <div className="text-right font-bold text-slate-600">{formatCurrency(master.prev)}</div>
                  <div></div>
                  <div className="text-right font-bold text-slate-700 pr-1">{formatCurrency(master.total)}</div>
                </div>
                {/* Detail Rows */}
                {master.children.map(child => (
                  <div key={child.name} className="grid grid-cols-[2fr_1.5fr_0.5fr_1.5fr_0.5fr_1.5fr] p-1.5 items-center hover:bg-slate-50 transition-colors">
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
          </div>
        </div>
      </div>
    );
  };

  const renderLifeOrVirtual = () => {
    if (!lifeVirtualData) return null;
    const { allUsageTypes, chartData, allExpenseTypes, expenseTypeTotals } = lifeVirtualData;

    return (
      <div className="flex-1 flex flex-col min-h-0 px-2 space-y-2 pb-20 pt-2">
        <div className="shrink-0 flex gap-2 overflow-x-auto no-scrollbar pb-1">
          {allUsageTypes.map(item => (
            <button 
              key={item} 
              onClick={() => setLifeUsageType(item)}
              className={`px-3 py-1 bg-white border rounded-md text-xs font-bold whitespace-nowrap shadow-sm transition-colors ${item === lifeUsageType ? 'border-indigo-500 text-indigo-700 bg-indigo-50' : 'border-slate-200 text-slate-600 hover:border-indigo-300'}`}
            >
              {item}
            </button>
          ))}
        </div>
  
        <div className="shrink-0 bg-white rounded-lg shadow-sm border border-slate-200 p-2 h-48 relative flex flex-col">
          <div className="flex justify-between items-center px-1 mb-1 z-10">
            <button onClick={handlePrevYear} disabled={!availableYears.find(y => y < selectedYear)} className="p-1 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors disabled:opacity-30"><ChevronLeft size={16}/></button>
            <span className="text-xs font-bold text-slate-700">{selectedYear} 年</span>
            <button onClick={handleNextYear} disabled={!availableYears.find(y => y > selectedYear)} className="p-1 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors disabled:opacity-30"><ChevronRight size={16}/></button>
          </div>
          <div className="flex-1 min-h-0 relative">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} tickFormatter={(val) => `${val}月`} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} tickFormatter={(val) => `${val/1000}k`} />
                  <Tooltip cursor={{fill: '#f1f5f9'}} contentStyle={{fontSize: '12px', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} formatter={(val: number) => val.toLocaleString()} />
                  <Legend wrapperStyle={{fontSize: '10px'}} />
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
                <tr className="bg-indigo-50/90 backdrop-blur-sm border-b border-slate-200 text-indigo-800">
                  <th className="p-2 font-bold sticky left-0 bg-indigo-50/90 backdrop-blur-sm border-r border-slate-200 z-40 shadow-[1px_0_0_0_#e2e8f0]">月份</th>
                  {allExpenseTypes.map(type => (
                    <th key={type} className="p-2 font-bold">{type}</th>
                  ))}
                  <th className="p-2 font-bold text-indigo-600">合計</th>
                </tr>
              </thead>
              <tbody className="text-slate-600 divide-y divide-slate-100">
                {Array.from({length: 12}).map((_, i) => {
                  let rowTotal = 0;
                  return (
                    <tr key={i} className="hover:bg-slate-50 transition-colors">
                      <td className="p-2 font-bold bg-slate-50/50 border-r border-slate-200 sticky left-0 z-10 text-slate-700 shadow-[1px_0_0_0_#e2e8f0]">{i + 1}月</td>
                      {allExpenseTypes.map(type => {
                        const amount = expenseTypeTotals.find(e => e.name === type)?.months[i] || 0;
                        rowTotal += amount;
                        return <td key={type} className="p-2">{formatCurrency(amount)}</td>;
                      })}
                      <td className="p-2 font-bold text-indigo-600">{formatCurrency(rowTotal)}</td>
                    </tr>
                  );
                })}
                <tr className="bg-slate-50/50">
                  <td className="p-2 font-bold border-r border-slate-200 sticky left-0 z-10 shadow-[1px_0_0_0_#e2e8f0]">合計</td>
                  {allExpenseTypes.map(type => {
                    const total = expenseTypeTotals.find(e => e.name === type)?.total || 0;
                    return <td key={type} className="p-2 font-bold">{formatCurrency(total)}</td>;
                  })}
                  <td className="p-2 font-bold text-indigo-600">
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
      {activeTab === 'company' && renderCompanyOrHighSchool()}
      {activeTab === 'highschool' && renderCompanyOrHighSchool()}
      {activeTab === 'life' && renderLifeOrVirtual()}
      {activeTab === 'virtual' && renderLifeOrVirtual()}
    </div>
  );
}
