import React, { useState, useEffect } from 'react';
import { Home, List, CalendarDays, Plus, BookType, ChevronDown, ChevronRight, X, Save } from 'lucide-react';
import { collection, onSnapshot, setDoc, deleteDoc, doc, writeBatch } from 'firebase/firestore';
import { db } from '../firebase';
import { BankTransaction, BankVocabulary, BankAccount, BankTransactionType } from '../types';
import { INITIAL_BANK_VOCABULARY } from '../constants';
import { formatCurrency, generateUUID } from '../utils';

type BankView = 'summary' | 'monthly' | 'add' | 'vocab';

interface Props {
  onNavigateHome: () => void;
}

const BankSystem: React.FC<Props> = ({ onNavigateHome }) => {
  const [view, setView] = useState<BankView>('add');
  const [vocabularies, setVocabularies] = useState<BankVocabulary[]>(INITIAL_BANK_VOCABULARY);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'vocabularies'), async (snapshot) => {
      const data = snapshot.docs.map(d => d.data() as BankVocabulary);
      if (data.length > 0) {
        setVocabularies(data);
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

  const [activeAccount, setActiveAccount] = useState<BankAccount>('禹君');
  const [selectedMonth, setSelectedMonth] = useState<string>('2026-06');

  // Add Data Form State
  const [addForm, setAddForm] = useState<Partial<BankTransaction>>({
    account: '禹君',
    type: '收入',
    date: new Date().toISOString().split('T')[0],
    category: '',
    amount: 0,
    remarks: ''
  });

  const renderNav = () => (
    <div className="bg-[#275b3b] flex shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] overflow-x-auto shrink-0 z-50">
      {[
        { id: 'summary', label: '總表', icon: List },
        { id: 'monthly', label: '月份', icon: CalendarDays },
        { id: 'add', label: '新增', icon: Plus },
        { id: 'vocab', label: '詞庫', icon: BookType },
      ].map(nav => (
        <button
          key={nav.id}
          onClick={() => setView(nav.id as BankView)}
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

  const AccountTabs = () => (
    <div className="flex gap-2">
      {(['禹君', '禹辰'] as BankAccount[]).map(acc => (
        <button
          key={acc}
          onClick={() => setActiveAccount(acc)}
          className={`flex-1 py-3 rounded-lg font-bold border transition-colors ${activeAccount === acc ? 'bg-[#408f61] text-white border-[#408f61] shadow-sm' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
        >
          {acc}
        </button>
      ))}
    </div>
  );

  const SubTable = ({ title, borderColor, valueColor }: { title: string, borderColor: string, valueColor: string }) => {
    const [isOpen, setIsOpen] = useState(false);
    const total = 0; 
    
    return (
      <div className={`bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-4 border-l-4 ${borderColor}`}>
        <div 
          className="p-4 flex justify-between items-center cursor-pointer hover:bg-slate-50 transition-colors"
          onClick={() => setIsOpen(!isOpen)}
        >
          <div className="flex items-center gap-3">
             {isOpen ? <ChevronDown className="text-slate-400" size={20} /> : <ChevronRight className="text-slate-400" size={20} />}
             <span className="font-bold text-lg text-slate-700 flex items-center gap-2">{title} <span className="bg-slate-100 text-slate-500 text-xs px-2 py-0.5 rounded-md font-mono">(0)</span></span>
          </div>
          <span className={`font-mono font-bold text-xl ${valueColor}`}>{formatCurrency(total)}</span>
        </div>
        
        {isOpen && (
          <div className="border-t border-slate-100 bg-slate-50 p-4">
             <table className="w-full text-left text-sm text-slate-600">
               <thead className="text-slate-500 bg-slate-200/70">
                 <tr>
                    <th className="px-3 py-2 font-bold rounded-l-md w-24">日期</th>
                    <th className="px-3 py-2 font-bold">項目</th>
                    <th className="px-3 py-2 font-bold text-right">金額</th>
                    <th className="px-3 py-2 font-bold rounded-r-md">備註</th>
                 </tr>
               </thead>
               <tbody>
                  <tr>
                    <td colSpan={4} className="text-center py-6 text-slate-400 italic font-medium">尚無資料</td>
                  </tr>
               </tbody>
             </table>
          </div>
        )}
      </div>
    );
  };

  const SummaryView = () => (
    <div className="p-4 max-w-lg mx-auto animate-in fade-in space-y-4">
      <div className="flex items-center gap-3 pt-2">
         <h2 className="text-2xl font-bold text-slate-800">本月分析</h2>
         <span className="bg-slate-200 text-slate-600 px-3 py-1 rounded-lg text-sm font-bold shadow-inner">2026-06</span>
      </div>

      <AccountTabs />
      
      <div className="grid grid-cols-2 gap-3 pb-2">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 border-l-4 border-l-blue-500">
           <div className="text-slate-400 font-bold mb-1 text-sm">上月結餘</div>
           <div className="text-xl font-mono font-bold text-slate-800">{formatCurrency(0)}</div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 border-l-4 border-l-emerald-500">
           <div className="text-slate-400 font-bold mb-1 text-sm">本月結餘</div>
           <div className="text-xl font-mono font-bold text-emerald-500">{formatCurrency(0)}</div>
        </div>
      </div>

      <SubTable title="本月收入" borderColor="border-blue-500" valueColor="text-blue-600" />
      <SubTable title="本月支出" borderColor="border-rose-500" valueColor="text-rose-600" />
      <SubTable title="股票買賣" borderColor="border-emerald-500" valueColor="text-emerald-600" />
    </div>
  );

  const MonthlyView = () => (
    <div className="p-4 max-w-lg mx-auto animate-in fade-in space-y-4">
      <div className="flex items-center justify-between pt-2">
         <h2 className="text-2xl font-bold text-slate-800">月份明細</h2>
         <div className="flex items-center gap-2">
            <span className="text-slate-500 text-sm font-bold">選擇月份</span>
            <select 
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="border border-slate-300 rounded-lg px-3 py-1.5 font-bold text-slate-800 bg-white focus:ring-2 focus:ring-[#408f61]"
            >
               <option value="2026-06">2026-06</option>
               <option value="2026-05">2026-05</option>
               <option value="2026-04">2026-04</option>
               <option value="2026-03">2026-03</option>
            </select>
         </div>
      </div>

      <AccountTabs />
      
      <div className="grid grid-cols-2 gap-3 pb-2">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 border-l-4 border-l-blue-500">
           <div className="text-slate-400 font-bold mb-1 text-sm">上月結餘</div>
           <div className="text-xl font-mono font-bold text-slate-800">{formatCurrency(0)}</div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 border-l-4 border-l-emerald-500">
           <div className="text-slate-400 font-bold mb-1 text-sm">本月結餘</div>
           <div className="text-xl font-mono font-bold text-emerald-500">{formatCurrency(0)}</div>
        </div>
      </div>

      <SubTable title="本月收入" borderColor="border-blue-500" valueColor="text-blue-600" />
      <SubTable title="本月支出" borderColor="border-rose-500" valueColor="text-rose-600" />
      <SubTable title="股票買賣" borderColor="border-emerald-500" valueColor="text-emerald-600" />
    </div>
  );

  const AddDataView = () => {
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
      return 'bg-slate-100 text-slate-700 border-slate-200 shadow-sm';
    };

    return (
      <div className="px-2 pt-2 pb-0 max-w-lg mx-auto animate-in fade-in flex flex-col h-full overflow-hidden">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 w-full p-4 flex flex-col justify-between h-full">
           
           <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex justify-between">選擇帳戶</label>
              <div className="flex gap-2">
                {(['禹君', '禹辰'] as BankAccount[]).map(acc => (
                  <button
                    key={acc}
                    onClick={() => setAddForm({...addForm, account: acc})}
                    className={`flex-1 py-2.5 rounded-lg font-bold border transition-all text-sm ${addForm.account === acc ? 'bg-[#408f61] text-white border-[#408f61] shadow-sm' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
                  >
                    {acc}
                  </button>
                ))}
              </div>
           </div>

           <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">收支類型</label>
              <div className="flex gap-2">
                {(['收入', '支出', '股票'] as BankTransactionType[]).map(t => (
                  <button
                    key={t}
                    onClick={() => setAddForm({...addForm, type: t, category: ''})}
                    className={`flex-1 py-2.5 rounded-lg font-bold border transition-all duration-200 text-sm ${getTypeColor(t)}`}
                  >
                    {t}
                  </button>
                ))}
              </div>
           </div>

           <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">日期</label>
              <input type="date" className="w-full border border-slate-300 rounded-lg px-3 py-2.5 font-bold text-slate-800 bg-white focus:ring-1 focus:ring-[#408f61] focus:border-transparent outline-none text-sm" value={addForm.date} onChange={e => setAddForm({...addForm, date: e.target.value})} />
           </div>

           <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">項目名稱</label>
              <select className="w-full border border-slate-300 rounded-lg px-3 py-2.5 font-bold text-slate-800 bg-white focus:ring-1 focus:ring-[#408f61] focus:border-transparent outline-none text-sm" value={addForm.category} onChange={e => setAddForm({...addForm, category: e.target.value})}>
                <option value="" disabled>請選擇項目...</option>
                {categoriesForType.map(v => (
                  <option key={v.id} value={v.word}>{v.word}</option>
                ))}
              </select>
           </div>

           <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">金額</label>
              <input type="number" placeholder="0" className="w-full border border-slate-300 rounded-lg px-3 py-2.5 font-mono font-bold text-slate-800 bg-white focus:ring-1 focus:ring-[#408f61] focus:border-transparent outline-none text-sm" value={addForm.amount || ''} onChange={e => setAddForm({...addForm, amount: Number(e.target.value)})} />
           </div>

           <div className="flex-1 flex flex-col min-h-0">
              <label className="block text-xs font-bold text-slate-700 mb-1">備註說明 <span className="text-slate-400 font-normal">(可自行輸入或由詞庫選擇)</span></label>
              <input type="text" placeholder="選填備註" className="w-full border border-slate-300 rounded-lg px-3 py-2.5 font-bold text-slate-800 bg-white focus:ring-1 focus:ring-[#408f61] focus:border-transparent outline-none mb-1 text-sm shrink-0" value={addForm.remarks} onChange={e => setAddForm({...addForm, remarks: e.target.value})} />
              
              <div className="flex-[1] overflow-y-auto w-full">
                  {linkedRemarks.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 bg-slate-50/50 p-2 rounded-lg border border-slate-100 content-start">
                      {linkedRemarks.map(rm => (
                        <button key={rm} onClick={() => setAddForm(prev => ({...prev, remarks: prev.remarks ? `${prev.remarks} ${rm}` : rm}))} className="bg-white hover:bg-slate-50 text-slate-700 px-2 py-1 rounded text-xs font-bold transition-colors shadow-sm border border-slate-200 truncate max-w-full">
                          + {rm}
                        </button>
                      ))}
                    </div>
                  )}
              </div>
           </div>

           <div className="pt-2 shrink-0">
              <button className="w-full bg-[#408f61] hover:bg-[#347a51] text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-md hover:shadow-lg text-base">
                <Save size={20} /> 確定儲存
              </button>
           </div>

        </div>
      </div>
    );
  };

  const VocabView = () => {
    const [vocabTab, setVocabTab] = useState<BankTransactionType>('收入');
    const [newWord, setNewWord] = useState('');
    const [selectedParentId, setSelectedParentId] = useState<string | null>(null);
    const [newSubWord, setNewSubWord] = useState('');
    const [deleteConfirm, setDeleteConfirm] = useState<{id: string, type: 'main' | 'sub', word: string} | null>(null);

    const mainVocabs = vocabularies.filter(v => v.type === vocabTab && !v.parentId);
    const selectedParent = mainVocabs.find(v => v.id === selectedParentId);
    const subVocabs = selectedParent ? vocabularies.filter(v => v.parentId === selectedParentId) : [];

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
           <div className="flex gap-2 shrink-0 bg-slate-100 p-1.5 rounded-xl">
              <button type="button" onClick={() => {setVocabTab('收入'); setSelectedParentId(null);}} className={`flex-1 py-2 rounded-lg font-bold text-sm transition-all shadow-sm ${vocabTab === '收入' ? 'bg-white text-blue-600 ring-2 ring-blue-600/20' : 'text-blue-500 hover:bg-blue-50'}`}>收入</button>
              <button type="button" onClick={() => {setVocabTab('支出'); setSelectedParentId(null);}} className={`flex-1 py-2 rounded-lg font-bold text-sm transition-all shadow-sm ${vocabTab === '支出' ? 'bg-white text-rose-600 ring-2 ring-rose-600/20' : 'text-rose-500 hover:bg-rose-50'}`}>支出</button>
              <button type="button" onClick={() => {setVocabTab('股票'); setSelectedParentId(null);}} className={`flex-1 py-2 rounded-lg font-bold text-sm transition-all shadow-sm ${vocabTab === '股票' ? 'bg-white text-emerald-600 ring-2 ring-emerald-600/20' : 'text-emerald-500 hover:bg-emerald-50'}`}>股票</button>
           </div>
           
           {/* Add Main Vocab */}
           <div className="flex gap-2 shrink-0 items-center">
             <input value={newWord} onChange={e=>setNewWord(e.target.value)} placeholder={`新增${vocabTab}項目...`} className={`flex-1 border-b-2 px-2 py-2 font-bold text-slate-800 bg-transparent outline-none text-base transition-colors ${vocabTab === '收入' ? 'focus:border-blue-500 border-slate-200' : vocabTab === '支出' ? 'focus:border-rose-500 border-slate-200' : 'focus:border-emerald-500 border-slate-200'}`} />
             <button type="button" onClick={handleAddMain} className={`px-4 py-2 font-bold flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap text-sm rounded-lg active:scale-95 ${vocabTab === '收入' ? 'text-blue-600 hover:bg-blue-50' : vocabTab === '支出' ? 'text-rose-600 hover:bg-rose-50' : 'text-emerald-600 hover:bg-emerald-50'}`}>
                <Plus size={18} /> 新增
             </button>
           </div>

           {/* Main Vocab List */}
           <div className="flex-1 overflow-y-auto content-start py-1">
              <div className="flex flex-wrap gap-2 items-start">
                 {mainVocabs.map(v => (
                    <div key={v.id} onClick={() => setSelectedParentId(v.id)} className={`flex items-center gap-1 px-3 py-1.5 rounded-full cursor-pointer font-bold text-sm transition-all border shadow-sm ${selectedParentId === v.id ? 
                       (vocabTab === '收入' ? 'bg-blue-600 text-white border-blue-600' : vocabTab === '支出' ? 'bg-rose-600 text-white border-rose-600' : 'bg-emerald-600 text-white border-emerald-600') 
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
              <div className={`border-t border-slate-100 pt-4 shrink-0 flex flex-col gap-3 animate-in fade-in slide-in-from-bottom-2`}>
                 <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-slate-800 text-[15px] ml-1">{selectedParent.word} - 專屬備註</span>
                    <button type="button" onClick={handleAddSub} className={`px-4 py-1.5 rounded-lg font-bold text-sm flex items-center justify-center transition-all active:scale-95 whitespace-nowrap shadow-sm ${vocabTab === '收入' ? 'bg-blue-600 text-white hover:bg-blue-700' : vocabTab === '支出' ? 'bg-rose-600 text-white hover:bg-rose-700' : 'bg-emerald-600 text-white hover:bg-emerald-700'}`}>
                        新增備註
                    </button>
                 </div>
                 
                 <div>
                   <input value={newSubWord} onChange={e=>setNewSubWord(e.target.value)} placeholder="追加備註...輸入區" className={`w-full border rounded-lg px-3 py-2 text-sm font-bold text-slate-800 bg-slate-50 focus:bg-white focus:ring-2 focus:border-transparent outline-none placeholder:text-slate-400 transition-colors shadow-sm ${vocabTab === '收入' ? 'focus:ring-blue-500 border-slate-200' : vocabTab === '支出' ? 'focus:ring-rose-500 border-slate-200' : 'focus:ring-emerald-500 border-slate-200'}`} />
                 </div>

                 <div className="h-[120px] overflow-y-auto bg-slate-50 rounded-xl p-3 flex flex-wrap gap-2 items-start content-start border border-slate-100 shadow-inner">
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
    <div className="flex flex-col h-screen bg-[#f8f9fa] overflow-hidden font-sans">
      <div className="flex-1 overflow-hidden w-full relative">
        {view === 'summary' && <div className="absolute inset-0 overflow-y-auto"><SummaryView /></div>}
        {view === 'monthly' && <div className="absolute inset-0 overflow-y-auto"><MonthlyView /></div>}
        {view === 'add' && <div className="absolute inset-0 overflow-hidden"><AddDataView /></div>}
        {view === 'vocab' && <div className="absolute inset-0 overflow-hidden"><VocabView /></div>}
      </div>
      {renderNav()}
    </div>
  );
};

export default BankSystem;
