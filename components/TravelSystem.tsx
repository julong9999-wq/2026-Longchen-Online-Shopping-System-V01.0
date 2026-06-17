import React, { useState, useEffect, useMemo } from 'react';
import { 
   
   
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  Home, 
  List, 
  X,
  ChevronDown,
  ChevronUp,
  
  Utensils,
  Bed,
  Car,
  Ticket,
  ShoppingBag,
  MoreHorizontal,
  FileText,
  AlertCircle,
  PieChart as PieChartIcon,
  BarChart as BarChartIcon
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TripSlogan, TripExpense } from '../types';
import { db } from '../firebase';
import { 
  collection, 
  onSnapshot, 
  doc, 
  setDoc, 
  deleteDoc, 
  
} from 'firebase/firestore';
import { formatCurrency, generateUUID } from '../utils';

interface TravelSystemProps {
  onNavigateHome: () => void;
}

const CATEGORIES = ['餐飲', '住宿', '交通', '門票', '購物', '其他'] as const;
const PAYERS = ['俊龍', '美慧', '禹君', '禹辰'] as const;
const CURRENCIES = ['TWD', 'JPY', 'USD', 'KRW', 'EUR', 'CNY'] as const;

type AppView = 'detail' | 'record' | 'analysis';

const getCategoryIcon = (category: string) => {
    switch (category) {
        case '餐飲': return <Utensils size={28} className="text-orange-500" />;
        case '住宿': return <Bed size={28} className="text-blue-500" />;
        case '交通': return <Car size={28} className="text-emerald-500" />;
        case '門票': return <Ticket size={28} className="text-rose-500" />;
        case '購物': return <ShoppingBag size={28} className="text-fuchsia-500" />;
        case '其他': return <MoreHorizontal size={28} className="text-slate-500" />;
        default: return <FileText size={28} className="text-slate-400" />;
    }
};

const TravelSystem: React.FC<TravelSystemProps> = ({ onNavigateHome }) => {
  const [view, setView] = useState<AppView>('record');
  
  const [trips, setTrips] = useState<TripSlogan[]>([]);
  const [expenses, setExpenses] = useState<TripExpense[]>([]);
  const [activeTripId, setActiveTripId] = useState<string>('');

  const [showTripModal, setShowTripModal] = useState(false);
  const [tripForm, setTripForm] = useState<Partial<TripSlogan>>({});
  
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [expenseForm, setExpenseForm] = useState<Partial<TripExpense>>({
      currency: 'TWD',
      category: '餐飲',
      payer: '俊龍'
  });

  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [deleteTripConfirm, setDeleteTripConfirm] = useState<string | null>(null);
  const [expandedDetails, setExpandedDetails] = useState<Record<string, boolean>>({});
  const [isSavingExp, setIsSavingExp] = useState(false);

  // Firestore Subscriptions
  useEffect(() => {
    const unsubTrips = onSnapshot(collection(db, 'trip_slogans'), (snap) => {
        const data: TripSlogan[] = [];
        snap.forEach(doc => data.push(doc.data() as TripSlogan));
        data.sort((a,b) => b.startDate.localeCompare(a.startDate));
        setTrips(data);
        if (data.length > 0) {
            setActiveTripId(prev => {
                if (prev && data.some(t => t.id === prev)) return prev;
                return data[0].id;
            });
        } else {
            setActiveTripId('');
        }
    });

    const unsubExpenses = onSnapshot(collection(db, 'trip_expenses'), (snap) => {
        const data: TripExpense[] = [];
        snap.forEach(doc => data.push(doc.data() as TripExpense));
        data.sort((a,b) => b.createdAt - a.createdAt);
        setExpenses(data);
    });

    return () => {
        unsubTrips();
        unsubExpenses();
    };
  }, []);

  const activeTrip = useMemo(() => trips.find(t => t.id === activeTripId) || null, [trips, activeTripId]);
  
  const activeExpenses = useMemo(() => {
      if (!activeTripId) return [];
      return expenses.filter(e => e.tripId === activeTripId).sort((a,b) => {
          if (a.date === b.date) return b.createdAt - a.createdAt;
          return a.date.localeCompare(b.date); // Sort by date ascending for grouping
      });
  }, [expenses, activeTripId]);

  // Aggregate by day
  const groupedExpenses = useMemo(() => {
      const map = new Map<string, TripExpense[]>();
      activeExpenses.forEach(e => {
          if (!map.has(e.date)) map.set(e.date, []);
          map.get(e.date)!.push(e);
      });
      // Sort dates ascending
      return Array.from(map.entries()).sort((a,b) => a[0].localeCompare(b[0]));
  }, [activeExpenses]);

  // Totals grouping
  const summaryByCurrency = useMemo(() => {
      const map = new Map<string, number>();
      activeExpenses.forEach(e => {
          const val = Number(e.amount) || 0;
          if (!map.has(e.currency)) map.set(e.currency, 0);
          map.set(e.currency, map.get(e.currency)! + val);
      });
      return Array.from(map.entries()).sort((a,b) => a[0].localeCompare(b[0]));
  }, [activeExpenses]);


  const handleDeleteTrip = async (id: string) => {
      const hasExps = expenses.some(e => e.tripId === id);
      if (!hasExps) {
          await deleteDoc(doc(db, 'trip_slogans', id));
          setDeleteTripConfirm(null);
      }
  };

  const handleSaveTrip = async () => {
      if (!tripForm.startDate || !tripForm.days || !tripForm.location) return;
      
      const newTripId = tripForm.id || generateUUID();
      let slgStr = '';
      if (tripForm.remarks) {
          // If days > 1, show range: "2026-06-12", length 2 -> "20260612-13"
          let dStr = tripForm.startDate.replace(/-/g, '');
          if (tripForm.days > 1) {
              const parts = tripForm.startDate.split('-');
              const y = parseInt(parts[0], 10);
              const m = parseInt(parts[1], 10) - 1;
              const dt = parseInt(parts[2], 10);
              const d = new Date(y, m, dt);
              d.setDate(d.getDate() + Number(tripForm.days) - 1);
              const endDay = String(d.getDate()).padStart(2, '0');
              dStr += `-${endDay}`;
          }
          slgStr = `${dStr} ${tripForm.location}${tripForm.days}日之${tripForm.remarks}`;
      } else {
           let dStr = tripForm.startDate.replace(/-/g, '');
           slgStr = `${dStr} ${tripForm.location}${tripForm.days}日`;
      }

      const tripObj: TripSlogan = {
          id: newTripId,
          startDate: tripForm.startDate,
          days: Number(tripForm.days) || 1,
          location: tripForm.location,
          remarks: tripForm.remarks || '',
          sloganString: slgStr,
          createdAt: tripForm.createdAt || Date.now()
      };

      try {
          await setDoc(doc(db, 'trip_slogans', newTripId), tripObj);
          setActiveTripId(newTripId);
          setShowTripModal(false);
          setTripForm({});
      } catch (e) {
          console.error("error saving trip", e);
      }
  };

  const handleSaveExpense = async () => {
      if (!expenseForm.date || !expenseForm.category || !expenseForm.amount || !expenseForm.location || !activeTripId) return;
      if (isSavingExp) return;

      setIsSavingExp(true);
      const newId = expenseForm.id || generateUUID();
      const expObj: TripExpense = {
          id: newId,
          tripId: activeTripId,
          date: expenseForm.date,
          category: expenseForm.category as any,
          description: expenseForm.description || '',
          currency: expenseForm.currency || 'TWD',
          amount: Number(expenseForm.amount) || 0,
          location: expenseForm.location,
          payer: expenseForm.payer || '俊龍',
          createdAt: expenseForm.createdAt || Date.now()
      };

      try {
          await setDoc(doc(db, 'trip_expenses', newId), expObj);
          setShowExpenseModal(false);
          setExpenseForm({ currency: 'TWD', category: '餐飲', payer: '俊龍' });
      } catch (e) {
          console.error("error saving expense", e);
      } finally {
          setIsSavingExp(false);
      }
  };

  const handleDeleteExpense = async (id: string) => {
      try {
          await deleteDoc(doc(db, 'trip_expenses', id));
          setDeleteConfirm(null);
      } catch (e) {
          console.error("error deleting expense", e);
      }
  };

  // Nav Renderer
  const renderNav = () => (
      <div className="bg-purple-600 flex shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] overflow-x-auto shrink-0 z-50 text-purple-100">
        <button
            onClick={() => setView('detail')}
            className={`flex-1 flex flex-col items-center justify-center py-3 transition-opacity ${view === 'detail' ? 'text-white bg-purple-700' : 'hover:text-white hover:bg-purple-700/50'}`}
        >
            <List size={22} className="mb-1" />
            <span className="text-xs font-bold tracking-wide">明細</span>
        </button>
        <button
            onClick={() => setView('record')}
            className={`flex-1 flex flex-col items-center justify-center py-3 transition-opacity ${view === 'record' ? 'text-white bg-purple-700' : 'hover:text-white hover:bg-purple-700/50'}`}
        >
            <FileText size={22} className="mb-1" />
            <span className="text-xs font-bold tracking-wide">紀錄</span>
        </button>
        <button
            onClick={() => setView('analysis')}
            className={`flex-1 flex flex-col items-center justify-center py-3 transition-opacity ${view === 'analysis' ? 'text-white bg-purple-700' : 'hover:text-white hover:bg-purple-700/50'}`}
        >
            <PieChartIcon size={22} className="mb-1" />
            <span className="text-xs font-bold tracking-wide">分析</span>
        </button>
        <button 
            onClick={onNavigateHome}
            className="flex-1 flex flex-col items-center justify-center py-3 transition-opacity hover:text-white hover:bg-purple-700/50"
        >
            <Home size={22} className="mb-1" />
            <span className="text-xs font-bold tracking-wide">返回</span>
        </button>
      </div>
  );

  return (
      <div className="flex flex-col h-screen bg-slate-50 font-sans text-slate-800">
          
          <div className="flex-1 overflow-y-auto">
             {view === 'record' && (
                 <div className="flex flex-col h-full bg-slate-50">
                    {/* Top Area: Slogan Selector */}
                    <div className="bg-purple-600 text-white p-3 shadow shrink-0 flex items-center gap-2">
                        <select 
                           value={activeTripId} 
                           onChange={(e) => setActiveTripId(e.target.value)}
                           className="flex-1 min-w-0 bg-purple-700 border border-purple-500 rounded-lg px-2 py-2 text-sm font-bold shadow-sm outline-none cursor-pointer appearance-none truncate"
                        >
                           {trips.length === 0 && <option value="">無標語，請新增</option>}
                           {trips.map(t => (
                               <option key={t.id} value={t.id}>{t.location} {t.remarks}</option>
                           ))}
                        </select>
                        <button 
                            onClick={() => {
                                if (activeTrip) {
                                    setTripForm(activeTrip);
                                } else {
                                    setTripForm({ startDate: new Date().toISOString().split('T')[0], days: 1 });
                                }
                                setShowTripModal(true);
                            }} 
                            className="w-8 h-8 shrink-0 flex items-center justify-center bg-purple-500 hover:bg-purple-400 rounded-full transition-colors shadow-sm ml-1"
                        >
                            <Edit size={16} />
                        </button>
                    </div>

                    {/* Secondary Area: Totals */}
                    {summaryByCurrency.length > 0 && (
                        <div className="px-1 pt-1 shrink-0 flex flex-wrap gap-1">
                             {summaryByCurrency.map(([curr, sum]) => (
                                 <div key={curr} className="flex-1 min-w-[120px] bg-purple-100 rounded-lg shadow-sm border border-purple-200 overflow-hidden flex items-center px-2 py-1.5 gap-2">
                                     <span className="font-bold text-purple-800 text-xs shrink-0">合計</span>
                                     <span className="text-sm font-bold text-purple-600 shrink-0">{curr}</span>
                                     <span className="text-base font-mono font-bold text-purple-900 flex-1 min-w-0 truncate text-right">{formatCurrency(sum)}</span>
                                 </div>
                             ))}
                        </div>
                    )}

                    {/* Third Area: Daily Timeline */}
                    <div className="flex-1 overflow-y-auto p-1 pb-16">
                        {groupedExpenses.length === 0 ? (
                            <div className="text-center py-10 text-slate-400 font-bold text-sm">
                                {activeTripId ? '尚無記帳明細，請點擊 + 新增' : '請先新增旅遊標語'}
                            </div>
                        ) : (
                            groupedExpenses.map(([date, exps]) => (
                                <div key={date} className="mb-2 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                                     <div className="bg-slate-100 px-2 py-1.5 flex justify-between items-center border-b border-slate-200">
                                         <div className="flex items-center gap-2 flex-wrap">
                                             <span className="font-bold text-slate-700 text-sm">{date}</span>
                                             <span className="text-xs font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded border border-purple-100">
                                                 {Object.entries(exps.reduce((acc, exp) => { acc[exp.currency] = (acc[exp.currency] || 0) + exp.amount; return acc; }, {} as Record<string, number>)).map(([c, a]) => `${c} ${formatCurrency(a)}`).join(', ')}
                                             </span>
                                         </div>
                                         <button 
                                            onClick={() => {
                                                setExpenseForm({ 
                                                    date, 
                                                    category: '餐飲', 
                                                    currency: 'TWD', 
                                                    payer: '俊龍' 
                                                });
                                                setShowExpenseModal(true);
                                            }}
                                            className="bg-purple-100 text-purple-700 p-1 rounded-lg hover:bg-purple-200 transition-colors shadow-sm"
                                         >
                                             <Plus size={16} />
                                         </button>
                                     </div>
                                     <div className="divide-y divide-slate-100">
                                         {exps.map(exp => (
                                             <div key={exp.id} className="p-2 flex gap-2 items-center">
                                                 <div className="w-10 h-10 shrink-0 bg-slate-50 rounded-full flex items-center justify-center border border-slate-100">
                                                     {getCategoryIcon(exp.category)}
                                                 </div>
                                                 <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                                                     <div className="flex justify-between items-center text-sm font-bold">
                                                         <span className="text-slate-800 truncate pr-2">{exp.location}</span>
                                                         <span className="font-mono text-purple-700 text-sm shrink-0">{exp.currency} {formatCurrency(exp.amount)}</span>
                                                     </div>
                                                     <div className="flex justify-between items-center text-[11px] text-slate-500 font-medium">
                                                         <div className="flex gap-1.5 items-center truncate">
                                                            <span className="bg-slate-100 px-1 py-0.5 rounded text-slate-600 shrink-0 leading-none">{exp.payer}</span>
                                                            <span className="truncate">{exp.description}</span>
                                                         </div>
                                                         <div className="flex gap-1 shrink-0 ml-2">
                                                             <button 
                                                                onClick={() => { setExpenseForm(exp); setShowExpenseModal(true); }}
                                                                className="text-slate-400 hover:text-purple-600 transition-colors bg-slate-50 p-1 rounded-md border border-slate-100"
                                                             >
                                                                 <Edit size={12} />
                                                             </button>
                                                             <button 
                                                                onClick={() => setDeleteConfirm(exp.id)}
                                                                className="text-slate-400 hover:text-rose-600 transition-colors bg-slate-50 p-1 rounded-md border border-slate-100"
                                                             >
                                                                 <Trash2 size={12} />
                                                             </button>
                                                         </div>
                                                     </div>
                                                 </div>
                                             </div>
                                         ))}
                                     </div>
                                </div>
                            ))
                        )}
                        
                        {/* Global Add Button for active trip if nothing is there yet, or just an extra one at bottom */}
                        {activeTripId && (
                            <button 
                                onClick={() => {
                                    setExpenseForm({ 
                                        date: activeTrip?.startDate || new Date().toISOString().split('T')[0], 
                                        category: '餐飲', 
                                        currency: 'TWD', 
                                        payer: '俊龍' 
                                    });
                                    setShowExpenseModal(true);
                                }}
                                className="w-full mt-2 bg-white border border-dashed border-slate-300 text-slate-500 font-bold py-3 rounded-xl hover:bg-slate-50 transition-colors flex items-center justify-center gap-2"
                            >
                                <Plus size={18} /> 新增本標語記帳紀錄
                            </button>
                        )}
                    </div>

                 </div>
             )}
             
             {view === 'detail' && (
                 <div className="flex flex-col h-full bg-slate-50 p-2 md:p-4">
                     <div className="flex justify-between items-center mb-2">
                         <h2 className="text-xl font-bold text-slate-800">全部花費明細</h2>
                         <div className="bg-purple-100 text-purple-900 px-3 py-1 rounded-lg font-bold border border-purple-200">
                             合計: {formatCurrency(expenses.reduce((sum, e) => sum + e.amount, 0))}
                         </div>
                     </div>
                     <div className="flex-1 overflow-y-auto">
                         {trips.length === 0 && expenses.length === 0 ? (
                             <div className="text-center py-10 text-slate-400 bg-white rounded-xl shadow-sm border border-slate-200">目前無任何記帳紀錄</div>
                         ) : (
                             <div className="flex flex-col gap-2 pb-6">
                                 {trips.map(trip => {
                                     const tripExpenses = expenses.filter(e => e.tripId === trip.id);
                                     if(tripExpenses.length === 0) return null;
                                     const tripTotal = tripExpenses.reduce((sum, e) => sum + e.amount, 0);
                                     const isExpanded = expandedDetails[trip.id!] || false;
                                     
                                     return (
                                         <div key={trip.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                                             <div 
                                                 className="p-2 sm:p-3 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors gap-2"
                                                 onClick={() => setExpandedDetails(prev => ({...prev, [trip.id!]: !prev[trip.id!]}))}
                                             >
                                                 <div className="flex-1 min-w-0">
                                                     <h3 className="font-bold text-slate-800 text-base md:text-lg truncate">
                                                         {trip.location}
                                                         <span className="text-[10px] sm:text-xs text-slate-500 font-normal ml-2">{trip.startDate} ({trip.days}天)</span>
                                                     </h3>
                                                     {trip.remarks && <div className="text-[11px] sm:text-sm text-slate-500 mt-0.5 truncate">{trip.remarks}</div>}
                                                 </div>
                                                 <div className="flex items-center gap-2 sm:gap-4 shrink-0">
                                                     <div className="text-right">
                                                         <div className="text-[10px] text-slate-500 mb-0.5 leading-none">小計</div>
                                                         <div className="font-bold text-purple-700 leading-tight">{formatCurrency(tripTotal)}</div>
                                                     </div>
                                                     <div className="text-slate-400">
                                                         {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                                                     </div>
                                                 </div>
                                             </div>
                                             {isExpanded && (
                                                 <div className="border-t border-slate-100 bg-slate-50 p-1">
                                                     <table className="w-full text-sm text-left table-fixed">
                                                         <thead className="text-slate-500 border-b border-slate-200">
                                                             <tr>
                                                                 <th className="px-1 py-1 font-bold w-[70px] sm:w-20 text-[11px] sm:text-sm">日期</th>
                                                                 <th className="px-1 py-1 font-bold text-[11px] sm:text-sm">項目</th>
                                                                 <th className="px-1 py-1 font-bold text-right w-24 sm:w-28 text-[11px] sm:text-sm">金額</th>
                                                             </tr>
                                                         </thead>
                                                         <tbody className="divide-y divide-slate-100">
                                                             {[...tripExpenses].sort((a,b) => {
                                                                 if (a.date === b.date) return b.createdAt - a.createdAt;
                                                                 return b.date.localeCompare(a.date);
                                                             }).map(exp => (
                                                                 <tr key={exp.id} className="hover:bg-purple-100 transition-colors bg-purple-50">
                                                                     <td className="px-1 py-1 font-mono text-slate-500 text-[10px] sm:text-xs whitespace-nowrap overflow-hidden">
                                                                         {exp.date}
                                                                         <div className="text-purple-500 font-bold mt-px">{exp.category}</div>
                                                                     </td>
                                                                     <td className="px-1 py-1 overflow-hidden">
                                                                         <div className="font-bold text-slate-800 text-[11px] sm:text-sm truncate">{exp.location}</div>
                                                                         {exp.description && <div className="text-[10px] text-slate-500 truncate">{exp.description}</div>}
                                                                     </td>
                                                                     <td className="px-1 py-1 text-right whitespace-nowrap overflow-hidden">
                                                                         <div className="font-bold text-slate-700 text-xs sm:text-sm"><span className="text-[9px] sm:text-[10px] text-slate-400 font-normal mr-0.5">{exp.currency}</span>{formatCurrency(exp.amount)}</div>
                                                                         <div className="text-[10px] text-slate-400 mt-px truncate">{exp.payer}</div>
                                                                     </td>
                                                                 </tr>
                                                             ))}
                                                         </tbody>
                                                     </table>
                                                 </div>
                                             )}
                                         </div>
                                     );
                                 })}

                                 {/* Orphaned Expenses */}
                                 {(() => {
                                     const orphanExpenses = expenses.filter(e => !trips.find(t => t.id === e.tripId));
                                     if(orphanExpenses.length === 0) return null;
                                     const orphanTotal = orphanExpenses.reduce((sum, e) => sum + e.amount, 0);
                                     const isExpanded = expandedDetails['orphan'] || false;
                                     return (
                                         <div key="orphan" className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                                             <div 
                                                 className="p-2 sm:p-3 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors gap-2"
                                                 onClick={() => setExpandedDetails(prev => ({...prev, orphan: !prev.orphan}))}
                                             >
                                                 <div className="flex-1 min-w-0">
                                                     <h3 className="font-bold text-slate-800 text-base md:text-lg truncate">未知標語</h3>
                                                     <div className="text-[11px] sm:text-sm text-slate-500 mt-0.5 truncate">已刪除的旅遊或異常資料</div>
                                                 </div>
                                                 <div className="flex items-center gap-2 sm:gap-4 shrink-0">
                                                     <div className="text-right">
                                                         <div className="text-[10px] text-slate-500 mb-0.5 leading-none">小計</div>
                                                         <div className="font-bold text-purple-700 leading-tight">{formatCurrency(orphanTotal)}</div>
                                                     </div>
                                                     <div className="text-slate-400">
                                                         {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                                                     </div>
                                                 </div>
                                             </div>
                                             {isExpanded && (
                                                 <div className="border-t border-slate-100 bg-slate-50 p-1">
                                                     <table className="w-full text-sm text-left table-fixed">
                                                         <thead className="text-slate-500 border-b border-slate-200">
                                                             <tr>
                                                                 <th className="px-1 py-1 font-bold w-[70px] sm:w-20 text-[11px] sm:text-sm">日期</th>
                                                                 <th className="px-1 py-1 font-bold text-[11px] sm:text-sm">項目</th>
                                                                 <th className="px-1 py-1 font-bold text-right w-24 sm:w-28 text-[11px] sm:text-sm">金額</th>
                                                             </tr>
                                                         </thead>
                                                         <tbody className="divide-y divide-slate-100">
                                                             {[...orphanExpenses].sort((a,b) => {
                                                                 if (a.date === b.date) return b.createdAt - a.createdAt;
                                                                 return b.date.localeCompare(a.date);
                                                             }).map(exp => (
                                                                 <tr key={exp.id} className="hover:bg-purple-100 transition-colors bg-purple-50">
                                                                     <td className="px-1 py-1 font-mono text-slate-500 text-[10px] sm:text-xs whitespace-nowrap overflow-hidden">
                                                                         {exp.date}
                                                                         <div className="text-purple-500 font-bold mt-px">{exp.category}</div>
                                                                     </td>
                                                                     <td className="px-1 py-1 overflow-hidden">
                                                                         <div className="font-bold text-slate-800 text-[11px] sm:text-sm truncate">{exp.location}</div>
                                                                         {exp.description && <div className="text-[10px] text-slate-500 truncate">{exp.description}</div>}
                                                                     </td>
                                                                     <td className="px-1 py-1 text-right whitespace-nowrap overflow-hidden">
                                                                         <div className="font-bold text-slate-700 text-xs sm:text-sm"><span className="text-[9px] sm:text-[10px] text-slate-400 font-normal mr-0.5">{exp.currency}</span>{formatCurrency(exp.amount)}</div>
                                                                         <div className="text-[10px] text-slate-400 mt-px truncate">{exp.payer}</div>
                                                                     </td>
                                                                 </tr>
                                                             ))}
                                                         </tbody>
                                                     </table>
                                                 </div>
                                             )}
                                         </div>
                                     );
                                 })()}
                             </div>
                         )}
                     </div>
                 </div>
             )}
             
             {view === 'analysis' && (() => {
                 const catData = Object.entries(expenses.reduce((acc, exp) => {
                     acc[exp.category] = (acc[exp.category] || 0) + exp.amount;
                     return acc;
                 }, {} as Record<string, number>)).sort((a,b)=>b[1]-a[1]).map(([name, value]) => ({name, value}));

                 const ymData = Object.entries(expenses.reduce((acc, exp) => {
                     const ym = exp.date.substring(0, 7);
                     acc[ym] = (acc[ym] || 0) + exp.amount;
                     return acc;
                 }, {} as Record<string, number>)).sort((a,b)=>a[0].localeCompare(b[0])).map(([name, value]) => ({name, value}));
                 
                 const payerData = Object.entries(expenses.reduce((acc, exp) => {
                     acc[exp.payer] = (acc[exp.payer] || 0) + exp.amount;
                     return acc;
                 }, {} as Record<string, number>)).sort((a,b)=>b[1]-a[1]).map(([name, value]) => ({name, value}));

                 const colors = ['#f97316', '#3b82f6', '#10b981', '#f43f5e', '#ec4899', '#6366f1'];

                 return (
                 <div className="flex flex-col h-full bg-slate-50 p-2">
                     <h2 className="text-lg font-bold text-slate-800 mb-2">全部花費分析</h2>
                     <div className="flex-1 overflow-y-auto">
                         {expenses.length === 0 ? (
                             <div className="text-center py-10 text-slate-400 bg-white rounded-xl shadow-sm border border-slate-200">目前無任何記帳紀錄</div>
                         ) : (
                             <div className="flex flex-col gap-3 pb-6">
                                 {/* 年月金額 Table & Bar Chart */}
                                 <div className="bg-white p-2 rounded-xl shadow-sm border border-slate-200">
                                     <h3 className="font-bold text-slate-700 mb-2 flex items-center gap-2">
                                         <BarChartIcon size={16} className="text-purple-600" /> 年月金額
                                     </h3>
                                     <div className="h-40 mb-2 border border-slate-100 rounded bg-slate-50 p-1">
                                         <ResponsiveContainer width="100%" height="100%">
                                             <BarChart data={ymData}>
                                                 <XAxis dataKey="name" fontSize={10} tickMargin={5} />
                                                 <YAxis fontSize={10} width={40} />
                                                 <Tooltip formatter={(value) => formatCurrency(value as number)} />
                                                 <Bar dataKey="value" fill="#8b5cf6" radius={[4,4,0,0]} />
                                             </BarChart>
                                         </ResponsiveContainer>
                                     </div>
                                     <div className="border border-slate-100 rounded overflow-hidden">
                                         <table className="w-full text-sm text-left">
                                             <thead className="bg-slate-50 text-slate-500 border-b border-slate-100"><tr><th className="p-1.5 px-2 font-bold">年月</th><th className="p-1.5 px-2 text-right font-bold">金額</th></tr></thead>
                                             <tbody className="divide-y divide-slate-100">
                                                 {ymData.map((d) => (
                                                     <tr key={d.name} className="hover:bg-slate-50"><td className="p-1 px-2 text-slate-600 font-mono">{d.name}</td><td className="p-1 px-2 text-right font-bold text-slate-800">{formatCurrency(d.value)}</td></tr>
                                                 ))}
                                             </tbody>
                                         </table>
                                     </div>
                                 </div>

                                 {/* 分類金額 Pie Chart & Table */}
                                 <div className="bg-white p-2 rounded-xl shadow-sm border border-slate-200">
                                     <h3 className="font-bold text-slate-700 mb-2 flex items-center gap-2">
                                         <PieChartIcon size={16} className="text-orange-500" /> 分類金額
                                     </h3>
                                     <div className="h-40 mb-2 border border-slate-100 rounded bg-slate-50 p-1">
                                         <ResponsiveContainer width="100%" height="100%">
                                             <PieChart>
                                                 <Pie data={catData} cx="50%" cy="50%" innerRadius={40} outerRadius={70} dataKey="value" stroke="none">
                                                     {catData.map((_, index) => (
                                                         <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                                                     ))}
                                                 </Pie>
                                                 <Tooltip formatter={(value) => formatCurrency(value as number)} />
                                             </PieChart>
                                         </ResponsiveContainer>
                                     </div>
                                     <div className="border border-slate-100 rounded overflow-hidden">
                                         <table className="w-full text-sm text-left">
                                             <thead className="bg-slate-50 text-slate-500 border-b border-slate-100"><tr><th className="p-1.5 px-2 font-bold">分類</th><th className="p-1.5 px-2 text-right font-bold">金額</th></tr></thead>
                                             <tbody className="divide-y divide-slate-100">
                                                 {catData.map((d, idx) => (
                                                     <tr key={d.name} className="hover:bg-slate-50"><td className="p-1 px-2 text-slate-600"><span className="inline-block w-2.5 h-2.5 rounded-full mr-2" style={{backgroundColor: colors[idx % colors.length]}}></span>{d.name}</td><td className="p-1 px-2 text-right font-bold text-slate-800">{formatCurrency(d.value)}</td></tr>
                                                 ))}
                                             </tbody>
                                         </table>
                                     </div>
                                 </div>

                                 {/* 付款人金額 Table & Bar Chart */}
                                 <div className="bg-white p-2 rounded-xl shadow-sm border border-slate-200">
                                     <h3 className="font-bold text-slate-700 mb-2 flex items-center gap-2">
                                         <BarChartIcon size={16} className="text-emerald-500" /> 付款人金額
                                     </h3>
                                      <div className="h-40 mb-2 border border-slate-100 rounded bg-slate-50 p-1">
                                         <ResponsiveContainer width="100%" height="100%">
                                             <BarChart data={payerData} layout="vertical">
                                                 <XAxis type="number" fontSize={10} />
                                                 <YAxis dataKey="name" type="category" fontSize={10} width={40} />
                                                 <Tooltip formatter={(value) => formatCurrency(value as number)} />
                                                 <Bar dataKey="value" fill="#10b981" radius={[0,4,4,0]} />
                                             </BarChart>
                                         </ResponsiveContainer>
                                     </div>
                                     <div className="border border-slate-100 rounded overflow-hidden">
                                         <table className="w-full text-sm text-left">
                                             <thead className="bg-slate-50 text-slate-500 border-b border-slate-100"><tr><th className="p-1.5 px-2 font-bold">付款人</th><th className="p-1.5 px-2 text-right font-bold">金額</th></tr></thead>
                                             <tbody className="divide-y divide-slate-100">
                                                 {payerData.map((d) => (
                                                     <tr key={d.name} className="hover:bg-slate-50"><td className="p-1 px-2 text-slate-600 font-bold">{d.name}</td><td className="p-1 px-2 text-right font-bold text-slate-800">{formatCurrency(d.value)}</td></tr>
                                                 ))}
                                             </tbody>
                                         </table>
                                      </div>
                                 </div>
                             </div>
                         )}
                     </div>
                 </div>
                 );
             })()}
          </div>

          {/* Slogan Modal */}
          {showTripModal && (
              <div className="absolute inset-0 z-[100] bg-slate-900/50 flex items-center justify-center p-4">
                 <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm animate-in zoom-in-95 flex flex-col overflow-hidden">
                     <div className="bg-purple-600 px-4 py-3 flex justify-between items-center text-white">
                         <h3 className="font-bold text-lg">{tripForm.id ? '修改標語' : '新增標語設定'}</h3>
                         <button onClick={() => setShowTripModal(false)} className="hover:bg-white/20 p-1 rounded-lg transition-colors"><X size={20}/></button>
                     </div>
                     <div className="p-4 flex flex-col gap-4 overflow-y-auto max-h-[70vh]">
                         <div>
                             <label className="block text-xs font-bold text-slate-500 mb-1">日期</label>
                             <input type="date" value={tripForm.startDate || ''} onChange={e => setTripForm({...tripForm, startDate: e.target.value})} className="w-full min-w-0 block border border-slate-300 rounded-xl px-3 py-2 font-bold focus:ring-2 focus:ring-purple-500 outline-none text-slate-700 bg-slate-50 appearance-none" />
                         </div>
                         <div>
                             <label className="block text-xs font-bold text-slate-500 mb-1">天數</label>
                             <input type="number" min="1" value={tripForm.days || ''} onChange={e => setTripForm({...tripForm, days: e.target.value ? parseInt(e.target.value) : ('' as any)})} className="w-full block box-border border border-slate-300 rounded-xl px-3 py-2 font-bold focus:ring-2 focus:ring-purple-500 outline-none text-slate-700 bg-slate-50" />
                         </div>
                         <div>
                             <label className="block text-xs font-bold text-slate-500 mb-1">地點</label>
                             <input type="text" value={tripForm.location || ''} onChange={e => setTripForm({...tripForm, location: e.target.value})} placeholder="例如: 宜蘭縣" className="w-full border border-slate-300 rounded-xl px-3 py-2 font-bold focus:ring-2 focus:ring-purple-500 outline-none text-slate-700 bg-slate-50" />
                         </div>
                         <div>
                             <label className="block text-xs font-bold text-slate-500 mb-1">備註 (可空白)</label>
                             <input type="text" value={tripForm.remarks || ''} onChange={e => setTripForm({...tripForm, remarks: e.target.value})} placeholder="例如: 音樂饗宴" className="w-full border border-slate-300 rounded-xl px-3 py-2 font-bold focus:ring-2 focus:ring-purple-500 outline-none text-slate-700 bg-slate-50" />
                         </div>
                     </div>
                     <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col gap-3 shrink-0">
                         <div className="flex gap-2">
                             <button 
                               onClick={() => {
                                   setTripForm({ startDate: new Date().toISOString().split('T')[0], days: 1 });
                               }} 
                               className="flex-1 py-2 font-bold text-purple-700 bg-purple-100 rounded-xl hover:bg-purple-200 transition-colors flex items-center justify-center gap-2"
                             >
                                 <Plus size={18} /> 新增標語
                             </button>
                             {tripForm.id && (
                                 <button 
                                   onClick={() => {
                                       setShowTripModal(false);
                                       setDeleteTripConfirm(tripForm.id || null);
                                   }}
                                   disabled={expenses.some(e => e.tripId === tripForm.id)}
                                   title={expenses.some(e => e.tripId === tripForm.id) ? '內部有計帳資料不可刪除標語' : '刪除標語'}
                                   className="flex-1 py-2 font-bold text-rose-700 bg-rose-100 rounded-xl hover:bg-rose-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                 >
                                     <Trash2 size={18} /> 刪除標語
                                 </button>
                             )}
                         </div>
                         <div className="flex gap-2">
                             <button onClick={() => setShowTripModal(false)} className="flex-1 py-2 font-bold text-slate-600 bg-white border border-slate-300 rounded-xl hover:bg-slate-100 transition-colors">取消</button>
                             <button onClick={handleSaveTrip} disabled={!tripForm.startDate || !tripForm.days || !tripForm.location} className="flex-1 py-2 font-bold text-white bg-purple-600 rounded-xl hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">存檔</button>
                         </div>
                     </div>
                 </div>
              </div>
          )}

          {/* Expense Modal */}
          {showExpenseModal && (
              <div className="absolute inset-0 z-[100] bg-slate-900/50 flex items-center flex-col justify-end sm:justify-center p-0 sm:p-4">
                 <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-xl w-full max-w-md animate-in slide-in-from-bottom-5 sm:zoom-in-95 flex flex-col flex-1 sm:max-h-[85vh]">
                     <div className="bg-purple-600 px-4 py-3 flex justify-between items-center text-white shrink-0 sm:rounded-t-2xl">
                         <h3 className="font-bold text-lg">{expenseForm.id ? '修改記帳' : '新增記帳功能'}</h3>
                         <button onClick={() => setShowExpenseModal(false)} className="hover:bg-white/20 p-1 rounded-lg transition-colors"><X size={20}/></button>
                     </div>
                     <div className="p-4 flex flex-col gap-4 overflow-y-auto flex-1 bg-slate-50">
                         {/* Date */}
                         <div>
                             <label className="block text-xs font-bold text-slate-500 mb-1">日期</label>
                             <input type="date" value={expenseForm.date || ''} onChange={e => setExpenseForm({...expenseForm, date: e.target.value})} className="w-full min-w-0 block border border-slate-300 rounded-xl px-3 py-2.5 font-bold focus:ring-2 focus:ring-purple-500 outline-none text-slate-700 bg-white appearance-none" />
                         </div>
                         
                         {/* Category */}
                         <div>
                             <label className="block text-xs font-bold text-slate-500 mb-1">分類</label>
                             <div className="grid grid-cols-6 gap-1">
                                 {CATEGORIES.map(c => (
                                     <button
                                         key={c}
                                         type="button"
                                         onClick={() => setExpenseForm({...expenseForm, category: c})}
                                         className={'py-2 px-0 text-xs font-bold rounded-lg border transition-colors flex items-center justify-center ' + (expenseForm.category === c ? 'bg-purple-600 border-purple-600 text-white shadow-sm' : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-50')}
                                     >
                                         {c}
                                     </button>
                                 ))}
                             </div>
                         </div>
                         
                         {/* Location */}
                         <div>
                             <label className="block text-xs font-bold text-slate-500 mb-1">地點</label>
                             <input type="text" value={expenseForm.location || ''} onChange={e => setExpenseForm({...expenseForm, location: e.target.value})} placeholder="如: 餐廳名稱、車站" className="w-full border border-slate-300 rounded-xl px-3 py-2.5 font-bold focus:ring-2 focus:ring-purple-500 outline-none text-slate-700 bg-white" />
                         </div>

                         {/* Amount & Currency */}
                         <div className="flex gap-3 items-end">
                             <div className="w-1/3">
                                 <label className="block text-xs font-bold text-slate-500 mb-1">幣別</label>
                                 <select value={expenseForm.currency || 'TWD'} onChange={e => setExpenseForm({...expenseForm, currency: e.target.value})} className="w-full border border-slate-300 rounded-xl px-2 py-2.5 font-bold focus:ring-2 focus:ring-purple-500 outline-none text-slate-700 bg-white sm:text-sm appearance-none cursor-pointer">
                                     {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                                 </select>
                             </div>
                             <div className="flex-1">
                                 <label className="block text-xs font-bold text-slate-500 mb-1">金額</label>
                                 <input type="number" min="0" value={expenseForm.amount || ''} onChange={e => setExpenseForm({...expenseForm, amount: parseInt(e.target.value) || 0})} placeholder="0" className="w-full border border-slate-300 rounded-xl px-3 py-2.5 font-bold font-mono focus:ring-2 focus:ring-purple-500 outline-none text-slate-700 bg-white text-lg" />
                             </div>
                         </div>
                         
                         {/* Description */}
                         <div>
                             <label className="block text-xs font-bold text-slate-500 mb-1">說明</label>
                             <input type="text" value={expenseForm.description || ''} onChange={e => setExpenseForm({...expenseForm, description: e.target.value})} placeholder="簡短敘述" className="w-full border border-slate-300 rounded-xl px-3 py-2.5 font-bold focus:ring-2 focus:ring-purple-500 outline-none text-slate-700 bg-white" />
                         </div>

                         {/* Payer */}
                         <div>
                             <label className="block text-xs font-bold text-slate-500 mb-1">付款人</label>
                             <div className="flex gap-2">
                                 {PAYERS.map(p => (
                                     <button 
                                        key={p} 
                                        onClick={() => setExpenseForm({...expenseForm, payer: p})}
                                        className={`flex-1 py-2 font-bold rounded-xl border text-sm transition-all ${expenseForm.payer === p ? 'bg-purple-600 text-white border-purple-600 shadow-md' : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-100'}`}
                                     >
                                         {p}
                                     </button>
                                 ))}
                             </div>
                         </div>
                     </div>
                     <div className="p-4 bg-white border-t border-slate-200 flex gap-3 shrink-0">
                         <button onClick={() => setShowExpenseModal(false)} className="flex-1 py-3 font-bold text-slate-600 bg-slate-100 border border-slate-200 rounded-xl hover:bg-slate-200 transition-colors">取消</button>
                         <button onClick={handleSaveExpense} disabled={!expenseForm.date || !expenseForm.location || !expenseForm.amount || isSavingExp} className="flex-1 py-3 font-bold text-white bg-purple-600 rounded-xl hover:bg-purple-700 transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                             <Save size={18}/> 存檔
                         </button>
                     </div>
                 </div>
              </div>
          )}

          {/* Delete Trip Confirm Modal */}
          {deleteTripConfirm && (
              <div className="absolute inset-0 z-[150] bg-slate-900/50 flex items-center justify-center p-4">
                  <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm animate-in zoom-in-95 p-5 flex flex-col items-center text-center">
                      <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mb-3">
                          <AlertCircle size={24} />
                      </div>
                      <h3 className="font-bold text-lg text-slate-800 mb-2">確認刪除此旅遊標語？</h3>
                      <p className="text-sm text-slate-500 mb-5">此操作無法復原。</p>
                      <div className="flex gap-3 w-full">
                          <button onClick={() => setDeleteTripConfirm(null)} className="flex-1 py-2.5 font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors">取消</button>
                          <button onClick={() => handleDeleteTrip(deleteTripConfirm)} className="flex-1 py-2.5 font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-colors">確認刪除</button>
                      </div>
                  </div>
              </div>
          )}
          
          {/* Delete Confirm Modal */}
          {deleteConfirm && (
             <div className="absolute inset-0 z-[200] bg-slate-900/40 flex items-center justify-center p-4">
               <div className="bg-white rounded-xl shadow-lg w-full max-w-xs animate-in zoom-in-95 p-5">
                   <div className="flex items-center gap-3 mb-3 text-rose-600">
                       <AlertCircle size={24} />
                       <h3 className="font-bold text-lg">確定刪除資料？</h3>
                   </div>
                   <p className="text-slate-600 font-medium mb-5">刪除後無法復原，請確認是否執行此動作。</p>
                   <div className="flex justify-end gap-2 text-sm font-bold">
                       <button onClick={() => setDeleteConfirm(null)} className="px-4 py-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-colors">取消</button>
                       <button onClick={() => handleDeleteExpense(deleteConfirm)} className="px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors shadow-sm">確定刪除</button>
                   </div>
               </div>
             </div>
          )}
          
          {/* Bottom Nav Spacer */}
          {renderNav()}
      </div>
  );
};

export default TravelSystem;
