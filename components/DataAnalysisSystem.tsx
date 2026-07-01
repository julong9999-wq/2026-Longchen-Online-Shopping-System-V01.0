import { useState } from 'react';
import { CornerUpLeft, Banknote, FileText, Lock, LineChart } from 'lucide-react';
import WithdrawalView from './WithdrawalView';
import LendingView from './LendingView';
import PledgeView from './PledgeView';
import InvestmentXXXXView from './InvestmentXXXXView';

interface DataAnalysisSystemProps {
  onNavigateHome: () => void;
}

export default function DataAnalysisSystem({ onNavigateHome }: DataAnalysisSystemProps) {
  const [mainModule, setMainModule] = useState<'investment' | 'withdrawal' | 'lending' | 'pledge'>('investment');
  const [activeTab, setActiveTab] = useState('data');
  const [activeAccount, setActiveAccount] = useState('all');
  const [refreshKey] = useState(0);
  
  return (
    <div className="flex flex-col h-screen bg-slate-100 font-sans text-slate-900 overflow-hidden">
      
      {/* 1. 最上方 標語列 & 帳戶選擇紐 */}
      <div className="bg-indigo-600 text-white shrink-0 z-10 p-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h1 className="font-bold tracking-wide">
          <span className="text-lg">
            {mainModule === 'withdrawal' ? '資金領用' : mainModule === 'lending' ? '借劵系統' : mainModule === 'pledge' ? '質押系統' : '績效分析'}
          </span>
          </h1>
        </div>
        
        <div className="flex items-center bg-indigo-700 rounded-full p-1 overflow-x-auto no-scrollbar">
          <button 
            onClick={() => setActiveAccount('all')}
            className={`px-2.5 py-0.5 rounded-full text-xs whitespace-nowrap ${activeAccount === 'all' ? 'bg-white text-indigo-600 font-bold shadow-sm' : 'text-white'}`}
          >
            全部
          </button>
          <button 
            onClick={() => setActiveAccount('俊龍')}
            className={`px-2.5 py-0.5 rounded-full text-xs whitespace-nowrap ${activeAccount === '俊龍' ? 'bg-white text-indigo-600 font-bold shadow-sm' : 'text-white'}`}
          >
            俊龍
          </button>
          <button 
            onClick={() => setActiveAccount('美慧')}
            className={`px-2.5 py-0.5 rounded-full text-xs whitespace-nowrap ${activeAccount === '美慧' ? 'bg-white text-indigo-600 font-bold shadow-sm' : 'text-white'}`}
          >
            美慧
          </button>
          <button 
            onClick={() => setActiveAccount('禹君')}
            className={`px-2.5 py-0.5 rounded-full text-xs whitespace-nowrap ${activeAccount === '禹君' ? 'bg-white text-indigo-600 font-bold shadow-sm' : 'text-white'}`}
          >
            禹君
          </button>
          <button 
            onClick={() => setActiveAccount('禹辰')}
            className={`px-2.5 py-0.5 rounded-full text-xs whitespace-nowrap ${activeAccount === '禹辰' ? 'bg-white text-indigo-600 font-bold shadow-sm' : 'text-white'}`}
          >
            禹辰
          </button>
        </div>
      </div>

      {mainModule === 'investment' ? (
        <>
          {/* 2. 第二列 分頁按鈕 */}
          <div className="bg-white px-2 py-1.5 flex justify-between gap-1 shrink-0 border-b border-slate-200 overflow-x-auto no-scrollbar">
            <button 
              onClick={() => setActiveTab('assets')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors ${activeTab === 'assets' ? 'bg-indigo-100 text-indigo-700' : 'text-slate-500 hover:bg-slate-100'}`}
            >
              資產
            </button>
            <button 
              onClick={() => setActiveTab('income')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors ${activeTab === 'income' ? 'bg-indigo-100 text-indigo-700' : 'text-slate-500 hover:bg-slate-100'}`}
            >
              收入
            </button>
            <button 
              onClick={() => setActiveTab('expense')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors ${activeTab === 'expense' ? 'bg-indigo-100 text-indigo-700' : 'text-slate-500 hover:bg-slate-100'}`}
            >
              支出
            </button>
            <button 
              onClick={() => setActiveTab('data')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors ${activeTab === 'data' ? 'bg-indigo-100 text-indigo-700' : 'text-slate-500 hover:bg-slate-100'}`}
            >
              資料
            </button>
            <a 
              href="https://docs.google.com/forms/d/1X-s9lS79bF4C3_2o-Yt2E_n7Q4sM1X8rE-c3gZkO9fQ/viewform" 
              target="_blank" 
              rel="noreferrer" 
              className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 transition-colors shrink-0"
            >
              新增
            </a>
          </div>

          {/* 4. 第四區為 介面資料或表格 (佔位區) */}
          <div className="flex-1 overflow-y-auto p-2 pb-20 bg-slate-50 space-y-3">
            {activeTab === 'data' ? (
              <InvestmentXXXXView activeAccount={activeAccount} refreshKey={refreshKey} />
            ) : (
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col items-center justify-center text-slate-400 h-full">
                <FileText size={40} className="mb-2 opacity-50" />
                <span className="font-bold text-sm">
                  {activeTab === 'assets' ? '資產視圖' : activeTab === 'income' ? '收入視圖' : '支出視圖'}
                </span>
                <span className="text-[10px] mt-1">（規劃中）</span>
              </div>
            )}
          </div>
        </>
      ) : mainModule === 'withdrawal' ? (
        <WithdrawalView activeAccount={activeAccount} refreshKey={refreshKey} />
      ) : mainModule === 'lending' ? (
        <LendingView activeAccount={activeAccount} refreshKey={refreshKey} />
      ) : (
        <PledgeView activeAccount={activeAccount} refreshKey={refreshKey} />
      )}

      {/* 5. 最下列為 功能列 */}
      <div className="absolute bottom-0 left-0 right-0 bg-indigo-600 text-white p-1.5 pb-safe shadow-[0_-4px_10px_rgba(0,0,0,0.1)] z-20">
        <div className="flex justify-between items-center gap-1 max-w-md mx-auto px-1">
          <button 
            onClick={() => setMainModule('withdrawal')}
            className={`flex flex-col items-center justify-center flex-1 py-1.5 rounded-lg transition-colors ${mainModule === 'withdrawal' ? 'bg-white/20' : 'hover:bg-white/10'}`}
          >
            <Banknote size={22} className="mb-0.5" />
            <span className="text-[11px] font-bold">領錢</span>
          </button>
          <button 
            onClick={() => setMainModule('lending')}
            className={`flex flex-col items-center justify-center flex-1 py-1.5 rounded-lg transition-colors ${mainModule === 'lending' ? 'bg-white/20' : 'hover:bg-white/10'}`}
          >
            <FileText size={22} className="mb-0.5" />
            <span className="text-[11px] font-bold">借劵</span>
          </button>
          <button 
            onClick={() => setMainModule('pledge')}
            className={`flex flex-col items-center justify-center flex-1 py-1.5 rounded-lg transition-colors ${mainModule === 'pledge' ? 'bg-white/20' : 'hover:bg-white/10'}`}
          >
            <Lock size={22} className="mb-0.5" />
            <span className="text-[11px] font-bold">質押</span>
          </button>
          <button 
            onClick={() => setMainModule('investment')}
            className={`flex flex-col items-center justify-center flex-1 py-1.5 rounded-lg transition-colors ${mainModule === 'investment' ? 'bg-white/20' : 'hover:bg-white/10'}`}
          >
            <LineChart size={22} className="mb-0.5" />
            <span className="text-[11px] font-bold">投資</span>
          </button>
          <button 
            onClick={onNavigateHome}
            className="flex flex-col items-center justify-center flex-1 py-1.5 hover:bg-white/10 rounded-lg transition-colors"
          >
            <CornerUpLeft size={22} className="mb-0.5" />
            <span className="text-[11px] font-bold">返回</span>
          </button>
        </div>
      </div>

    </div>
  );
}
