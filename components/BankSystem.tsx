import React, { useState } from 'react';
import { Home, List, CalendarDays, Plus, BookType, ChevronDown, ChevronRight, X, Save } from 'lucide-react';
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

    const mainVocabs = vocabularies.filter(v => v.type === vocabTab && !v.parentId);
    const selectedParent = mainVocabs.find(v => v.id === selectedParentId);
    const subVocabs = selectedParent ? vocabularies.filter(v => v.parentId === selectedParentId) : [];

    const handleAddMain = () => {
        if (!newWord.trim()) return;
        const newVocab: BankVocabulary = { id: generateUUID(), type: vocabTab, word: newWord.trim() };
        setVocabularies([...vocabularies, newVocab]);
        setNewWord('');
    };

    const handleDeleteMain = (id: string) => {
        setVocabularies(vocabularies.filter(v => v.id !== id && v.parentId !== id));
        if (selectedParentId === id) setSelectedParentId(null);
    };

    const handleAddSub = () => {
        if (!newSubWord.trim() || !selectedParentId) return;
        const newVocab: BankVocabulary = { id: generateUUID(), type: '備註', word: newSubWord.trim(), parentId: selectedParentId };
        setVocabularies([...vocabularies, newVocab]);
        setNewSubWord('');
    };

    const handleDeleteSub = (id: string) => {
        setVocabularies(vocabularies.filter(v => v.id !== id));
    };

    return (
      <div className="p-4 max-w-lg mx-auto animate-in fade-in h-full flex flex-col">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 space-y-5 flex-1 flex flex-col min-h-0">
           
           <div className="flex gap-2 shrink-0">
              <button onClick={() => {setVocabTab('收入'); setSelectedParentId(null);}} className={`flex-1 py-3 rounded-lg font-bold border transition-colors ${vocabTab === '收入' ? 'bg-blue-600 text-white border-blue-600 shadow-sm' : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'}`}>收入項目</button>
              <button onClick={() => {setVocabTab('支出'); setSelectedParentId(null);}} className={`flex-1 py-3 rounded-lg font-bold border transition-colors ${vocabTab === '支出' ? 'bg-rose-600 text-white border-rose-600 shadow-sm' : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'}`}>支出項目</button>
              <button onClick={() => {setVocabTab('股票'); setSelectedParentId(null);}} className={`flex-1 py-3 rounded-lg font-bold border transition-colors ${vocabTab === '股票' ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm' : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'}`}>股票項目</button>
           </div>
           
           <div className="flex gap-3 shrink-0">
             <input value={newWord} onChange={e=>setNewWord(e.target.value)} placeholder="如: 外送費、加班津貼" className={`flex-1 border border-slate-300 rounded-xl px-4 py-3 font-medium text-slate-800 bg-white focus:ring-2 focus:border-transparent outline-none focus:ring-opacity-50 ${vocabTab === '收入' ? 'focus:ring-blue-600' : vocabTab === '支出' ? 'focus:ring-rose-600' : 'focus:ring-emerald-600'}`} />
             <button onClick={handleAddMain} className={`text-white px-5 rounded-xl font-bold flex items-center justify-center gap-2 shadow-sm transition-colors active:scale-95 whitespace-nowrap ${vocabTab === '收入' ? 'bg-blue-600 hover:bg-blue-700' : vocabTab === '支出' ? 'bg-rose-600 hover:bg-rose-700' : 'bg-emerald-600 hover:bg-emerald-700'}`}>
                <Plus size={20} /> 新增
             </button>
           </div>

           <div className="flex-1 min-h-[100px] flex flex-col border border-slate-100 rounded-xl relative mt-2 shrink">
              <div className="flex-1 overflow-y-auto p-4 flex flex-wrap gap-2.5 items-start content-start bg-slate-50/50 rounded-xl">
                 {mainVocabs.map(v => (
                    <div key={v.id} onClick={() => setSelectedParentId(v.id)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border cursor-pointer font-bold transition-all shadow-sm ${selectedParentId === v.id ? 
                       (vocabTab === '收入' ? 'bg-blue-50 text-blue-600 border-blue-200 ring-1 ring-blue-300' : vocabTab === '支出' ? 'bg-rose-50 text-rose-600 border-rose-200 ring-1 ring-rose-300' : 'bg-emerald-50 text-emerald-600 border-emerald-200 ring-1 ring-emerald-300') 
                       : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50'}`}>
                       {v.word}
                       <button type="button" onClick={(e) => { e.stopPropagation(); e.preventDefault(); handleDeleteMain(v.id); }} className={`transition-colors rounded p-[1px] ml-1 ${selectedParentId === v.id ? 
                          (vocabTab === '收入' ? 'text-blue-500 hover:bg-blue-100 hover:text-blue-700' : vocabTab === '支出' ? 'text-rose-500 hover:bg-rose-100 hover:text-rose-700' : 'text-emerald-500 hover:bg-emerald-100 hover:text-emerald-700') 
                          : 'text-slate-300 hover:bg-slate-100 hover:text-slate-500'}`}>
                          <X size={14} />
                       </button>
                    </div>
                 ))}
                 {mainVocabs.length === 0 && <span className="text-slate-400 text-sm font-medium w-full text-center py-6">暫無資料</span>}
              </div>
           </div>

           {selectedParent && (
              <div className="border-t border-slate-200 pt-4 shrink-0 animate-in fade-in slide-in-from-bottom-2">
                 <div className="flex items-center mb-3 gap-2">
                    <span className={`font-bold px-3 py-1.5 rounded-lg border text-sm shrink-0 shadow-sm ${vocabTab === '收入' ? 'text-blue-600 bg-blue-50 border-blue-200' : vocabTab === '支出' ? 'text-rose-600 bg-rose-50 border-rose-200' : 'text-emerald-600 bg-emerald-50 border-emerald-200'}`}>{selectedParent.word} - 專屬備註</span>
                    <div className="flex flex-1 gap-2">
                      <input value={newSubWord} onChange={e=>setNewSubWord(e.target.value)} placeholder="追加備註..." className={`flex-1 border rounded-lg px-3 py-1.5 text-sm font-medium text-slate-800 bg-white focus:ring-2 focus:border-transparent outline-none placeholder:text-slate-400 min-w-0 ${vocabTab === '收入' ? 'border-blue-200 focus:ring-blue-600' : vocabTab === '支出' ? 'border-rose-200 focus:ring-rose-600' : 'border-emerald-200 focus:ring-emerald-600'}`} />
                      <button type="button" onClick={handleAddSub} className={`text-white px-3 rounded-lg font-bold text-sm flex items-center justify-center gap-1 shadow-sm transition-colors active:scale-95 whitespace-nowrap ${vocabTab === '收入' ? 'bg-blue-600 hover:bg-blue-700' : vocabTab === '支出' ? 'bg-rose-600 hover:bg-rose-700' : 'bg-emerald-600 hover:bg-emerald-700'}`}>
                          <Plus size={16} /> 新增
                      </button>
                    </div>
                 </div>

                 <div className="h-[120px] overflow-y-auto border border-dashed border-slate-300 rounded-xl p-3 flex flex-wrap gap-2.5 bg-slate-50/50 items-start content-start">
                    {subVocabs.length > 0 ? subVocabs.map(v => (
                        <div key={v.id} className={`flex items-center gap-2 bg-white border px-4 py-1.5 text-sm font-bold shadow-sm hover:shadow transition-shadow ${vocabTab === '收入' ? 'border-blue-200 text-blue-600' : vocabTab === '支出' ? 'border-rose-200 text-rose-600' : 'border-emerald-200 text-emerald-600'}`}>
                           {v.word}
                           <button type="button" onClick={(e) => { e.stopPropagation(); e.preventDefault(); handleDeleteSub(v.id); }} className={`rounded cursor-pointer transition-colors p-[1px] ${vocabTab === '收入' ? 'text-blue-300 bg-blue-50 hover:bg-blue-100 hover:text-blue-600' : vocabTab === '支出' ? 'text-rose-300 bg-rose-50 hover:bg-rose-100 hover:text-rose-600' : 'text-emerald-300 bg-emerald-50 hover:bg-emerald-100 hover:text-emerald-600'}`}>
                             <X size={14} />
                           </button>
                        </div>
                    )) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 text-sm italic font-medium -mt-2">
                           <span className="opacity-60 bg-white px-4 py-2 border border-slate-200 rounded-lg border-dashed">請在此項目的上方輸入框新增備註</span>
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
