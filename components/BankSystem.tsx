import React, { useState, useEffect } from 'react';
import { Home, List, CalendarDays, Plus, BookType, ChevronDown, ChevronRight, X, Save, Pencil, Trash2, AlertCircle, BarChart as BarChartIcon } from 'lucide-react';
import { collection, onSnapshot, setDoc, deleteDoc, doc, writeBatch } from 'firebase/firestore';
import { db } from '../firebase';
import { BankTransaction, BankVocabulary, BankAccount, BankTransactionType } from '../types';
import { INITIAL_BANK_VOCABULARY } from '../constants';
import { formatCurrency, generateUUID } from '../utils';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

type BankView = 'summary' | 'monthly' | 'analysis' | 'add' | 'vocab';

interface Props {
  onNavigateHome: () => void;
}

const BankSystem: React.FC<Props> = ({ onNavigateHome }) => {
  const [view, setView] = useState<BankView>('summary');
  const [returnView, setReturnView] = useState<BankView | null>(null);
  const [vocabularies, setVocabularies] = useState<BankVocabulary[]>(INITIAL_BANK_VOCABULARY);
  const [transactions, setTransactions] = useState<BankTransaction[]>([]);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'vocabularies'), async (snapshot) => {
      const data = snapshot.docs.map(d => d.data() as BankVocabulary);
      if (data.length > 0) {
        // One-time cleanup for requested words
        const excludeRemarks = ['零用金', '禹君代墊', '禹辰代墊', '共同生活費'];
        data.forEach(v => {
          if (v.type === '備註' && !v.parentId && excludeRemarks.includes(v.word)) {
            deleteDoc(doc(db, 'vocabularies', v.id)).catch(console.error);
          }
        });
        setVocabularies(data.filter(v => !(v.type === '備註' && !v.parentId && excludeRemarks.includes(v.word))));
      } else {
        // Init Firebase with starting constants if empty
        const batch = writeBatch(db);
        INITIAL_BANK_VOCABULARY.forEach(v => {
           batch.set(doc(db, 'vocabularies', v.id), v);
        });
        await batch.commit();
        setVocabularies(INITIAL_BANK_VOCABULARY);
      }
    }, (error) => {
      console.error("Firebase sync error:", error);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'transactions'), (snapshot) => {
      const data = snapshot.docs.map(d => d.data() as BankTransaction);
      setTransactions(data.sort((a, b) => b.createdAt - a.createdAt));
    }, (error) => {
      console.error("Transactions sync error:", error);
    });
    return () => unsub();
  }, []);

  const [activeAccount, setActiveAccount] = useState<BankAccount>('禹君');
  const [selectedMonth, setSelectedMonth] = useState<string>('2026-06');

  // Add Data Form State
  const defaultFormState = {
    account: '禹君' as BankAccount,
    type: '收入' as BankTransactionType,
    date: new Date().toISOString().split('T')[0],
    category: '',
    amount: 0,
    remarks: ''
  };
  const [addForm, setAddForm] = useState<Partial<BankTransaction>>(defaultFormState);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);
  const [txToDelete, setTxToDelete] = useState<BankTransaction | null>(null);

  const handleSaveTransaction = async () => {
    if (!addForm.category || !addForm.amount) return;
    
    let finalAmount = Number(addForm.amount) || 0;
    
    // Auto convert missing minus sign for specific categories
    if (finalAmount > 0) {
       if (addForm.category.includes('買股') || addForm.category.includes('歸還') || addForm.category.includes('買入') || addForm.category.includes('獲利領取')) {
          finalAmount = -finalAmount;
       }
    }
    
    const newTx: BankTransaction = {
      id: addForm.id || generateUUID(),
      account: addForm.account as BankAccount,
      type: addForm.type as BankTransactionType,
      date: addForm.date || new Date().toISOString().split('T')[0],
      category: addForm.category,
      amount: finalAmount,
      remarks: addForm.remarks || '',
      createdAt: addForm.createdAt || Date.now()
    };

    try {
      await setDoc(doc(db, 'transactions', newTx.id), newTx);
      setAddForm({...defaultFormState, account: addForm.account as BankAccount, type: addForm.type as BankTransactionType});
      setShowSaveConfirm(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
      if (returnView) {
         setView(returnView);
         setReturnView(null);
      }
    } catch (e) {
      console.error("error saving transaction", e);
    }
  };

  const handleDeleteTx = async () => {
    if (!txToDelete) return;
    try {
       await deleteDoc(doc(db, 'transactions', txToDelete.id));
       setTxToDelete(null);
    } catch(e) {
       console.error("error deleting tx", e);
    }
  };

  const handleEditTx = (tx: BankTransaction) => {
    setAddForm(tx);
    setReturnView(view);
    setView('add');
  };

  // Vocab View State
  const [vocabTab, setVocabTab] = useState<BankTransactionType>('收入');
  const [newWord, setNewWord] = useState('');
  const [selectedParentId, setSelectedParentId] = useState<string | null>(null);
  const [newSubWord, setNewSubWord] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<{id: string, type: 'main' | 'sub', word: string} | null>(null);

  const renderNav = () => (
    <div className="bg-[#275b3b] flex shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] overflow-x-auto shrink-0 z-50">
      {[
        { id: 'summary', label: '總表', icon: List },
        { id: 'monthly', label: '月份', icon: CalendarDays },
        { id: 'analysis', label: '分析', icon: BarChartIcon },
        { id: 'add', label: '新增', icon: Plus },
        { id: 'vocab', label: '詞庫', icon: BookType },
      ].map(nav => (
        <button
          key={nav.id}
          onClick={() => {
             setView(nav.id as BankView);
             if (nav.id === 'add') setReturnView(null);
          }}
          className={`flex-1 flex flex-col items-center justify-center py-3 transition-opacity ${view === nav.id ? 'text-yellow-400 bg-[#1e482d]' : 'text-emerald-100 hover:text-white hover:bg-emerald-800/50'}`}
        >
          <nav.icon size={22} className="mb-1" />
          <span className="text-xs font-bold tracking-wide">{nav.label}</span>
        </button>
      ))}
      <button 
        onClick={onNavigateHome}
        className="flex-1 flex flex-col items-center justify-center py-3 transition-opacity text-emerald-100 hover:text-white hover:bg-emerald-800/50"
      >
        <Home size={22} className="mb-1" />
        <span className="text-xs font-bold tracking-wide">返回</span>
      </button>
    </div>
  );

  const SubTable = ({ title, borderColor, valueColor, items = [], bgClass = 'bg-slate-50', headerClass = 'hover:bg-slate-50', onAddClick }: { title: string, borderColor: string, valueColor: string, items?: BankTransaction[], bgClass?: string, headerClass?: string, onAddClick?: () => void }) => {
    const [isOpen, setIsOpen] = useState(false);
    const sortedItems = [...items].sort((a, b) => {
       if (a.date === b.date) return (b.createdAt || 0) - (a.createdAt || 0);
       return b.date.localeCompare(a.date);
    });
    const total = items.reduce((sum, item) => sum + item.amount, 0); 
    
    return (
      <div className={`bg-white rounded-xl shadow-sm border overflow-hidden mb-2 border-l-4 ${borderColor}`}>
        <div 
          className={`px-3 py-1.5 flex justify-between items-center cursor-pointer transition-colors ${headerClass}`}
          onClick={() => setIsOpen(!isOpen)}
        >
          <div className="flex items-center gap-2">
             {isOpen ? <ChevronDown className="text-slate-400" size={18} /> : <ChevronRight className="text-slate-400" size={18} />}
             <span className="font-bold text-base text-slate-700 flex items-center gap-2">{title} <span className="bg-white text-slate-500 text-[11px] px-1.5 py-0.5 rounded-md font-mono shadow-sm leading-none">({items.length})</span></span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className={`font-mono font-bold text-lg ${valueColor}`}>{formatCurrency(total)}</span>
            {onAddClick && (
              <button 
                onClick={(e) => { e.stopPropagation(); onAddClick(); }} 
                className={`p-1 rounded-md hover:bg-black/5 transition-colors text-slate-400 hover:${valueColor.replace('text-', 'text-')}`}
                title={`新增${title}`}
              >
                <Plus size={16} />
              </button>
            )}
          </div>
        </div>
        
        {isOpen && (
          <div className={`border-t border-black/5 p-2 ${bgClass}`}>
            <div className="flex flex-col gap-2">
               {sortedItems.length === 0 ? (
                  <div className="text-center py-6 text-slate-400 italic font-medium text-sm">尚無資料</div>
               ) : (
                  sortedItems.map(item => (
                    <div key={item.id} className="bg-white border border-slate-200 rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow">
                       <div className="flex justify-between items-center mb-1">
                         <div className="flex items-center gap-2">
                           <span className="font-mono text-xs text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">{item.date.substring(5)}</span>
                           <span className="font-bold text-slate-800 text-[15px]">{item.category}</span>
                         </div>
                         <span className={`font-mono font-bold ${valueColor}`}>{formatCurrency(item.amount)}</span>
                       </div>
                       <div className="flex justify-between items-center text-slate-500 text-xs">
                         <span className="truncate flex-1 mr-2">{item.remarks || '無備註'}</span>
                         <div className="flex items-center gap-2 shrink-0">
                           <button onClick={(e) => { e.stopPropagation(); handleEditTx(item); }} className="text-slate-400 hover:text-blue-500 p-1.5 bg-slate-50 hover:bg-blue-50 rounded-md transition-colors"><Pencil size={14} /></button>
                           <button onClick={(e) => { e.stopPropagation(); setTxToDelete(item); }} className="text-slate-400 hover:text-rose-500 p-1.5 bg-slate-50 hover:bg-rose-50 rounded-md transition-colors"><Trash2 size={14} /></button>
                         </div>
                       </div>
                    </div>
                  ))
               )}
            </div>
          </div>
        )}
      </div>
    );
  };

  const ExpenseChart = ({ txs, title }: { txs: BankTransaction[], title: string }) => {
    const categories = ["現金領用", "信用卡費", "轉帳匯出", "其他支出", "合計"];
    const data = categories.map(cat => ({
      name: cat,
      禹君: 0,
      禹辰: 0
    }));

    txs.filter(t => t.type === '支出').forEach(t => {
       let catName = t.category;
       if (!["現金領用", "信用卡費", "轉帳匯出", "其他支出"].includes(catName)) {
          catName = "其他支出";
       }
       const dataRow = data.find(d => d.name === catName);
       const totalRow = data.find(d => d.name === "合計");
       if (dataRow && totalRow) {
          if (t.account === '禹君') {
             dataRow.禹君 += t.amount;
             totalRow.禹君 += t.amount;
          } else if (t.account === '禹辰') {
             dataRow.禹辰 += t.amount;
             totalRow.禹辰 += t.amount;
          }
       }
    });

    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-3 mt-1">
         <div className="flex items-center justify-between mb-3 ml-1">
           <h3 className="text-[14px] font-bold text-slate-700">{title}</h3>
           <div className="flex items-center gap-3 text-[12px] font-bold text-slate-600">
             <div className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded-full bg-[#fed7aa]"></div>禹君</div>
             <div className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded-full bg-[#d8b4e2]"></div>禹辰</div>
           </div>
         </div>
         <ResponsiveContainer width="100%" height={260}>
           <BarChart data={data} layout="vertical" margin={{ top: 5, right: 20, left: 0, bottom: 5 }} barGap={2} barCategoryGap="20%">
             <CartesianGrid strokeDasharray="3 3" horizontal={false} />
             <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={(val) => Math.round(val/1000) + 'k'} />
             <YAxis dataKey="name" type="category" width={65} tick={{ fontSize: 12, fill: '#475569', fontWeight: 'bold' }} />
             <Tooltip cursor={{fill: '#f8fafc'}} formatter={(value: number) => [formatCurrency(value), '']} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' }} />
             <Bar dataKey="禹君" fill="#fed7aa" name="禹君" radius={[0, 4, 4, 0]} barSize={12} />
             <Bar dataKey="禹辰" fill="#d8b4e2" name="禹辰" radius={[0, 4, 4, 0]} barSize={12} />
           </BarChart>
         </ResponsiveContainer>
      </div>
    );
  };

  const renderSummaryView = () => {
    const accountTxs = transactions.filter(t => t.account === activeAccount);
    const currentMonthStr = new Date().toISOString().substring(0, 7);
    const currentMonthTxs = accountTxs.filter(t => t.date.startsWith(currentMonthStr));
    
    const incTxs = currentMonthTxs.filter(t => t.type === '收入');
    const expTxs = currentMonthTxs.filter(t => t.type === '支出');
    const stockTxs = currentMonthTxs.filter(t => t.type === '股票');
    const transferTxs = currentMonthTxs.filter(t => t.type === '調度');

    let lastMonthBalance = 0;
    accountTxs.forEach(t => {
       if (t.date < currentMonthStr + "-01") {
          if (t.type === '收入') lastMonthBalance += t.amount;
          else if (t.type === '支出') lastMonthBalance -= t.amount;
          else if (t.type === '股票') lastMonthBalance += t.amount;
          else if (t.type === '調度') lastMonthBalance += t.amount;
       }
    });

    let monthBalanceDiff = 0;
    currentMonthTxs.forEach(t => {
       if (t.type === '收入') monthBalanceDiff += t.amount;
       else if (t.type === '支出') monthBalanceDiff -= t.amount;
       else if (t.type === '股票') monthBalanceDiff += t.amount;
       else if (t.type === '調度') monthBalanceDiff += t.amount;
    });
    
    const currentTotalBalance = lastMonthBalance + monthBalanceDiff;

    return (
      <div className="p-3 max-w-lg mx-auto animate-in fade-in flex flex-col gap-3">
        <div className="flex items-center gap-3 pt-1">
           <h2 className="text-xl font-bold text-slate-800">本月分析</h2>
           <span className="bg-slate-200 text-slate-600 px-3 py-1 rounded-lg text-sm font-bold shadow-inner">{currentMonthStr}</span>
        </div>

        <div className="flex gap-2">
          {(['禹君', '禹辰'] as BankAccount[]).map(acc => (
            <button
              key={acc}
              onClick={() => setActiveAccount(acc)}
              className={`flex-1 py-1.5 rounded-lg font-bold border transition-colors ${activeAccount === acc ? 'bg-[#408f61] text-white border-[#408f61] shadow-sm' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
            >
              {acc}
            </button>
          ))}
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white px-4 py-2.5 rounded-xl shadow-sm border border-slate-200 border-l-4 border-l-blue-500 hover:shadow-md transition-shadow flex justify-between items-center">
             <div className="text-slate-400 font-bold text-[13px] leading-tight pt-0.5 text-center">上月<br/>結餘</div>
             <div className="text-lg font-mono font-bold text-slate-800 leading-none">{formatCurrency(lastMonthBalance)}</div>
          </div>
          <div className="bg-white px-4 py-2.5 rounded-xl shadow-sm border border-slate-200 border-l-4 border-l-emerald-500 hover:shadow-md transition-shadow flex justify-between items-center">
             <div className="text-slate-400 font-bold text-[13px] leading-tight pt-0.5 text-center">本月<br/>結餘</div>
             <div className={`text-lg font-mono font-bold leading-none ${currentTotalBalance >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>{formatCurrency(currentTotalBalance)}</div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto pr-1">
          <SubTable title="本月收入" borderColor="border-blue-500" valueColor="text-blue-600" items={incTxs} bgClass="bg-blue-50" headerClass="hover:bg-blue-50/50 bg-blue-100/30" onAddClick={() => { setAddForm({...defaultFormState, account: activeAccount, type: '收入'}); setReturnView('summary'); setView('add'); }} />
          <SubTable title="本月支出" borderColor="border-rose-500" valueColor="text-rose-600" items={expTxs} bgClass="bg-rose-50" headerClass="hover:bg-rose-50/50 bg-rose-100/30" onAddClick={() => { setAddForm({...defaultFormState, account: activeAccount, type: '支出'}); setReturnView('summary'); setView('add'); }} />
          <SubTable title="股票買賣" borderColor="border-emerald-500" valueColor="text-emerald-600" items={stockTxs} bgClass="bg-emerald-50" headerClass="hover:bg-emerald-50/50 bg-emerald-100/30" onAddClick={() => { setAddForm({...defaultFormState, account: activeAccount, type: '股票'}); setReturnView('summary'); setView('add'); }} />
          <SubTable title="資金調度" borderColor="border-yellow-500" valueColor="text-yellow-600" items={transferTxs} bgClass="bg-yellow-50" headerClass="hover:bg-yellow-50/50 bg-yellow-100/30" onAddClick={() => { setAddForm({...defaultFormState, account: activeAccount, type: '調度'}); setReturnView('summary'); setView('add'); }} />
          <ExpenseChart txs={transactions.filter(t => t.date >= '2026-04')} title="支出分析 (自 2026-04 起)" />
        </div>
      </div>
    );
  };

  const renderMonthlyView = () => {
    const accountTxs = transactions.filter(t => t.account === activeAccount);
    
    // Find all unique months available in data across all accounts
    const availableMonths = Array.from(new Set(transactions.map(t => t.date.substring(0, 7)))).sort((a, b) => b.localeCompare(a));
    const currentMonthStr = new Date().toISOString().substring(0, 7);
    
    // If selectedMonth is not in availableMonths (e.g. initial load), use the newest available or current
    const displayMonth = availableMonths.includes(selectedMonth) ? selectedMonth : (availableMonths[0] || currentMonthStr);
    
    const currentMonthTxs = accountTxs.filter(t => t.date.startsWith(displayMonth));
    
    const incTxs = currentMonthTxs.filter(t => t.type === '收入');
    const expTxs = currentMonthTxs.filter(t => t.type === '支出');
    const stockTxs = currentMonthTxs.filter(t => t.type === '股票');
    const transferTxs = currentMonthTxs.filter(t => t.type === '調度');

    let lastMonthBalance = 0;
    accountTxs.forEach(t => {
       if (t.date < displayMonth + "-01") {
          if (t.type === '收入') lastMonthBalance += t.amount;
          else if (t.type === '支出') lastMonthBalance -= t.amount;
          else if (t.type === '股票') lastMonthBalance += t.amount;
          else if (t.type === '調度') lastMonthBalance += t.amount;
       }
    });

    let monthBalanceDiff = 0;
    currentMonthTxs.forEach(t => {
       if (t.type === '收入') monthBalanceDiff += t.amount;
       else if (t.type === '支出') monthBalanceDiff -= t.amount;
       else if (t.type === '股票') monthBalanceDiff += t.amount;
       else if (t.type === '調度') monthBalanceDiff += t.amount;
    });
    
    const currentTotalBalance = lastMonthBalance + monthBalanceDiff;

    return (
      <div className="p-3 max-w-lg mx-auto animate-in fade-in flex flex-col gap-3">
        <div className="flex items-center justify-between pt-1">
           <h2 className="text-xl font-bold text-slate-800">月份明細</h2>
           <div className="flex items-center gap-2">
              <span className="text-slate-500 text-sm font-bold">選擇月份</span>
              <select 
                value={displayMonth} 
                onChange={e => setSelectedMonth(e.target.value)} 
                className="bg-white border border-slate-300 text-slate-800 px-3 py-1 rounded-lg text-sm font-bold shadow-sm outline-none focus:ring-2 focus:ring-[#408f61]"
              >
                 {availableMonths.length === 0 && <option value={currentMonthStr}>{currentMonthStr}</option>}
                 {availableMonths.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
           </div>
        </div>

        <div className="flex gap-2">
          {(['禹君', '禹辰'] as BankAccount[]).map(acc => (
            <button
              key={acc}
              onClick={() => setActiveAccount(acc)}
              className={`flex-1 py-1.5 rounded-lg font-bold border transition-colors ${activeAccount === acc ? 'bg-[#408f61] text-white border-[#408f61] shadow-sm' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
            >
              {acc}
            </button>
          ))}
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white px-4 py-2.5 rounded-xl shadow-sm border border-slate-200 border-l-4 border-l-blue-500 flex justify-between items-center">
             <div className="text-slate-400 font-bold text-[13px] leading-tight pt-0.5 text-center">上月<br/>結餘</div>
             <div className="text-lg font-mono font-bold text-slate-800 leading-none">{formatCurrency(lastMonthBalance)}</div>
          </div>
          <div className="bg-white px-4 py-2.5 rounded-xl shadow-sm border border-slate-200 border-l-4 border-l-emerald-500 flex justify-between items-center">
             <div className="text-slate-400 font-bold text-[13px] leading-tight pt-0.5 text-center">本月<br/>結餘</div>
             <div className={`text-lg font-mono font-bold leading-none ${currentTotalBalance >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>{formatCurrency(currentTotalBalance)}</div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto pr-1">
          <SubTable title="本月收入" borderColor="border-blue-500" valueColor="text-blue-600" items={incTxs} bgClass="bg-blue-50" headerClass="hover:bg-blue-50/50 bg-blue-100/30" onAddClick={() => { setAddForm({...defaultFormState, account: activeAccount, type: '收入'}); setReturnView('monthly'); setView('add'); }} />
          <SubTable title="本月支出" borderColor="border-rose-500" valueColor="text-rose-600" items={expTxs} bgClass="bg-rose-50" headerClass="hover:bg-rose-50/50 bg-rose-100/30" onAddClick={() => { setAddForm({...defaultFormState, account: activeAccount, type: '支出'}); setReturnView('monthly'); setView('add'); }} />
          <SubTable title="股票買賣" borderColor="border-emerald-500" valueColor="text-emerald-600" items={stockTxs} bgClass="bg-emerald-50" headerClass="hover:bg-emerald-50/50 bg-emerald-100/30" onAddClick={() => { setAddForm({...defaultFormState, account: activeAccount, type: '股票'}); setReturnView('monthly'); setView('add'); }} />
          <SubTable title="資金調度" borderColor="border-yellow-500" valueColor="text-yellow-600" items={transferTxs} bgClass="bg-yellow-50" headerClass="hover:bg-yellow-50/50 bg-yellow-100/30" onAddClick={() => { setAddForm({...defaultFormState, account: activeAccount, type: '調度'}); setReturnView('monthly'); setView('add'); }} />
          <ExpenseChart txs={transactions.filter(t => t.date.startsWith(displayMonth))} title={`${displayMonth} 支出分析`} />
        </div>
      </div>
    );
  };

  const renderAnalysisView = () => {
    const last12Months = Array.from({length: 12}, (_, i) => {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      return d.toISOString().substring(0, 7);
    }).filter(m => m !== '2026-04');

    const data = last12Months.map(month => {
       const row = { month, 禹君: 0, 禹辰: 0 };
       const monthTxs = transactions.filter(t => t.date.startsWith(month));
       monthTxs.forEach(t => {
          if (t.type === '收入') {
             if (t.account === '禹君') row.禹君 += t.amount;
             else if (t.account === '禹辰') row.禹辰 += t.amount;
          } else if (t.type === '支出') {
             if (t.account === '禹君') row.禹君 -= t.amount;
             else if (t.account === '禹辰') row.禹辰 -= t.amount;
          }
       });
       return row;
    });

    const transferTxs = transactions.filter(t => t.type === '調度').sort((a, b) => a.date.localeCompare(b.date));
    const groupedTxs: Record<string, BankTransaction[]> = {};
    transferTxs.forEach(t => {
       const key = `${t.account}`;
       if (!groupedTxs[key]) groupedTxs[key] = [];
       groupedTxs[key].push(t);
    });

    const unsettledTransfers: BankTransaction[] = [];
    Object.values(groupedTxs).forEach(txs => {
       let posTxs: BankTransaction[] = [];
       let negTxs: BankTransaction[] = [];
       for (const tx of txs) {
           if (tx.amount > 0) posTxs.push({...tx});
           else if (tx.amount < 0) negTxs.push({...tx});
       }
       for (let i = 0; i < negTxs.length; i++) {
           let negAmt = -negTxs[i].amount;
           for (let j = 0; j < posTxs.length; j++) {
               if (posTxs[j].amount > 0 && negAmt > 0) {
                   if (posTxs[j].amount >= negAmt) {
                       posTxs[j].amount -= negAmt;
                       negAmt = 0;
                   } else {
                       negAmt -= posTxs[j].amount;
                       posTxs[j].amount = 0;
                   }
               }
           }
           if (negAmt > 0) {
               negTxs[i].amount = -negAmt;
           } else {
               negTxs[i].amount = 0;
           }
       }
       posTxs.forEach(t => { if (t.amount > 0) unsettledTransfers.push(t); });
       negTxs.forEach(t => { if (t.amount < 0) unsettledTransfers.push(t); });
    });
    
    unsettledTransfers.sort((a, b) => b.date.localeCompare(a.date));

    const stockTxs = transactions.filter(t => t.type === '股票');
    const stockSummary: Record<string, { tradeAmount: number, profitAmount: number }> = {};
    stockTxs.forEach(t => {
       if (!stockSummary[t.account]) stockSummary[t.account] = { tradeAmount: 0, profitAmount: 0 };
       
       stockSummary[t.account].tradeAmount += t.amount;
       
       if (t.category.includes('獲利領取')) {
           stockSummary[t.account].profitAmount += t.amount;
       }
    });

    const stockSummaryArray = Object.entries(stockSummary).map(([account, data]) => ({ account, tradeAmount: data.tradeAmount, profitAmount: data.profitAmount })).sort((a,b) => b.tradeAmount - a.tradeAmount);

    // To allow negative bars to render from 0, recharts handles it automatically with CartesianGrid, but we can add ReferenceLine
    return (
      <div className="p-3 max-w-lg mxauto animate-in fade-in flex flex-col gap-3 pb-20">
        {(() => {
            const getAccountBalance = (account: string) => {
                let bal = 0;
                transactions.filter(t => t.account === account).forEach(t => {
                    if (t.type === '收入') bal += t.amount;
                    else if (t.type === '支出') bal -= t.amount;
                    else if (t.type === '股票') bal += t.amount;
                    else if (t.type === '調度') bal += t.amount;
                });
                return bal;
            };

            const yuJunBank = getAccountBalance('禹君');
            const yuChenBank = getAccountBalance('禹辰');

            const yuJunStock = -(stockSummary['禹君']?.tradeAmount || 0);
            const yuChenStock = -(stockSummary['禹辰']?.tradeAmount || 0);

            const getUnsettledTransfersSum = (account: string) => {
                let sum = 0;
                unsettledTransfers.filter(t => t.account === account).forEach(t => {
                    sum += t.amount;
                });
                return sum;
            };

            const yuJunTransfer = -(getUnsettledTransfersSum('禹君'));
            const yuChenTransfer = -(getUnsettledTransfersSum('禹辰'));

            const yuJunTotal = yuJunBank + yuJunStock + yuJunTransfer;
            const yuChenTotal = yuChenBank + yuChenStock + yuChenTransfer;

            return (
                <>
                    <div className="flex items-center gap-3 pt-1">
                      <h2 className="text-xl font-bold text-slate-800">「帳務金額」分析總表</h2>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden shrink-0">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-[14px] whitespace-nowrap">
                          <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                            <tr>
                              <th className="px-4 py-3">項目</th>
                              <th className="px-4 py-3 text-right text-orange-600">禹君</th>
                              <th className="px-4 py-3 text-right text-fuchsia-600">禹辰</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            <tr className="hover:bg-slate-50 transition-colors">
                              <td className="px-4 py-3 font-bold text-slate-700">銀行餘額</td>
                              <td className={`px-4 py-3 text-right font-mono font-bold ${yuJunBank >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{formatCurrency(yuJunBank)}</td>
                              <td className={`px-4 py-3 text-right font-mono font-bold ${yuChenBank >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{formatCurrency(yuChenBank)}</td>
                            </tr>
                            <tr className="hover:bg-slate-50 transition-colors">
                              <td className="px-4 py-3 font-bold text-slate-700">股票買賣</td>
                              <td className={`px-4 py-3 text-right font-mono font-bold ${yuJunStock >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{formatCurrency(yuJunStock)}</td>
                              <td className={`px-4 py-3 text-right font-mono font-bold ${yuChenStock >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{formatCurrency(yuChenStock)}</td>
                            </tr>
                            <tr className="hover:bg-slate-50 transition-colors">
                              <td className="px-4 py-3 font-bold text-slate-700">資金調度</td>
                              <td className={`px-4 py-3 text-right font-mono font-bold ${yuJunTransfer >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{formatCurrency(yuJunTransfer)}</td>
                              <td className={`px-4 py-3 text-right font-mono font-bold ${yuChenTransfer >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{formatCurrency(yuChenTransfer)}</td>
                            </tr>
                            <tr className="bg-slate-50 font-bold border-t-2 border-slate-200">
                              <td className="px-4 py-3 text-slate-800">帳戶價值</td>
                              <td className={`px-4 py-3 text-right font-mono text-[15px] ${yuJunTotal >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>{formatCurrency(yuJunTotal)}</td>
                              <td className={`px-4 py-3 text-right font-mono text-[15px] ${yuChenTotal >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>{formatCurrency(yuChenTotal)}</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                </>
            );
        })()}

         <div className="flex items-center gap-3 pt-4">
           <h2 className="text-xl font-bold text-slate-800">「股票買賣」分析總表</h2>
         </div>
         <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden shrink-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[14px] whitespace-nowrap">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                <tr>
                  <th className="px-4 py-3">帳戶</th>
                  <th className="px-4 py-3 text-right">買賣金額合計</th>
                  <th className="px-4 py-3 text-right">獲利領取合計</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {stockSummaryArray.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-4 py-8 text-center text-slate-400 font-bold">尚無股票買賣紀錄</td>
                  </tr>
                ) : (
                  stockSummaryArray.map(row => (
                    <tr key={row.account} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 font-bold text-slate-700">{row.account}</td>
                      <td className={`px-4 py-3 text-right font-mono font-bold ${row.tradeAmount > 0 ? 'text-emerald-600' : (row.tradeAmount < 0 ? 'text-rose-600' : 'text-slate-700')}`}>
                        {formatCurrency(row.tradeAmount)}
                      </td>
                      <td className={`px-4 py-3 text-right font-mono font-bold text-emerald-600`}>
                        {formatCurrency(Math.abs(row.profitAmount))}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

         <div className="flex items-center gap-3 pt-4">
           <h2 className="text-xl font-bold text-slate-800">「資金調度」分析總表</h2>
         </div>
         <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden shrink-0">
          <div className="flex flex-col">
            {unsettledTransfers.length === 0 ? (
                <div className="px-4 py-8 text-center text-slate-400 font-bold">目前無未抵銷項目</div>
            ) : (
                unsettledTransfers.map(row => (
                    <div key={row.id} className="p-3 border-b border-slate-100 last:border-0 hover:bg-slate-50 flex flex-col gap-1.5 transition-colors">
                        <div className="flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <span className={`px-2 py-0.5 rounded text-xs font-bold text-white shadow-sm ${row.account === '禹君' ? 'bg-[#fed7aa] text-orange-900 border border-orange-200' : 'bg-[#d8b4e2] text-fuchsia-900 border border-fuchsia-200'}`}>
                                    {row.account}
                                </span>
                                <span className="text-[13px] font-bold text-slate-600 font-mono">{row.date}</span>
                            </div>
                            <span className={`font-mono font-bold text-[15px] ${row.amount > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                {formatCurrency(row.amount)}
                            </span>
                        </div>
                        <div className="flex justify-between items-center text-[13px] text-slate-500 px-1">
                            <span className="font-bold flex-shrink-0">{row.category}</span>
                            <span className="truncate max-w-[200px] text-right ml-4 text-slate-400">{row.remarks}</span>
                        </div>
                    </div>
                ))
            )}
          </div>
        </div>

         <div className="flex items-center justify-between pt-4 w-full">
           <h2 className="text-xl font-bold text-slate-800">收入 減 支出 之 餘額分析</h2>
           <div className="flex items-center gap-3 text-[13px] font-bold text-slate-600">
             <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-[#fed7aa]"></div>禹君</div>
             <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-[#d8b4e2]"></div>禹辰</div>
           </div>
         </div>
         <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-3 mt-1 shrink-0 h-[450px]">
           <ResponsiveContainer width="100%" height="100%">
             <BarChart data={data} layout="vertical" margin={{ top: 5, right: 20, left: 5, bottom: 5 }} barGap={2} barCategoryGap="25%">
               <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={true} />
               <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={(val) => Math.round(val/1000) + 'k'} />
               <YAxis dataKey="month" type="category" width={65} tick={{ fontSize: 12, fill: '#475569', fontWeight: 'bold' }} />
               <Tooltip cursor={{fill: '#f8fafc'}} formatter={(value: number) => [formatCurrency(value), '餘額']} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
               <ReferenceLine x={0} stroke="#94a3b8" />
               <Bar dataKey="禹君" fill="#fed7aa" name="禹君" radius={[0, 4, 4, 0]} barSize={12} />
               <Bar dataKey="禹辰" fill="#d8b4e2" name="禹辰" radius={[0, 4, 4, 0]} barSize={12} />
             </BarChart>
           </ResponsiveContainer>
         </div>

      </div>
    );
  };

  const renderAddDataView = () => {
    const categoriesForType = vocabularies.filter(v => v.type === addForm.type && !v.parentId);
    const staticRemarks = vocabularies.filter(v => v.type === '備註' && !v.parentId).map(v => v.word);
    
    const parentVocab = vocabularies.find(v => v.word === addForm.category && v.type === addForm.type && !v.parentId);
    const dynamicRemarks = parentVocab 
      ? vocabularies.filter(v => v.parentId === parentVocab.id).map(v => v.word)
      : [];
    const linkedRemarks = Array.from(new Set([...staticRemarks, ...dynamicRemarks]));

    const getTypeColor = (t: string) => {
      if (addForm.type !== t) return 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100';
      if (t === '收入') return 'bg-blue-600 text-white border-blue-600 shadow-sm';
      if (t === '支出') return 'bg-rose-600 text-white border-rose-600 shadow-sm';
      if (t === '股票') return 'bg-emerald-600 text-white border-emerald-600 shadow-sm';
      if (t === '調度') return 'bg-yellow-500 text-white border-yellow-500 shadow-sm';
      return 'bg-slate-100 text-slate-700 border-slate-200 shadow-sm';
    };

    const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value.replace(/,/g, '');
      if (val === '') {
        setAddForm({...addForm, amount: 0});
        return;
      }
      if (val === '-') {
        setAddForm({...addForm, amount: -0});
        return;
      }
      const num = Number(val);
      if (!isNaN(num)) {
        setAddForm({...addForm, amount: num});
      }
    };

    const isMinusZero = addForm.amount === 0 && 1 / Number(addForm.amount) === -Infinity;
    const displayAmount = isMinusZero ? '-' : (addForm.amount ? addForm.amount.toLocaleString('en-US') : '');


    return (
      <div className="px-3 pt-3 pb-3 max-w-lg mx-auto animate-in fade-in flex flex-col h-full overflow-y-auto">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 w-full p-4 flex flex-col gap-3">
           
           <div>
              <label className="block text-[13px] font-bold text-slate-700 mb-1.5 flex justify-between">選擇帳戶</label>
              <div className="flex gap-2">
                 {(['禹君', '禹辰'] as BankAccount[]).map(acc => (
                  <button
                    key={acc}
                    onClick={() => setAddForm({...addForm, account: acc})}
                    className={`flex-1 py-2.5 rounded-xl font-bold border transition-all text-[14px] shadow-sm ${addForm.account === acc ? 'bg-[#408f61] text-white border-[#408f61] ring-2 ring-[#408f61]/20' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
                  >
                    {acc}
                  </button>
                ))}
              </div>
           </div>

           <div>
              <label className="block text-[13px] font-bold text-slate-700 mb-1.5">收支類型</label>
              <div className="flex gap-2">
                {(['收入', '支出', '股票', '調度'] as BankTransactionType[]).map(t => (
                  <button
                    key={t}
                    onClick={() => setAddForm({...addForm, type: t, category: ''})}
                    className={`flex-1 py-2.5 rounded-xl font-bold border transition-all duration-200 text-[14px] shadow-sm ${getTypeColor(t)}`}
                  >
                    {t}
                  </button>
                ))}
              </div>
           </div>

           <div>
              <label className="block text-[13px] font-bold text-slate-700 mb-1.5">日期</label>
              <input type="date" className="w-[200px] max-w-full h-[42px] border border-slate-200 rounded-xl px-3 font-bold text-slate-800 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-[#408f61] focus:border-transparent outline-none transition-colors" value={addForm.date} onChange={e => setAddForm({...addForm, date: e.target.value})} />
           </div>

           <div>
              <label className="block text-[13px] font-bold text-slate-700 mb-1.5">項目名稱</label>
              <select className="w-full h-[42px] border border-slate-200 rounded-xl px-3 font-bold text-slate-800 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-[#408f61] focus:border-transparent outline-none transition-colors" value={addForm.category} onChange={e => setAddForm({...addForm, category: e.target.value})}>
                <option value="" disabled>請選擇項目...</option>
                {categoriesForType.map(v => (
                  <option key={v.id} value={v.word}>{v.word}</option>
                ))}
              </select>
           </div>

           <div>
              <label className="block text-[13px] font-bold text-slate-700 mb-1.5">金額</label>
              <input type="text" placeholder="0" className="w-full h-[42px] border border-slate-200 rounded-xl px-3 font-mono font-bold text-lg text-slate-800 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-[#408f61] focus:border-transparent outline-none transition-colors" value={displayAmount} onChange={handleAmountChange} />
           </div>

           <div className="relative">
              <label className="block text-[13px] font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                 <span>備註說明</span>
                 <span className="text-xs text-slate-400 font-normal">可下拉選擇或自行輸入</span>
              </label>
              <div className="relative group">
                 <input 
                   type="text" 
                   list="remarks-options"
                   placeholder="選填備註..." 
                   className="w-full h-[42px] border border-slate-200 rounded-xl px-3 font-bold text-slate-800 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-[#408f61] focus:border-transparent outline-none transition-colors border-dashed hover:border-solid hover:border-[#408f61]/40" 
                   value={addForm.remarks} 
                   onChange={e => setAddForm({...addForm, remarks: e.target.value})} 
                 />
                 <datalist id="remarks-options">
                    {linkedRemarks.map(rm => (
                       <option key={rm} value={rm} />
                    ))}
                 </datalist>
                 <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none opacity-50 group-hover:opacity-100 transition-opacity" size={18} />
              </div>
           </div>

           <div className="pt-2 pb-2">
              <button 
                onClick={() => setShowSaveConfirm(true)}
                disabled={!addForm.category || !addForm.amount}
                className={`w-full font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-md hover:shadow-lg text-[15px] ${(!addForm.category || !addForm.amount) ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none' : saveSuccess ? 'bg-emerald-500 text-white' : 'bg-[#408f61] hover:bg-[#347a51] text-white'}`}
              >
                {saveSuccess ? <span>已儲存！</span> : <><Save size={20} /> 確定儲存</>}
              </button>
           </div>

        </div>
      </div>
    );
  };

  const renderVocabView = () => {
    const mainVocabs = [...vocabularies].filter(v => v.type === vocabTab && !v.parentId).sort((a,b) => a.word.localeCompare(b.word));
    const selectedParent = mainVocabs.find(v => v.id === selectedParentId);
    const subVocabs = selectedParent ? [...vocabularies].filter(v => v.parentId === selectedParentId).sort((a,b) => a.word.localeCompare(b.word)) : [];

    const handleAddMain = async () => {
        if (!newWord.trim()) return;
        const newVocab: BankVocabulary = { id: generateUUID(), type: vocabTab, word: newWord.trim() };
        try {
           await setDoc(doc(db, 'vocabularies', newVocab.id), newVocab);
        } catch (e) {
           console.error("error adding", e);
        }
        setNewWord('');
    };

    const handleDeleteMain = async (id: string) => {
        try {
            const batch = writeBatch(db);
            batch.delete(doc(db, 'vocabularies', id));
            // delete all sub remarks of this parent
            const subItems = vocabularies.filter(v => v.parentId === id);
            subItems.forEach(v => {
                batch.delete(doc(db, 'vocabularies', v.id));
            });
            await batch.commit();
        } catch (e) {
            console.error("error deleting main", e);
        }
        if (selectedParentId === id) setSelectedParentId(null);
    };

    const handleAddSub = async () => {
        if (!newSubWord.trim() || !selectedParentId) return;
        const newVocab: BankVocabulary = { id: generateUUID(), type: '備註', word: newSubWord.trim(), parentId: selectedParentId };
        try {
            await setDoc(doc(db, 'vocabularies', newVocab.id), newVocab);
        } catch (e) {
            console.error("error adding sub", e);
        }
        setNewSubWord('');
    };

    const handleDeleteSub = async (id: string) => {
        try {
            await deleteDoc(doc(db, 'vocabularies', id));
        } catch (e) {
            console.error("error deleting sub", e);
        }
    };

    return (
      <div className="p-4 max-w-lg mx-auto animate-in fade-in flex flex-col h-full overflow-hidden pb-4 relative">
        {deleteConfirm && (
          <div className="absolute inset-0 z-50 bg-slate-900/40 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-lg p-5 w-full max-w-xs animate-in zoom-in-95">
              <h3 className="text-lg font-bold text-slate-800 mb-2">確定刪除項目？</h3>
              <p className="text-slate-600 mb-5 text-sm">您即將刪除「<span className="font-bold text-rose-600">{deleteConfirm.word}</span>」，此操作無法復原。</p>
              <div className="flex gap-2 justify-end">
                <button type="button" onClick={() => setDeleteConfirm(null)} className="px-4 py-2 text-sm font-bold text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors">取消</button>
                <button type="button" onClick={() => {
                    if (deleteConfirm.type === 'main') {
                        handleDeleteMain(deleteConfirm.id);
                    } else {
                        handleDeleteSub(deleteConfirm.id);
                    }
                    setDeleteConfirm(null);
                }} className="px-4 py-2 text-sm font-bold text-white bg-rose-600 rounded-lg hover:bg-rose-700 transition-colors shadow-sm">確定刪除</button>
              </div>
            </div>
          </div>
        )}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 w-full p-4 md:p-6 flex flex-col h-full space-y-4">
           
           {/* Top Tabs */}
           <div className="flex gap-2 shrink-0 p-1">
              <button type="button" onClick={() => {setVocabTab('收入'); setSelectedParentId(null);}} className={`flex-1 py-1.5 rounded-xl font-bold text-[14px] transition-all border ${vocabTab === '收入' ? 'bg-blue-600 text-white border-blue-600 shadow-md scale-[1.02]' : 'bg-white text-blue-500 border-slate-200 hover:bg-blue-50 hover:border-blue-300'}`}>收入</button>
              <button type="button" onClick={() => {setVocabTab('支出'); setSelectedParentId(null);}} className={`flex-1 py-1.5 rounded-xl font-bold text-[14px] transition-all border ${vocabTab === '支出' ? 'bg-rose-600 text-white border-rose-600 shadow-md scale-[1.02]' : 'bg-white text-rose-500 border-slate-200 hover:bg-rose-50 hover:border-rose-300'}`}>支出</button>
              <button type="button" onClick={() => {setVocabTab('股票'); setSelectedParentId(null);}} className={`flex-1 py-1.5 rounded-xl font-bold text-[14px] transition-all border ${vocabTab === '股票' ? 'bg-emerald-600 text-white border-emerald-600 shadow-md scale-[1.02]' : 'bg-white text-emerald-500 border-slate-200 hover:bg-emerald-50 hover:border-emerald-300'}`}>股票</button>
              <button type="button" onClick={() => {setVocabTab('調度'); setSelectedParentId(null);}} className={`flex-1 py-1.5 rounded-xl font-bold text-[14px] transition-all border ${vocabTab === '調度' ? 'bg-yellow-500 text-white border-yellow-500 shadow-md scale-[1.02]' : 'bg-white text-yellow-500 border-slate-200 hover:bg-yellow-50 hover:border-yellow-300'}`}>調度</button>
           </div>
           
           {/* Add Main Vocab */}
           <div className="flex gap-2 shrink-0 items-center">
             <input value={newWord} onChange={e=>setNewWord(e.target.value)} placeholder={`新增${vocabTab}項目...`} className={`flex-1 min-w-0 border-b-2 px-2 py-2 font-bold text-slate-800 bg-transparent outline-none text-base transition-colors ${vocabTab === '收入' ? 'focus:border-blue-500 border-slate-200' : vocabTab === '支出' ? 'focus:border-rose-500 border-slate-200' : vocabTab === '股票' ? 'focus:border-emerald-500 border-slate-200' : 'focus:border-yellow-500 border-slate-200'}`} />
             <button type="button" onClick={handleAddMain} className={`px-4 py-2 font-bold flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap shrink-0 text-sm rounded-lg active:scale-95 text-white shadow-sm ${vocabTab === '收入' ? 'bg-blue-600 hover:bg-blue-700' : vocabTab === '支出' ? 'bg-rose-600 hover:bg-rose-700' : vocabTab === '股票' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-yellow-500 hover:bg-yellow-600'}`}>
                <Plus size={18} /> 新增
             </button>
           </div>

           {/* Main Vocab List */}
           <div className="max-h-[140px] shrink-0 overflow-y-auto content-start py-1">
              <div className="flex flex-wrap gap-2 items-start">
                 {mainVocabs.map(v => (
                    <div key={v.id} onClick={() => setSelectedParentId(v.id)} className={`flex items-center gap-1 px-3 py-1.5 rounded-full cursor-pointer font-bold text-sm transition-all border shadow-sm ${selectedParentId === v.id ? 
                       (vocabTab === '收入' ? 'bg-blue-600 text-white border-blue-600' : vocabTab === '支出' ? 'bg-rose-600 text-white border-rose-600' : vocabTab === '股票' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-yellow-500 text-white border-yellow-500') 
                       : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50'}`}>
                       {v.word}
                       <button type="button" onClick={(e) => { e.stopPropagation(); e.preventDefault(); setDeleteConfirm({id: v.id, type: 'main', word: v.word}); }} className={`p-0.5 rounded-full transition-colors ml-1 ${selectedParentId === v.id ? 
                          'hover:bg-white/20 text-white' 
                          : 'text-slate-400 hover:bg-slate-200 hover:text-rose-500'}`}>
                          <X size={14} />
                       </button>
                    </div>
                 ))}
                 {mainVocabs.length === 0 && <span className="text-slate-400 text-sm font-medium w-full text-center py-4">目前無項目</span>}
              </div>
           </div>

           {/* Sub Vocab Section */}
           {selectedParent && (
              <div className={`border-t border-slate-100 pt-4 flex-1 min-h-[220px] flex flex-col gap-3 animate-in fade-in slide-in-from-bottom-2`}>
                 <div className="flex items-center justify-between gap-2 shrink-0">
                    <span className="font-bold text-slate-800 text-[15px] ml-1">{selectedParent.word} - 專屬備註</span>
                    <button type="button" onClick={handleAddSub} className={`px-4 py-1.5 rounded-lg font-bold text-sm flex items-center justify-center transition-all active:scale-95 whitespace-nowrap shadow-sm ${vocabTab === '收入' ? 'bg-blue-600 text-white hover:bg-blue-700' : vocabTab === '支出' ? 'bg-rose-600 text-white hover:bg-rose-700' : vocabTab === '股票' ? 'bg-emerald-600 text-white hover:bg-emerald-700' : 'bg-yellow-500 text-white hover:bg-yellow-600'}`}>
                        新增備註
                    </button>
                 </div>
                 
                 <div className="shrink-0">
                   <input value={newSubWord} onChange={e=>setNewSubWord(e.target.value)} placeholder="追加備註...輸入區" className={`w-full border rounded-lg px-3 py-2 text-sm font-bold text-slate-800 bg-slate-50 focus:bg-white focus:ring-2 focus:border-transparent outline-none placeholder:text-slate-400 transition-colors shadow-sm ${vocabTab === '收入' ? 'focus:ring-blue-500 border-slate-200' : vocabTab === '支出' ? 'focus:ring-rose-500 border-slate-200' : vocabTab === '股票' ? 'focus:ring-emerald-500 border-slate-200' : 'focus:ring-yellow-500 border-slate-200'}`} />
                 </div>

                 <div className="flex-1 min-h-[120px] overflow-y-auto bg-slate-50 rounded-xl p-3 flex flex-wrap gap-2 items-start content-start border border-slate-100 shadow-inner">
                    {subVocabs.length > 0 ? subVocabs.map(v => (
                        <div key={v.id} className="flex items-center gap-1 bg-white border border-slate-200 text-slate-700 rounded-lg px-3 py-1.5 text-sm font-bold shadow-sm">
                           {v.word}
                           <button type="button" onClick={(e) => { e.stopPropagation(); e.preventDefault(); setDeleteConfirm({id: v.id, type: 'sub', word: v.word}); }} className="text-slate-400 hover:text-rose-500 rounded p-[1px] ml-1 transition-colors">
                             <X size={14} />
                           </button>
                        </div>
                    )) : (
                        <div className="w-full text-center py-4 text-slate-400 text-sm font-medium">
                           目前無備註
                        </div>
                    )}
                 </div>
              </div>
           )}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-screen bg-[#f8f9fa] overflow-hidden font-sans relative">
      {/* Save Confirm Modal */}
      {showSaveConfirm && (
          <div className="absolute inset-0 z-50 bg-slate-900/40 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-lg p-5 w-full max-w-xs animate-in zoom-in-95">
              <div className="flex gap-3 items-center mb-2">
                 <AlertCircle className="text-blue-500" size={24} />
                 <h3 className="text-lg font-bold text-slate-800">確定儲存此筆資料？</h3>
              </div>
              <div className="text-slate-600 mb-5 text-[15px] bg-slate-50 p-3 rounded-lg border border-slate-100">
                <div className="flex justify-between mb-1"><span className="text-slate-500 text-sm">項目名稱</span><span className="font-bold">{addForm.category}</span></div>
                <div className="flex justify-between mb-1"><span className="text-slate-500 text-sm">收支類型</span><span className="font-bold">{addForm.type}</span></div>
                <div className="flex justify-between"><span className="text-slate-500 text-sm">金額</span><span className="font-mono font-bold">{formatCurrency(addForm.amount || 0)}</span></div>
              </div>
              <div className="flex gap-2 justify-end">
                <button type="button" onClick={() => setShowSaveConfirm(false)} className="px-4 py-2 text-sm font-bold text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors">取消</button>
                <button type="button" onClick={handleSaveTransaction} className="px-4 py-2 text-sm font-bold text-white bg-[#408f61] rounded-lg hover:bg-[#347a51] transition-colors shadow-sm">確定儲存</button>
              </div>
            </div>
          </div>
      )}

      {/* Delete Transaction Confirm Modal */}
      {txToDelete && (
          <div className="absolute inset-0 z-50 bg-slate-900/40 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-lg p-5 w-full max-w-xs animate-in zoom-in-95">
              <div className="flex gap-3 items-center mb-2">
                 <Trash2 className="text-rose-500" size={24} />
                 <h3 className="text-lg font-bold text-slate-800">確定刪除此紀錄？</h3>
              </div>
              <p className="text-slate-600 mb-5 text-[15px]">刪除「<strong className="text-slate-800">{txToDelete.category}</strong>」金額 {formatCurrency(txToDelete.amount)}？一旦刪除，資料將無法復原。</p>
              <div className="flex gap-2 justify-end">
                <button type="button" onClick={() => setTxToDelete(null)} className="px-4 py-2 text-sm font-bold text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors">取消</button>
                <button type="button" onClick={handleDeleteTx} className="px-4 py-2 text-sm font-bold text-white bg-rose-600 rounded-lg hover:bg-rose-700 transition-colors shadow-sm">確定刪除</button>
              </div>
            </div>
          </div>
      )}

      <div className="flex-1 overflow-hidden w-full relative">
        {view === 'summary' && <div className="absolute inset-0 overflow-y-auto">{renderSummaryView()}</div>}
        {view === 'monthly' && <div className="absolute inset-0 overflow-y-auto bg-slate-200">{renderMonthlyView()}</div>}
        {view === 'analysis' && <div className="absolute inset-0 overflow-y-auto">{renderAnalysisView()}</div>}
        {view === 'add' && <div className="absolute inset-0 overflow-hidden">{renderAddDataView()}</div>}
        {view === 'vocab' && <div className="absolute inset-0 overflow-hidden">{renderVocabView()}</div>}
      </div>
      {renderNav()}
    </div>
  );
};

export default BankSystem;
