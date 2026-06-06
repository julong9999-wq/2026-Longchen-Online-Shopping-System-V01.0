import React, { useState, useEffect, useMemo } from 'react';
import { collection, onSnapshot, doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { generateUUID, formatCurrency } from '../utils';
import { FileText, Edit, Plus, Trash2, Home, Save, ChevronDown, ChevronUp } from 'lucide-react';

export interface PurchasingItem {
  id: string;
  orderNo: string;
  name: string;
  amount: number;
}

export interface PurchasingRecord {
  id: string; // 'YYYY-MM'
  month: string;
  payments: PurchasingItem[];
  collections: PurchasingItem[];
  bankBalance: number;
  profitWithdrawn: number;
}

interface Props {
  onNavigateHome: () => void;
}

const PurchasingSystem: React.FC<Props> = ({ onNavigateHome }) => {
  const [view, setView] = useState<'detail' | 'record'>('record');
  const [records, setRecords] = useState<PurchasingRecord[]>([]);

  // Selected month state
  const getCurrentMonthStr = () => new Date().toISOString().substring(0, 7);
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonthStr());
  
  // Record Form States
  const [bankBalanceStr, setBankBalanceStr] = useState('');
  const [profitWithdrawnStr, setProfitWithdrawnStr] = useState('');
  const [payments, setPayments] = useState<PurchasingItem[]>([]);
  const [collections, setCollections] = useState<PurchasingItem[]>([]);
  
  // Subform inputs
  const [paymentForm, setPaymentForm] = useState({ orderNo: '', name: '', amount: '' });
  const [collectionForm, setCollectionForm] = useState({ orderNo: '', name: '', amount: '' });

  const [isPaymentExpanded, setIsPaymentExpanded] = useState(false);
  const [isCollectionExpanded, setIsCollectionExpanded] = useState(false);

  // Load records
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'purchasingRecords'), (snapshot) => {
      const data = snapshot.docs.map(doc => doc.data() as PurchasingRecord);
      setRecords(data);
    }, (error) => {
      console.error("error fetching purchasing records", error);
    });
    return () => unsub();
  }, []);

  // Sync form with selected month data
  useEffect(() => {
    if (view === 'record') {
      const existing = records.find(r => r.month === selectedMonth);
      if (existing) {
        setBankBalanceStr(existing.bankBalance.toString());
        setProfitWithdrawnStr(existing.profitWithdrawn.toString());
        setPayments(existing.payments || []);
        setCollections(existing.collections || []);
      } else {
        setBankBalanceStr('0');
        setProfitWithdrawnStr('0');
        setPayments([]);
        setCollections([]);
      }
    }
  }, [selectedMonth, records, view]);

  const handleSaveMonth = async () => {
    const record: PurchasingRecord = {
      id: selectedMonth,
      month: selectedMonth,
      bankBalance: parseFloat(bankBalanceStr) || 0,
      profitWithdrawn: parseFloat(profitWithdrawnStr) || 0,
      payments,
      collections
    };
    try {
      await setDoc(doc(db, 'purchasingRecords', selectedMonth), record);
      alert('儲存成功！');
    } catch (e) {
      console.error("Error saving record:", e);
      alert('儲存失敗！');
    }
  };

  const handleAddPayment = () => {
    if (!paymentForm.name || !paymentForm.amount) return;
    setPayments([...payments, {
      id: generateUUID(),
      orderNo: paymentForm.orderNo,
      name: paymentForm.name,
      amount: parseFloat(paymentForm.amount) || 0
    }]);
    setPaymentForm({ orderNo: '', name: '', amount: '' });
  };

  const handleAddCollection = () => {
    if (!collectionForm.name || !collectionForm.amount) return;
    setCollections([...collections, {
      id: generateUUID(),
      orderNo: collectionForm.orderNo,
      name: collectionForm.name,
      amount: parseFloat(collectionForm.amount) || 0
    }]);
    setCollectionForm({ orderNo: '', name: '', amount: '' });
  };

  const removePayment = (id: string) => setPayments(payments.filter(p => p.id !== id));
  const removeCollection = (id: string) => setCollections(collections.filter(c => c.id !== id));

  const totalPayments = payments.reduce((sum, p) => sum + p.amount, 0);
  const totalCollections = collections.reduce((sum, c) => sum + c.amount, 0);
  const currentBankBalance = parseFloat(bankBalanceStr) || 0;
  
  const grandTotal = totalPayments + totalCollections + currentBankBalance;

  // Detail view computations
  const availableMonths = useMemo(() => {
    const months = Array.from(new Set(records.map(r => r.month)));
    if (!months.includes(getCurrentMonthStr())) months.push(getCurrentMonthStr());
    return months.sort((a, b) => b.localeCompare(a));
  }, [records]);

  const [detailMonth, setDetailMonth] = useState(getCurrentMonthStr());
  
  const selectedDetailRecord = records.find(r => r.month === detailMonth);

  const renderNav = () => (
    <div className="h-16 bg-orange-500 flex shrink-0 shadow-lg relative z-20">
      <button
        onClick={() => setView('detail')}
        className={`flex-1 flex flex-col items-center justify-center py-2 transition-opacity ${view === 'detail' ? 'text-white bg-orange-600' : 'text-orange-100 hover:text-white hover:bg-orange-600/50'}`}
      >
        <FileText size={22} className="mb-1" />
        <span className="text-xs font-bold tracking-wide">明細</span>
      </button>
      <button
        onClick={() => setView('record')}
        className={`flex-1 flex flex-col items-center justify-center py-2 transition-opacity ${view === 'record' ? 'text-white bg-orange-600' : 'text-orange-100 hover:text-white hover:bg-orange-600/50'}`}
      >
        <Edit size={22} className="mb-1" />
        <span className="text-xs font-bold tracking-wide">紀錄</span>
      </button>
      <button
        onClick={onNavigateHome}
        className="flex-1 flex flex-col items-center justify-center py-2 text-rose-100 hover:text-white hover:bg-rose-600/50 transition-opacity"
      >
        <Home size={22} className="mb-1" />
        <span className="text-xs font-bold tracking-wide">返回</span>
      </button>
    </div>
  );

  const SubTable = ({ title, items, colorClass, borderClass, bgClass, onRemove, hideHeader }: { title: string, items: PurchasingItem[], colorClass: string, borderClass: string, bgClass: string, onRemove?: (id: string) => void, hideHeader?: boolean }) => {
    const sum = items.reduce((acc, curr) => acc + curr.amount, 0);
    return (
      <div className={`border ${borderClass} rounded-xl overflow-hidden mb-4 shadow-sm bg-white`}>
        {!hideHeader && (
          <div className={`${bgClass} px-3 py-2 flex justify-between items-center border-b ${borderClass}`}>
            <h3 className="font-bold text-slate-800 text-sm">{title}</h3>
            <span className={`font-mono font-bold text-base ${colorClass}`}>{formatCurrency(sum)}</span>
          </div>
        )}
        <div className="p-0">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-100">
              <tr>
                <th className="px-3 py-2 font-bold w-1/4">訂單序號</th>
                <th className="px-3 py-2 font-bold w-1/2">名稱</th>
                <th className="px-3 py-2 font-bold text-right w-1/4">金額</th>
                {onRemove && <th className="px-2 py-2"></th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.length === 0 ? (
                <tr>
                  <td colSpan={onRemove ? 4 : 3} className="px-3 py-4 text-center text-slate-400">目前無資料</td>
                </tr>
              ) : (
                items.map(item => (
                  <tr key={item.id} className="hover:bg-slate-50">
                    <td className="px-3 py-2 font-mono text-xs">{item.orderNo}</td>
                    <td className="px-3 py-2 font-bold text-slate-700">{item.name}</td>
                    <td className={`px-3 py-2 text-right font-mono font-bold ${item.amount < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>{formatCurrency(item.amount)}</td>
                    {onRemove && (
                      <td className="px-2 py-2 text-center">
                        <button onClick={() => onRemove(item.id)} className="text-slate-400 hover:text-rose-500 p-1 rounded-full hover:bg-rose-50 transition-colors">
                          <Trash2 size={16} />
                        </button>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderRecordView = () => (
    <div className="flex-1 overflow-y-auto p-3 bg-slate-50">
      <div className="p-3 max-w-lg mx-auto animate-in fade-in flex flex-col gap-3 pb-20">
         <div className="flex items-center justify-between pt-1">
            <h2 className="text-xl font-bold text-slate-800">新增紀錄</h2>
            <button onClick={handleSaveMonth} className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-md transition-colors flex items-center gap-2">
               <Save size={18} />儲存
            </button>
         </div>

         <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 space-y-4">
            
            {/* 1. 年月 */}
            <div className="flex flex-col gap-1.5">
               <label className="text-sm font-bold text-slate-600 ml-1">年月</label>
               <input 
                 type="month" 
                 value={selectedMonth} 
                 onChange={(e) => setSelectedMonth(e.target.value)} 
                 className="w-full border border-slate-300 rounded-xl p-3 font-mono text-base outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 bg-white"
               />
            </div>

            {/* 2. 代購付款 */}
            <div className="flex flex-col gap-1.5">
               <div 
                  className="flex justify-between items-center bg-orange-50 border border-orange-200 rounded-xl p-3 cursor-pointer select-none"
                  onClick={() => setIsPaymentExpanded(!isPaymentExpanded)}
               >
                  <span className="text-sm font-bold text-orange-700">代購付款</span>
                  <div className="flex items-center gap-2">
                     <span className="font-mono font-bold text-orange-700">{formatCurrency(totalPayments)}</span>
                     {isPaymentExpanded ? <ChevronUp size={20} className="text-orange-500"/> : <Plus size={20} className="text-orange-500"/>}
                  </div>
               </div>
               {isPaymentExpanded && (
                  <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-3 mt-1">
                     <div className="flex flex-col gap-2 mb-2">
                        <div className="flex gap-2">
                           <input type="text" placeholder="訂單序號" value={paymentForm.orderNo} onChange={e => setPaymentForm({...paymentForm, orderNo: e.target.value})} className="border border-slate-300 rounded-lg p-3 text-base font-mono flex-1 min-w-0 bg-slate-50 focus:bg-white transition-colors" autoComplete="one-time-code" autoCorrect="off" spellCheck={false} data-form-type="other" />
                           <input type="text" placeholder="名稱" value={paymentForm.name} onChange={e => setPaymentForm({...paymentForm, name: e.target.value})} className="border border-slate-300 rounded-lg p-3 text-base flex-1 min-w-0 bg-slate-50 focus:bg-white transition-colors" autoComplete="one-time-code" autoCorrect="off" spellCheck={false} data-form-type="other" />
                        </div>
                        <div className="flex gap-2">
                           <input type="number" step="any" placeholder="金額" value={paymentForm.amount} onChange={e => setPaymentForm({...paymentForm, amount: e.target.value})} className="border border-slate-300 rounded-lg p-3 text-base font-mono flex-1 min-w-0 bg-slate-50 focus:bg-white transition-colors" onKeyDown={e => e.key === 'Enter' && handleAddPayment()} />
                           <button onClick={handleAddPayment} className="bg-orange-500 text-white rounded-lg px-4 font-bold hover:bg-orange-600 transition-colors shrink-0 flex items-center gap-1">
                              <Plus size={18} /> 新增
                           </button>
                        </div>
                     </div>
                     <SubTable 
                       title="代購付款列表" 
                       items={payments} 
                       colorClass="text-orange-600" 
                       borderClass="border-slate-100" 
                       bgClass=""
                       hideHeader
                       onRemove={removePayment}
                     />
                  </div>
               )}
            </div>

            {/* 3. 出貨代收 */}
            <div className="flex flex-col gap-1.5">
               <div 
                  className="flex justify-between items-center bg-emerald-50 border border-emerald-200 rounded-xl p-3 cursor-pointer select-none"
                  onClick={() => setIsCollectionExpanded(!isCollectionExpanded)}
               >
                  <span className="text-sm font-bold text-emerald-700">出貨代收</span>
                  <div className="flex items-center gap-2">
                     <span className="font-mono font-bold text-emerald-700">{formatCurrency(totalCollections)}</span>
                     {isCollectionExpanded ? <ChevronUp size={20} className="text-emerald-500"/> : <Plus size={20} className="text-emerald-500"/>}
                  </div>
               </div>
               {isCollectionExpanded && (
                  <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-3 mt-1">
                     <div className="flex flex-col gap-2 mb-2">
                        <div className="flex gap-2">
                           <input type="text" placeholder="訂單序號" value={collectionForm.orderNo} onChange={e => setCollectionForm({...collectionForm, orderNo: e.target.value})} className="border border-slate-300 rounded-lg p-3 text-base font-mono flex-1 min-w-0 bg-slate-50 focus:bg-white transition-colors" autoComplete="one-time-code" autoCorrect="off" spellCheck={false} data-form-type="other" />
                           <input type="text" placeholder="名稱" value={collectionForm.name} onChange={e => setCollectionForm({...collectionForm, name: e.target.value})} className="border border-slate-300 rounded-lg p-3 text-base flex-1 min-w-0 bg-slate-50 focus:bg-white transition-colors" autoComplete="one-time-code" autoCorrect="off" spellCheck={false} data-form-type="other" />
                        </div>
                        <div className="flex gap-2">
                           <input type="number" step="any" placeholder="金額" value={collectionForm.amount} onChange={e => setCollectionForm({...collectionForm, amount: e.target.value})} className="border border-slate-300 rounded-lg p-3 text-base font-mono flex-1 min-w-0 bg-slate-50 focus:bg-white transition-colors" onKeyDown={e => e.key === 'Enter' && handleAddCollection()} />
                           <button onClick={handleAddCollection} className="bg-emerald-500 text-white rounded-lg px-4 font-bold hover:bg-emerald-600 transition-colors shrink-0 flex items-center gap-1">
                              <Plus size={18} /> 新增
                           </button>
                        </div>
                     </div>
                     <SubTable 
                       title="出貨代收列表" 
                       items={collections} 
                       colorClass="text-emerald-600" 
                       borderClass="border-slate-100" 
                       bgClass="" 
                       hideHeader
                       onRemove={removeCollection}
                     />
                  </div>
               )}
            </div>

            {/* 4. 銀行餘額 */}
            <div className="flex flex-col gap-1.5">
               <label className="text-sm font-bold text-slate-600 ml-1">銀行餘額</label>
               <input 
                 type="number"
                 step="any"
                 value={bankBalanceStr}
                 onChange={(e) => setBankBalanceStr(e.target.value)}
                 className="w-full bg-white border border-slate-300 rounded-xl p-3 font-mono font-bold text-base text-slate-800 text-right outline-none focus:border-orange-500"
                 placeholder="0"
               />
            </div>

            {/* 5. 合計金額 */}
            <div className="flex flex-col gap-1.5">
               <label className="text-sm font-bold text-slate-600 ml-1">合計金額</label>
               <div className="w-full bg-slate-100 border border-slate-200 rounded-xl p-3 font-mono font-bold text-lg text-slate-800 text-right">
                  {formatCurrency(grandTotal)}
               </div>
            </div>

            {/* 6. 空白 */}
            <div className="h-4"></div>

            {/* 7. 已領利潤 */}
            <div className="flex flex-col gap-1.5 pt-4 border-t border-slate-200">
               <label className="text-sm font-bold text-purple-700 ml-1">已領利潤</label>
               <input 
                 type="number"
                 step="any"
                 value={profitWithdrawnStr}
                 onChange={(e) => setProfitWithdrawnStr(e.target.value)}
                 className="w-full bg-white border border-purple-200 rounded-xl p-3 font-mono font-bold text-base text-purple-800 text-right outline-none focus:border-purple-500"
                 placeholder="0"
               />
            </div>

         </div>
      </div>
    </div>
  );

  const renderDetailView = () => {
    const pItems = selectedDetailRecord?.payments || [];
    const cItems = selectedDetailRecord?.collections || [];
    const sumP = pItems.reduce((s, i) => s + i.amount, 0);
    const sumC = cItems.reduce((s, i) => s + i.amount, 0);
    const bankB = selectedDetailRecord?.bankBalance || 0;
    const gTotal = sumP + sumC + bankB;

    return (
      <div className="flex-1 overflow-y-auto p-3 bg-slate-50">
        <div className="p-3 max-w-lg mx-auto animate-in fade-in flex flex-col gap-3 pb-20">
         <div className="flex items-center justify-between pt-1">
            <h2 className="text-xl font-bold text-slate-800">代購明細</h2>
         </div>
         <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 space-y-4">
            {/* 1. 年月 */}
            <div className="flex flex-col gap-1.5">
               <label className="text-sm font-bold text-slate-600 ml-1">年月</label>
               <div className="relative">
                 <select 
                   value={detailMonth} 
                   onChange={e => setDetailMonth(e.target.value)} 
                   className="w-full appearance-none border border-slate-300 rounded-xl p-3 font-mono text-base outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 bg-white"
                 >
                    {availableMonths.length === 0 && <option value={getCurrentMonthStr()}>{getCurrentMonthStr()}</option>}
                    {availableMonths.map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                 </select>
                 <ChevronDown size={20} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
               </div>
            </div>

            {/* 2. 代購付款 */}
            <div className="flex flex-col gap-1.5">
               <div 
                  className="flex justify-between items-center bg-orange-50 border border-orange-200 rounded-xl p-3 cursor-pointer select-none"
                  onClick={() => setIsPaymentExpanded(!isPaymentExpanded)}
               >
                  <span className="text-sm font-bold text-orange-700">代購付款</span>
                  <div className="flex items-center gap-2">
                     <span className="font-mono font-bold text-orange-700">{formatCurrency(sumP)}</span>
                     {isPaymentExpanded ? <ChevronUp size={20} className="text-orange-500"/> : <Plus size={20} className="text-orange-500"/>}
                  </div>
               </div>
               {isPaymentExpanded && (
                  <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-3 mt-1">
                     <SubTable 
                       title="代購付款列表" 
                       items={pItems} 
                       colorClass="text-orange-600" 
                       borderClass="border-slate-100" 
                       bgClass=""
                       hideHeader
                     />
                  </div>
               )}
            </div>

            {/* 3. 出貨代收 */}
            <div className="flex flex-col gap-1.5">
               <div 
                  className="flex justify-between items-center bg-emerald-50 border border-emerald-200 rounded-xl p-3 cursor-pointer select-none"
                  onClick={() => setIsCollectionExpanded(!isCollectionExpanded)}
               >
                  <span className="text-sm font-bold text-emerald-700">出貨代收</span>
                  <div className="flex items-center gap-2">
                     <span className="font-mono font-bold text-emerald-700">{formatCurrency(sumC)}</span>
                     {isCollectionExpanded ? <ChevronUp size={20} className="text-emerald-500"/> : <Plus size={20} className="text-emerald-500"/>}
                  </div>
               </div>
               {isCollectionExpanded && (
                  <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-3 mt-1">
                     <SubTable 
                       title="出貨代收列表" 
                       items={cItems} 
                       colorClass="text-emerald-600" 
                       borderClass="border-slate-100" 
                       bgClass="" 
                       hideHeader
                     />
                  </div>
               )}
            </div>

            {/* 4. 銀行餘額 */}
            <div className="flex flex-col gap-1.5">
               <label className="text-sm font-bold text-slate-600 ml-1">銀行餘額</label>
               <div className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-mono font-bold text-base text-slate-800 text-right">
                  {formatCurrency(bankB)}
               </div>
            </div>

            {/* 5. 合計金額 */}
            <div className="flex flex-col gap-1.5">
               <label className="text-sm font-bold text-slate-600 ml-1">合計金額</label>
               <div className="w-full bg-slate-100 border border-slate-200 rounded-xl p-3 font-mono font-bold text-lg text-slate-800 text-right">
                  {formatCurrency(gTotal)}
               </div>
            </div>

            {/* 6. 空白 */}
            <div className="h-4"></div>

            {/* 7. 已領利潤 */}
            <div className="flex flex-col gap-1.5 pt-4 border-t border-slate-200">
               <label className="text-sm font-bold text-purple-700 ml-1">已領利潤</label>
               <div className="w-full bg-purple-50 border border-purple-200 rounded-xl p-3 font-mono font-bold text-base text-purple-800 text-right">
                  {formatCurrency(selectedDetailRecord?.profitWithdrawn || 0)}
               </div>
            </div>
          </div>

        </div>
      </div>
    );
  };

  return (
    <div className="h-screen w-full flex flex-col bg-slate-900 overflow-hidden font-sans">
       <div className="flex-1 overflow-hidden w-full relative">
         {view === 'record' && <div className="absolute inset-0 overflow-hidden flex flex-col">{renderRecordView()}</div>}
         {view === 'detail' && <div className="absolute inset-0 overflow-hidden flex flex-col">{renderDetailView()}</div>}
       </div>
       {renderNav()}
    </div>
  );
};

export default PurchasingSystem;
