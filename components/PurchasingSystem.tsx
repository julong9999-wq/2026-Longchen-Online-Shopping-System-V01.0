import React, { useState, useEffect, useMemo } from 'react';
import { collection, onSnapshot, doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { generateUUID, formatCurrency } from '../utils';
import { FileText, Edit, Plus, Trash2, Home, Save, ChevronDown, ChevronUp, X } from 'lucide-react';

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
  const [subItemModal, setSubItemModal] = useState<{
     isOpen: boolean;
     type: 'payment' | 'collection';
     mode: 'add' | 'edit';
     id?: string;
     orderNo: string;
     name: string;
     amount: string;
  }>({
     isOpen: false,
     type: 'payment',
     mode: 'add',
     orderNo: '',
     name: '',
     amount: ''
  });

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

  const handleSaveSubItem = () => {
    if (!subItemModal.name || !subItemModal.amount) return;
    const amountNum = parseFloat(subItemModal.amount) || 0;
    
    if (subItemModal.mode === 'edit') {
      if (!window.confirm('確定要儲存修改嗎？')) return;
    }
    
    if (subItemModal.type === 'payment') {
      if (subItemModal.mode === 'add') {
        setPayments([...payments, { id: generateUUID(), orderNo: subItemModal.orderNo, name: subItemModal.name, amount: amountNum }]);
      } else {
        setPayments(payments.map(p => p.id === subItemModal.id ? { ...p, orderNo: subItemModal.orderNo, name: subItemModal.name, amount: amountNum } : p));
      }
    } else {
      if (subItemModal.mode === 'add') {
        setCollections([...collections, { id: generateUUID(), orderNo: subItemModal.orderNo, name: subItemModal.name, amount: amountNum }]);
      } else {
        setCollections(collections.map(c => c.id === subItemModal.id ? { ...c, orderNo: subItemModal.orderNo, name: subItemModal.name, amount: amountNum } : c));
      }
    }
    setSubItemModal({ ...subItemModal, isOpen: false });
  };
  
  const openSubItemModal = (type: 'payment' | 'collection', mode: 'add' | 'edit', item?: PurchasingItem) => {
    setSubItemModal({
      isOpen: true,
      type,
      mode,
      id: item?.id,
      orderNo: item?.orderNo || '',
      name: item?.name || '',
      amount: item ? String(item.amount) : ''
    });
  };

  const removePayment = (id: string) => {
    if (window.confirm('確定要刪除此筆資料嗎？')) {
      setPayments(payments.filter(p => p.id !== id));
    }
  };
  const removeCollection = (id: string) => {
    if (window.confirm('確定要刪除此筆資料嗎？')) {
      setCollections(collections.filter(c => c.id !== id));
    }
  };

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

  const SubTable = ({ title, items, colorClass, borderClass, bgClass, onRemove, onEdit, hideHeader, isDetail }: { title: string, items: PurchasingItem[], colorClass: string, borderClass: string, bgClass: string, onRemove?: (id: string) => void, onEdit?: (item: PurchasingItem) => void, hideHeader?: boolean, isDetail?: boolean }) => {
    const sum = items.reduce((acc, curr) => acc + curr.amount, 0);
    return (
      <div className={`border ${borderClass} rounded-xl overflow-hidden mb-4 shadow-sm bg-white`}>
        {!hideHeader && (
          <div className={`${bgClass} px-3 py-2 flex justify-between items-center border-b ${borderClass}`}>
            <h3 className="font-bold text-slate-800 text-sm">{title}</h3>
            <span className={`font-mono font-bold text-base ${colorClass}`}>{formatCurrency(sum)}</span>
          </div>
        )}
        {isDetail ? (
          <div className="p-0">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-100">
                <tr>
                  <th className="px-3 py-2 font-bold w-1/4">訂單序</th>
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
        ) : (
          <div className="divide-y divide-slate-100 p-0 text-sm">
            {items.length === 0 ? (
              <div className="px-3 py-4 text-center text-slate-400">目前無資料</div>
            ) : (
              items.map(item => (
                <div key={item.id} className="p-3 hover:bg-slate-50 transition-colors flex flex-col gap-1.5">
                  {/* 第一行: 訂單序, 金額, 修改按鈕 */}
                  <div className="flex justify-between items-center">
                     <div className="flex items-center gap-2">
                       <span className="bg-slate-200 text-slate-700 px-2 py-0.5 rounded text-xs font-mono font-bold">{item.orderNo || '無'}</span>
                     </div>
                     <div className="flex items-center gap-3">
                       <span className={`font-mono font-bold text-base ${item.amount < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>{formatCurrency(item.amount)}</span>
                       {onEdit && (
                         <button onClick={() => onEdit(item)} className="text-slate-400 hover:text-blue-500 p-1.5 rounded-full hover:bg-blue-50 transition-colors">
                           <Edit size={16} />
                         </button>
                       )}
                     </div>
                  </div>
                  {/* 第二行: 名稱, 刪除按鈕 */}
                  <div className="flex justify-between items-center">
                     <div className="font-bold text-slate-800 text-base">{item.name}</div>
                     {onRemove && (
                       <button onClick={() => onRemove(item.id)} className="text-slate-400 hover:text-rose-500 p-1.5 rounded-full hover:bg-rose-50 transition-colors">
                         <Trash2 size={16} />
                       </button>
                     )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    );
  };

  const renderRecordView = () => (
    <div className="flex-1 overflow-y-auto p-3 bg-slate-100">
      <div className="max-w-lg mx-auto animate-in fade-in flex flex-col gap-3 pb-20 mt-1">
         <div className="flex items-center justify-between bg-white p-3 rounded-xl shadow-sm border border-slate-200">
            <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-slate-800 mr-2">新增紀錄</h2>
                <span className="text-slate-500 text-sm font-bold hidden sm:inline">年月</span>
                <input 
                  type="month" 
                  value={selectedMonth} 
                  onChange={(e) => setSelectedMonth(e.target.value)} 
                  className="appearance-none bg-slate-100 border border-slate-300 text-slate-800 pl-2 pr-2 py-1 rounded-lg text-sm font-bold shadow-sm outline-none focus:ring-2 focus:ring-blue-500 w-36"
                />
            </div>
            <button onClick={handleSaveMonth} className="bg-orange-500 hover:bg-orange-600 text-white px-3 py-1.5 rounded-xl text-sm font-bold shadow-md transition-colors flex items-center gap-1.5">
               <Save size={16} />儲存
            </button>
         </div>

         <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 space-y-4">
            {/* 1. 代購付款 */}
            <div className="flex flex-col gap-1.5">
               <div 
                  className="flex justify-between items-center bg-orange-50 border border-orange-200 rounded-xl p-3 cursor-pointer select-none"
                  onClick={() => setIsPaymentExpanded(!isPaymentExpanded)}
               >
                  <span className="text-sm font-bold text-orange-700">代購付款</span>
                  <div className="flex items-center gap-2">
                     <span className="font-mono font-bold text-orange-700">{formatCurrency(totalPayments)}</span>
                     {isPaymentExpanded ? <ChevronUp size={20} className="text-orange-500"/> : <ChevronDown size={20} className="text-orange-500"/>}
                     <button onClick={(e) => { e.stopPropagation(); openSubItemModal('payment', 'add'); setIsPaymentExpanded(true); }} className="bg-orange-500 hover:bg-orange-600 text-white rounded-full p-1 transition-colors ml-1">
                        <Plus size={16} />
                     </button>
                  </div>
               </div>
               {isPaymentExpanded && (
                  <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-3 mt-1">
                     <SubTable 
                       title="代購付款列表" 
                       items={payments} 
                       colorClass="text-orange-600" 
                       borderClass="border-slate-100" 
                       bgClass=""
                       hideHeader
                       onRemove={removePayment}
                       onEdit={(item) => openSubItemModal('payment', 'edit', item)}
                     />
                  </div>
               )}
            </div>

            {/* 2. 出貨代收 */}
            <div className="flex flex-col gap-1.5">
               <div 
                  className="flex justify-between items-center bg-emerald-50 border border-emerald-200 rounded-xl p-3 cursor-pointer select-none"
                  onClick={() => setIsCollectionExpanded(!isCollectionExpanded)}
               >
                  <span className="text-sm font-bold text-emerald-700">出貨代收</span>
                  <div className="flex items-center gap-2">
                     <span className="font-mono font-bold text-emerald-700">{formatCurrency(totalCollections)}</span>
                     {isCollectionExpanded ? <ChevronUp size={20} className="text-emerald-500"/> : <ChevronDown size={20} className="text-emerald-500"/>}
                     <button onClick={(e) => { e.stopPropagation(); openSubItemModal('collection', 'add'); setIsCollectionExpanded(true); }} className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-full p-1 transition-colors ml-1">
                        <Plus size={16} />
                     </button>
                  </div>
               </div>
               {isCollectionExpanded && (
                  <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-3 mt-1">
                     <SubTable 
                       title="出貨代收列表" 
                       items={collections} 
                       colorClass="text-emerald-600" 
                       borderClass="border-slate-100" 
                       bgClass="" 
                       hideHeader
                       onRemove={removeCollection}
                       onEdit={(item) => openSubItemModal('collection', 'edit', item)}
                     />
                  </div>
               )}
            </div>

            {/* 3. 銀行餘額 */}
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
      <div className="flex-1 overflow-y-auto p-3 bg-slate-200">
        <div className="max-w-lg mx-auto space-y-4 pb-20">
          <div className="flex items-center justify-between bg-white p-3 rounded-xl shadow-sm border border-slate-200">
             <h2 className="text-xl font-bold text-slate-800">代購明細</h2>
             <div className="flex items-center gap-2">
                <span className="text-slate-500 text-sm font-bold">年月</span>
                <div className="relative">
                  <select 
                    value={detailMonth} 
                    onChange={e => setDetailMonth(e.target.value)} 
                    className="appearance-none bg-slate-100 border border-slate-300 text-slate-800 pl-3 pr-8 py-1 rounded-lg text-sm font-bold shadow-sm outline-none focus:ring-2 focus:ring-blue-500"
                  >
                     {availableMonths.length === 0 && <option value={getCurrentMonthStr()}>{getCurrentMonthStr()}</option>}
                     {availableMonths.map(m => (
                       <option key={m} value={m}>{m}</option>
                     ))}
                  </select>
                  <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                </div>
             </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 space-y-3 mt-4">
            <div className="bg-orange-50 border border-orange-200 rounded-xl p-3 flex justify-between items-center">
               <span className="text-sm font-bold text-orange-700">代購付款</span>
               <span className="font-mono font-bold text-lg text-orange-700">{formatCurrency(sumP)}</span>
            </div>
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex justify-between items-center">
               <span className="text-sm font-bold text-emerald-700">出貨代收</span>
               <span className="font-mono font-bold text-lg text-emerald-700">{formatCurrency(sumC)}</span>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 flex justify-between items-center">
               <span className="text-sm font-bold text-blue-800">銀行餘額</span>
               <span className="font-mono font-bold text-lg text-blue-900">{formatCurrency(bankB)}</span>
            </div>
            <div className="bg-slate-100 border border-slate-200 rounded-xl p-3 flex justify-between items-center shadow-sm">
               <span className="font-bold text-base text-slate-700">合計金額</span>
               <span className="font-mono font-bold text-xl text-slate-800 tracking-tight">{formatCurrency(gTotal)}</span>
            </div>
            <div className="h-2"></div>
            <div className="bg-purple-50 border border-purple-200 rounded-xl p-3 flex justify-between items-center">
               <span className="text-sm font-bold text-purple-700">已領利潤</span>
               <span className="font-mono font-bold text-lg text-purple-900">{formatCurrency(selectedDetailRecord?.profitWithdrawn || 0)}</span>
            </div>
          </div>

          <SubTable 
            title="代購付款明細" 
            items={pItems} 
            colorClass="text-orange-600" 
            borderClass="border-orange-200" 
            bgClass="bg-orange-50"
            isDetail={true}
          />

          <SubTable 
            title="出貨代收明細" 
            items={cItems} 
            colorClass="text-emerald-600" 
            borderClass="border-emerald-200" 
            bgClass="bg-emerald-50"
            isDetail={true}
          />
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
       
       {subItemModal.isOpen && (
         <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in">
           <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-xl">
             <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50">
               <h3 className="font-bold text-lg text-slate-800">
                 {subItemModal.mode === 'add' ? '新增' : '修改'}{subItemModal.type === 'payment' ? '代購付款' : '出貨代收'}
               </h3>
               <button onClick={() => setSubItemModal({...subItemModal, isOpen: false})} className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-200 transition-colors">
                 <X size={20} />
               </button>
             </div>
             <div className="p-5 flex flex-col gap-4">
               <div>
                  <label className="block text-sm font-bold text-slate-600 mb-1">訂單序號</label>
                  <input type="text" value={subItemModal.orderNo} onChange={e => setSubItemModal({...subItemModal, orderNo: e.target.value})} className="w-full border border-slate-300 rounded-xl p-3 text-base font-mono outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" placeholder="例如: 1024" autoFocus autoComplete="off" autoCorrect="off" spellCheck={false} />
               </div>
               <div>
                  <label className="block text-sm font-bold text-slate-600 mb-1">名稱</label>
                  <input type="text" value={subItemModal.name} onChange={e => setSubItemModal({...subItemModal, name: e.target.value})} className="w-full border border-slate-300 rounded-xl p-3 text-base outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" placeholder="商品名稱或代收項目" autoComplete="off" autoCorrect="off" spellCheck={false} />
               </div>
               <div>
                  <label className="block text-sm font-bold text-slate-600 mb-1">金額</label>
                  <input type="number" step="any" value={subItemModal.amount} onChange={e => setSubItemModal({...subItemModal, amount: e.target.value})} onKeyDown={e => e.key === 'Enter' && handleSaveSubItem()} className="w-full border border-slate-300 rounded-xl p-3 text-base font-mono outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" placeholder="0" />
               </div>
               <div className="mt-2">
                 <button onClick={handleSaveSubItem} className={`w-full ${subItemModal.type === 'payment' ? 'bg-orange-500 hover:bg-orange-600' : 'bg-emerald-500 hover:bg-emerald-600'} text-white py-3 rounded-xl font-bold text-base shadow-md transition-all active:scale-95`}>
                   確認{subItemModal.mode === 'add' ? '新增' : '修改'}
                 </button>
               </div>
             </div>
           </div>
         </div>
       )}
    </div>
  );
};

export default PurchasingSystem;
