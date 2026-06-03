import React, { useState } from 'react';
import { Home, List, CalendarDays, Plus, BookType, ChevronDown, ChevronRight } from 'lucide-react';
import { BankTransaction, BankVocabulary, BankAccount, BankTransactionType } from '../types';
import { INITIAL_BANK_VOCABULARY } from '../constants';
import { formatCurrency } from '../utils';

type BankView = 'summary' | 'monthly' | 'add' | 'vocab';

interface Props {
  onNavigateHome: () => void;
}

const BankSystem: React.FC<Props> = ({ onNavigateHome }) => {
  const [view, setView] = useState<BankView>('summary');
  const [vocabularies] = useState<BankVocabulary[]>(INITIAL_BANK_VOCABULARY);

  const [activeAccount, setActiveAccount] = useState<BankAccount>('禹君');
  const [selectedMonth, setSelectedMonth] = useState<string>('2026-05'); // Dummy for now

  // Add Data Form State
  const [addForm, setAddForm] = useState<Partial<BankTransaction>>({
    account: '禹君',
    type: '支出',
    date: new Date().toISOString().split('T')[0],
    category: '',
    amount: 0,
    remarks: ''
  });

  const renderNav = () => (
    <div className="bg-emerald-900 border-b border-emerald-800 flex overflow-x-auto">
      {[
        { id: 'summary', label: '明細總表', icon: List },
        { id: 'monthly', label: '月份明細', icon: CalendarDays },
        { id: 'add', label: '新增資料', icon: Plus },
        { id: 'vocab', label: '詞庫輸入', icon: BookType },
      ].map(nav => (
        <button
          key={nav.id}
          onClick={() => setView(nav.id as BankView)}
          className={`flex items-center gap-2 px-6 py-4 font-bold transition-colors whitespace-nowrap ${view === nav.id ? 'bg-emerald-800 text-white border-b-4 border-yellow-400' : 'text-emerald-100 hover:bg-emerald-800/50 hover:text-white'}`}
        >
          <nav.icon size={20} />
          {nav.label}
        </button>
      ))}
      <div className="flex-1" />
      <button 
        onClick={onNavigateHome}
        className="flex items-center gap-2 px-6 py-4 font-bold text-emerald-200 hover:text-white hover:bg-emerald-800 transition-colors whitespace-nowrap"
      >
        <Home size={20} />
        返回主選
      </button>
    </div>
  );

  const AccountTabs = () => (
    <div className="flex gap-2 mb-6">
      {(['禹君', '禹辰'] as BankAccount[]).map(acc => (
        <button
          key={acc}
          onClick={() => setActiveAccount(acc)}
          className={`px-8 py-3 rounded-lg font-bold text-lg transition-all ${activeAccount === acc ? 'bg-emerald-600 text-white shadow-md scale-105' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}
        >
          {acc}
        </button>
      ))}
    </div>
  );

  const SubTable = ({ title, type }: { title: string, type: BankTransactionType }) => {
    // We will use type later to filter transactions
    const [isOpen, setIsOpen] = useState(false);
    // Dummy aggregated amount
    const total = 0; 
    
    return (
      <div className={`bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-4 ${type ? '' : ''}`}>
        <div 
          className="p-4 flex justify-between items-center cursor-pointer hover:bg-slate-50 transition-colors"
          onClick={() => setIsOpen(!isOpen)}
        >
          <div className="flex items-center gap-3">
             {isOpen ? <ChevronDown className="text-slate-400" /> : <ChevronRight className="text-slate-400" />}
             <span className="font-bold text-lg text-slate-700">{title}</span>
          </div>
          <span className="font-mono font-bold text-xl text-slate-800">{formatCurrency(total)}</span>
        </div>
        
        {isOpen && (
          <div className="border-t border-slate-100 bg-slate-50 p-4">
             <table className="w-full text-left text-sm text-slate-600">
               <thead className="text-slate-500 uppercase bg-slate-200 overflow-hidden rounded-md">
                 <tr>
                    <th className="px-4 py-2 font-bold rounded-l-md">日期</th>
                    <th className="px-4 py-2 font-bold">項目</th>
                    <th className="px-4 py-2 font-bold text-right">金額</th>
                    <th className="px-4 py-2 font-bold rounded-r-md">備註</th>
                 </tr>
               </thead>
               <tbody>
                  <tr>
                    <td colSpan={4} className="text-center py-8 text-slate-400 italic">目前無資料</td>
                  </tr>
               </tbody>
             </table>
          </div>
        )}
      </div>
    );
  };

  const SummaryView = () => (
    <div className="p-6 max-w-4xl mx-auto animate-in fade-in">
      <AccountTabs />
      
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 border-l-4 border-l-blue-500">
           <div className="text-slate-500 font-bold mb-1">上月結餘</div>
           <div className="text-2xl font-mono font-bold text-slate-800">{formatCurrency(0)}</div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 border-l-4 border-l-emerald-500">
           <div className="text-slate-500 font-bold mb-1">本月結餘</div>
           <div className="text-2xl font-mono font-bold text-emerald-600">{formatCurrency(0)}</div>
        </div>
      </div>

      <SubTable title="本月收入" type="收入" />
      <SubTable title="本月支出" type="支出" />

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 flex justify-between items-center mb-4">
        <span className="font-bold text-lg text-slate-700 ml-9">股票買賣</span>
        <span className="font-mono font-bold text-xl text-slate-800">{formatCurrency(0)}</span>
      </div>
    </div>
  );

  const MonthlyView = () => (
    <div className="p-6 max-w-4xl mx-auto animate-in fade-in">
      <div className="flex items-center gap-4 mb-6">
         <AccountTabs />
         <div className="ml-auto flex items-center gap-2">
            <label className="font-bold text-slate-600">選擇月份</label>
            <select 
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="border border-slate-300 rounded-lg px-4 py-2 font-bold text-lg bg-white"
            >
               {/* Dummy options for now */}
               <option value="2026-06">2026-06</option>
               <option value="2026-05">2026-05</option>
               <option value="2026-04">2026-04</option>
               <option value="2026-03">2026-03</option>
            </select>
         </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 border-l-4 border-l-blue-500">
           <div className="text-slate-500 font-bold mb-1">上月結餘</div>
           <div className="text-2xl font-mono font-bold text-slate-800">{formatCurrency(0)}</div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 border-l-4 border-l-emerald-500">
           <div className="text-slate-500 font-bold mb-1">本月結餘</div>
           <div className="text-2xl font-mono font-bold text-emerald-600">{formatCurrency(0)}</div>
        </div>
      </div>

      <SubTable title="本月收入" type="收入" />
      <SubTable title="本月支出" type="支出" />

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 flex justify-between items-center mb-4">
        <span className="font-bold text-lg text-slate-700 ml-9">股票買賣</span>
        <span className="font-mono font-bold text-xl text-slate-800">{formatCurrency(0)}</span>
      </div>
    </div>
  );

  const AddDataView = () => {
    const categoriesForType = vocabularies.filter(v => v.type === addForm.type);

    return (
      <div className="p-6 max-w-2xl mx-auto animate-in fade-in">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
           <h2 className="text-2xl font-bold text-slate-800 mb-6 border-b pb-3">新增資料</h2>
           
           <div className="space-y-5 flex flex-col">
              <div>
                <label className="block text-sm font-bold text-slate-600 mb-1">帳戶</label>
                <select className="w-full border rounded-lg p-3 font-bold bg-slate-50" value={addForm.account} onChange={e => setAddForm({...addForm, account: e.target.value as BankAccount})}>
                  <option value="禹君">禹君</option>
                  <option value="禹辰">禹辰</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-600 mb-1">收支類型</label>
                <div className="flex gap-2">
                  {(['收入', '支出', '股票'] as BankTransactionType[]).map(t => (
                    <button
                      key={t}
                      onClick={() => setAddForm({...addForm, type: t, category: ''})}
                      className={`flex-1 py-3 font-bold rounded-lg ${addForm.type === t ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-600 mb-1">日期</label>
                <input type="date" className="w-full border rounded-lg p-3 font-bold bg-slate-50" value={addForm.date} onChange={e => setAddForm({...addForm, date: e.target.value})} />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-600 mb-1">項目</label>
                <select className="w-full border rounded-lg p-3 font-bold bg-slate-50" value={addForm.category} onChange={e => setAddForm({...addForm, category: e.target.value})}>
                  <option value="" disabled>請選擇項目...</option>
                  {categoriesForType.map(v => (
                    <option key={v.id} value={v.word}>{v.word}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-600 mb-1">金額</label>
                <input type="number" placeholder="0" className="w-full border rounded-lg p-3 font-mono font-bold text-lg bg-slate-50" value={addForm.amount || ''} onChange={e => setAddForm({...addForm, amount: Number(e.target.value)})} />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-600 mb-1">備註</label>
                <input type="text" placeholder="選填" className="w-full border rounded-lg p-3 font-bold bg-slate-50" value={addForm.remarks} onChange={e => setAddForm({...addForm, remarks: e.target.value})} />
              </div>

              <div className="pt-4">
                <button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 rounded-xl shadow-sm text-lg transition-colors active:scale-[0.98]">
                  確定儲存
                </button>
              </div>
           </div>
        </div>
      </div>
    );
  };

  const VocabView = () => (
    <div className="p-6 max-w-4xl mx-auto animate-in fade-in text-center py-20 text-slate-400">
      <BookType size={48} className="mx-auto mb-4 opacity-50" />
      <h2 className="text-xl font-bold mb-2">詞庫輸入介面建置中...</h2>
      <p>目前使用預設內建詞庫</p>
    </div>
  );

  return (
    <div className="flex flex-col h-screen bg-slate-100 overflow-hidden font-sans">
      {renderNav()}
      <div className="flex-1 overflow-y-auto">
        {view === 'summary' && <SummaryView />}
        {view === 'monthly' && <MonthlyView />}
        {view === 'add' && <AddDataView />}
        {view === 'vocab' && <VocabView />}
      </div>
    </div>
  );
};

export default BankSystem;
