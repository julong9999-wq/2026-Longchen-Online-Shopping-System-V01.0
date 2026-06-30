import { useState, useEffect, useMemo } from 'react';
import Papa from 'papaparse';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Plus } from 'lucide-react';

const CSV_URL_PLEDGE = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSnkojvITxtjSfxyv0D85BEfMv80ANLdGyXGZih5prz6-W_0KfP1Fr5fRFwx8jUGkvEIQjoVa4afbnJ/pub?gid=1021924150&single=true&output=csv';

interface PledgeRecord {
  account: string;
  stockId: string;
  stockName: string;
  lendDate: string;
  returnDate: string;
  shares: number;
  loanAmount: number;
  rate: number;
  interest: number;
}

export default function PledgeView({ activeAccount, refreshKey }: { activeAccount: string, refreshKey: number }) {
  const [activeTab, setActiveTab] = useState<'loan' | 'interest' | 'estimate'>('loan');
  const [pledgeRecords, setPledgeRecords] = useState<PledgeRecord[]>([]);

  useEffect(() => {
    Papa.parse(CSV_URL_PLEDGE, {
      download: true,
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const parsed = results.data.map((row: any) => ({
          account: String(row['證券戶'] || '').trim(),
          stockId: String(row['股號'] || '').trim(),
          stockName: String(row['股名'] || '').trim(),
          lendDate: String(row['貸款日期'] || '').trim(),
          returnDate: String(row['還款日期'] || '').trim(),
          shares: parseFloat(String(row['張數'] || '0').replace(/,/g, '')),
          loanAmount: parseFloat(String(row['貸款金額'] || '0').replace(/,/g, '')),
          rate: parseFloat(String(row['貸款利率'] || '0').replace(/%/g, '')) / 100,
          interest: parseFloat(String(row['貸款利息'] || '0').replace(/,/g, ''))
        })).filter(r => r.stockId && !isNaN(r.loanAmount));
        setPledgeRecords(parsed);
      }
    });
  }, [refreshKey]);

  const filteredRecords = useMemo(() => {
    return activeAccount === 'all' ? pledgeRecords : pledgeRecords.filter(r => r.account === activeAccount);
  }, [pledgeRecords, activeAccount]);

  const monthlyData = useMemo(() => {
    const monthsMap = new Map<string, { month: string, sortKey: string, loan: number, repay: number, interest: number }>();
    
    filteredRecords.forEach(r => {
      // Process lendDate
      if (r.lendDate) {
        const ld = new Date(r.lendDate);
        if (!isNaN(ld.getTime())) {
          const mStr = `${ld.getFullYear()}/${String(ld.getMonth() + 1).padStart(2, '0')}`;
          if (!monthsMap.has(mStr)) monthsMap.set(mStr, { month: mStr, sortKey: mStr, loan: 0, repay: 0, interest: 0 });
          monthsMap.get(mStr)!.loan += r.loanAmount;
        }
      }
      
      // Process returnDate
      if (r.returnDate) {
        const rd = new Date(r.returnDate);
        if (!isNaN(rd.getTime())) {
          const mStr = `${rd.getFullYear()}/${String(rd.getMonth() + 1).padStart(2, '0')}`;
          if (!monthsMap.has(mStr)) monthsMap.set(mStr, { month: mStr, sortKey: mStr, loan: 0, repay: 0, interest: 0 });
          monthsMap.get(mStr)!.repay += r.loanAmount;
          monthsMap.get(mStr)!.interest += r.interest;
        }
      }
    });

    const sortedMonths = Array.from(monthsMap.values()).sort((a, b) => a.sortKey.localeCompare(b.sortKey));
    
    let cumLoan = 0;
    let cumRepay = 0;
    let cumInterest = 0;
    
    const result = sortedMonths.map(m => {
      cumLoan += m.loan;
      cumRepay += m.repay;
      cumInterest += m.interest;
      
      return {
        ...m,
        cumLoan,
        cumRepay,
        cumInterest,
        netLoan: cumLoan - cumRepay
      };
    });
    
    return result;
  }, [filteredRecords]);

  const estimateData = useMemo(() => {
    const activeLoans = filteredRecords.filter(r => r.lendDate && !r.returnDate);
    const today = new Date().getTime();
    
    return activeLoans.map(r => {
      const ld = new Date(r.lendDate).getTime();
      const days = isNaN(ld) ? 1 : Math.max(1, Math.floor((today - ld) / (1000 * 60 * 60 * 24)));
      const estimate = r.loanAmount * r.rate / 365 * days;
      return {
        ...r,
        days,
        estimate
      };
    }).sort((a, b) => b.estimate - a.estimate);
  }, [filteredRecords]);

  const estimateChartData = useMemo(() => {
    const map = new Map<string, number>();
    estimateData.forEach(r => {
      if (!map.has(r.stockName)) map.set(r.stockName, 0);
      map.set(r.stockName, map.get(r.stockName)! + r.estimate);
    });
    return Array.from(map.entries()).map(([name, est]) => ({ name, estimate: est })).sort((a, b) => b.estimate - a.estimate);
  }, [estimateData]);

  const formatCurrency = (val: number) => Math.round(val).toLocaleString();
  const formatRate = (val: number) => (val * 100).toFixed(2) + '%';

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
        <div className="flex gap-1">
          <button 
            onClick={() => setActiveTab('loan')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${activeTab === 'loan' ? 'bg-indigo-100 text-indigo-700' : 'text-slate-500 hover:bg-slate-100'}`}
          >貸款</button>
          <button 
            onClick={() => setActiveTab('interest')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${activeTab === 'interest' ? 'bg-indigo-100 text-indigo-700' : 'text-slate-500 hover:bg-slate-100'}`}
          >利息</button>
          <button 
            onClick={() => setActiveTab('estimate')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${activeTab === 'estimate' ? 'bg-indigo-100 text-indigo-700' : 'text-slate-500 hover:bg-slate-100'}`}
          >預估</button>
        </div>
        <a href="https://docs.google.com/forms/d/1X-s9lS79bF4C3_2o-Yt2E_n7Q4sM1X8rE-c3gZkO9fQ/viewform" target="_blank" rel="noreferrer" className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 transition-colors">
          <Plus size={14} /> 新增
        </a>
      </div>
      
      <div className="flex-1 overflow-y-auto px-1 pt-1 pb-20 flex flex-col space-y-1">
        {activeTab === 'loan' && (
          <>
            <div className="shrink-0 bg-white rounded-lg shadow-sm border border-slate-200 p-1.5 h-52">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} tickFormatter={(val) => `${val/10000}W`} />
                  <Tooltip cursor={{fill: '#f1f5f9'}} contentStyle={{fontSize: '12px', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} formatter={(val: number) => val.toLocaleString()} />
                  <Legend verticalAlign="top" align="right" content={renderCustomLegend} />
                  <Bar dataKey="netLoan" name="貸款總額" stackId="a" fill="#bae6fd" />
                  <Bar dataKey="cumRepay" name="還款金額" stackId="a" fill="#e2e8f0" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            
            <div className="flex-1 bg-white rounded-lg shadow-sm border border-slate-200 flex flex-col min-h-0">
              <div className="flex-1 overflow-auto no-scrollbar">
                <table className="w-full text-[10px] text-center whitespace-nowrap">
                  <thead className="sticky top-0 z-30">
                    <tr className="bg-indigo-50/90 backdrop-blur-sm border-b border-slate-200 text-indigo-800">
                      <th className="p-1.5 font-bold sticky left-0 bg-indigo-50/90 backdrop-blur-sm border-r border-slate-200 z-40 text-center">年月</th>
                      <th className="p-1.5 font-bold text-right pr-4">貸款金額</th>
                      <th className="p-1.5 font-bold text-right pr-4">還款金額</th>
                      <th className="p-1.5 font-bold text-indigo-600 text-right pr-4">貸款總額</th>
                    </tr>
                  </thead>
                  <tbody className="text-slate-600 divide-y divide-slate-100">
                    {[...monthlyData].reverse().map(d => (
                      <tr key={d.month} className="hover:bg-slate-50 transition-colors">
                        <td className="p-1.5 font-bold bg-slate-50/50 border-r border-slate-200 sticky left-0 z-10 text-center">{d.month}</td>
                        <td className="p-1.5 text-right pr-4">{formatCurrency(d.loan)}</td>
                        <td className="p-1.5 text-right pr-4">{formatCurrency(d.repay)}</td>
                        <td className="p-1.5 font-bold text-indigo-600 text-right pr-4">{formatCurrency(d.netLoan)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {activeTab === 'interest' && (
          <>
            <div className="shrink-0 bg-white rounded-lg shadow-sm border border-slate-200 p-1.5 h-52">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} tickFormatter={(val) => `${val/1000}k`} />
                  <Tooltip cursor={{fill: '#f1f5f9'}} contentStyle={{fontSize: '12px', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} formatter={(val: number) => val.toLocaleString()} />
                  <Legend verticalAlign="top" align="right" content={renderCustomLegend} />
                  <Bar dataKey="cumInterest" name="貸款利息" stackId="a" fill="#fecaca" />
                  <Bar dataKey="cumRepay" name="還款金額" stackId="a" fill="#e2e8f0" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            
            <div className="flex-1 bg-white rounded-lg shadow-sm border border-slate-200 flex flex-col min-h-0">
              <div className="flex-1 overflow-auto no-scrollbar">
                <table className="w-full text-[10px] text-center whitespace-nowrap">
                  <thead className="sticky top-0 z-30">
                    <tr className="bg-indigo-50/90 backdrop-blur-sm border-b border-slate-200 text-indigo-800">
                      <th className="p-1.5 font-bold sticky left-0 bg-indigo-50/90 backdrop-blur-sm border-r border-slate-200 z-40 text-center">年月</th>
                      <th className="p-1.5 font-bold text-right pr-4">貸款金額</th>
                      <th className="p-1.5 font-bold text-right pr-4">還款利息</th>
                      <th className="p-1.5 font-bold text-indigo-600 text-right pr-4">貸款利息</th>
                    </tr>
                  </thead>
                  <tbody className="text-slate-600 divide-y divide-slate-100">
                    {[...monthlyData].reverse().map(d => (
                      <tr key={d.month} className="hover:bg-slate-50 transition-colors">
                        <td className="p-1.5 font-bold bg-slate-50/50 border-r border-slate-200 sticky left-0 z-10 text-center">{d.month}</td>
                        <td className="p-1.5 text-right pr-4">{formatCurrency(d.loan)}</td>
                        <td className="p-1.5 text-right pr-4">{formatCurrency(d.interest)}</td>
                        <td className="p-1.5 font-bold text-indigo-600 text-right pr-4">{formatCurrency(d.cumInterest)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {activeTab === 'estimate' && (
          <>
            <div className="shrink-0 bg-white rounded-lg shadow-sm border border-slate-200 p-1.5 h-52">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={estimateChartData.slice(0, 15)} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} tickFormatter={(val) => `${val}`} />
                  <Tooltip cursor={{fill: '#f1f5f9'}} contentStyle={{fontSize: '12px', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} formatter={(val: number) => val.toLocaleString()} />
                  <Bar dataKey="estimate" name="預估利息" fill="#6366f1" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            
            <div className="flex-1 bg-white rounded-lg shadow-sm border border-slate-200 flex flex-col min-h-0">
              <div className="flex-1 overflow-auto no-scrollbar">
                <table className="w-full text-[10px] text-center whitespace-nowrap">
                  <thead className="sticky top-0 z-30">
                    <tr className="bg-indigo-50/90 backdrop-blur-sm border-b border-slate-200 text-indigo-800">
                      <th className="p-1.5 font-bold sticky left-0 bg-indigo-50/90 backdrop-blur-sm border-r border-slate-200 z-40 text-center">股名</th>
                      <th className="p-1.5 font-bold text-right pr-4">張數</th>
                      <th className="p-1.5 font-bold text-right pr-4">貸款金額</th>
                      <th className="p-1.5 font-bold text-right pr-4">貸款利率</th>
                      <th className="p-1.5 font-bold text-indigo-600 text-right pr-4">預估金額</th>
                    </tr>
                  </thead>
                  <tbody className="text-slate-600 divide-y divide-slate-100">
                    {estimateData.map((d, i) => (
                      <tr key={i} className="hover:bg-slate-50 transition-colors">
                        <td className="p-1.5 font-bold bg-slate-50/50 border-r border-slate-200 sticky left-0 z-10 text-center">{d.stockName}</td>
                        <td className="p-1.5 text-right pr-4">{d.shares}</td>
                        <td className="p-1.5 text-right pr-4">{formatCurrency(d.loanAmount)}</td>
                        <td className="p-1.5 text-right pr-4">{formatRate(d.rate)}</td>
                        <td className="p-1.5 font-bold text-indigo-600 text-right pr-4">{formatCurrency(d.estimate)}</td>
                      </tr>
                    ))}
                    {estimateData.length > 0 && (
                      <tr className="bg-slate-50/50">
                        <td colSpan={2} className="p-1.5 font-bold text-right border-r border-slate-200 sticky left-0 z-10 pr-4">合計</td>
                        <td className="p-1.5 font-bold text-right pr-4">{formatCurrency(estimateData.reduce((s, d) => s + d.loanAmount, 0))}</td>
                        <td className="p-1.5"></td>
                        <td className="p-1.5 font-bold text-indigo-600 text-right pr-4">{formatCurrency(estimateData.reduce((s, d) => s + d.estimate, 0))}</td>
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
