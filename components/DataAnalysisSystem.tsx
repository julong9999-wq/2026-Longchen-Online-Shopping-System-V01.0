import { useState } from 'react';
import { RefreshCw, CornerUpLeft, Banknote, FileText, Lock, LineChart } from 'lucide-react';
import WithdrawalView from './WithdrawalView';
import LendingView from './LendingView';
import PledgeView from './PledgeView';
import InvestmentXXXXView from './InvestmentXXXXView';

interface DataAnalysisSystemProps {
  onNavigateHome: () => void;
}

export default function DataAnalysisSystem({ onNavigateHome }: DataAnalysisSystemProps) {
  const [mainModule, setMainModule] = useState<'investment' | 'withdrawal' | 'lending' | 'pledge'>('investment');
  const [activeTab, setActiveTab] = useState('year');
  const [activeAccount, setActiveAccount] = useState('all');
  const [refreshKey, setRefreshKey] = useState(0);

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };
  
  return (
    <div className="flex flex-col h-screen bg-slate-100 font-sans text-slate-900 overflow-hidden">
      
      {/* 1. 最上方 標語列 & 帳戶選擇紐 */}
      <div className="bg-indigo-600 text-white shrink-0 z-10 p-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button onClick={handleRefresh} className="p-1 hover:bg-white/10 rounded-md transition-colors">
            <RefreshCw size={20} className="opacity-90" />
          </button>
          <h1 className="text-lg font-bold tracking-wide">
            {mainModule === 'withdrawal' ? '資金領用' : mainModule === 'lending' ? '借劵系統' : mainModule === 'pledge' ? '質押系統' : '績效分析'}
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
          <div className="bg-white px-2 py-1.5 flex justify-between gap-1 shrink-0 border-b border-slate-200">
            <button 
              onClick={() => setActiveTab('day')}
              className={`px-2 py-1.5 rounded-xl text-xs transition-all flex-1 text-center ${activeTab === 'day' ? 'bg-white shadow-[0_2px_8px_rgba(0,0,0,0.1)] font-bold text-slate-800' : 'text-slate-500'}`}
            >
              日分析
            </button>
            <button 
              onClick={() => setActiveTab('month')}
              className={`px-2 py-1.5 rounded-xl text-xs transition-all flex-1 text-center ${activeTab === 'month' ? 'bg-white shadow-[0_2px_8px_rgba(0,0,0,0.1)] font-bold text-slate-800' : 'text-slate-500'}`}
            >
              月分析
            </button>
            <button 
              onClick={() => setActiveTab('year')}
              className={`px-2 py-1.5 rounded-xl text-xs transition-all flex-1 text-center ${activeTab === 'year' ? 'bg-white shadow-[0_2px_8px_rgba(0,0,0,0.1)] font-bold text-slate-800' : 'text-slate-500'}`}
            >
              年分析
            </button>
            <button 
              onClick={() => setActiveTab('trend')}
              className={`px-2 py-1.5 rounded-xl text-xs transition-all flex-1 text-center ${activeTab === 'trend' ? 'bg-white shadow-[0_2px_8px_rgba(0,0,0,0.1)] font-bold text-slate-800' : 'text-slate-500'}`}
            >
              月趨勢
            </button>
            <button 
              onClick={() => setActiveTab('dividend')}
              className={`px-2 py-1.5 rounded-xl text-xs transition-all flex-1 text-center ${activeTab === 'dividend' ? 'bg-white shadow-[0_2px_8px_rgba(0,0,0,0.1)] font-bold text-slate-800' : 'text-slate-500'}`}
            >
              月股息
            </button>
            <button 
              onClick={() => setActiveTab('XXXX')}
              className={`px-2 py-1.5 rounded-xl text-xs transition-all flex-1 text-center ${activeTab === 'XXXX' ? 'bg-white shadow-[0_2px_8px_rgba(0,0,0,0.1)] font-bold text-slate-800' : 'text-slate-500'}`}
            >
              XXXX
            </button>
            <button 
              onClick={() => setActiveTab('YYYY')}
              className={`px-2 py-1.5 rounded-xl text-xs transition-all flex-1 text-center ${activeTab === 'YYYY' ? 'bg-white shadow-[0_2px_8px_rgba(0,0,0,0.1)] font-bold text-slate-800' : 'text-slate-500'}`}
            >
              YYYY
            </button>
          </div>

          {/* 3. 第三區域 合計列 */}
          <div className="bg-white px-3 py-3 shrink-0 shadow-sm border-b border-slate-200 z-0">
            <div className="flex justify-between items-baseline mb-2.5">
              <div className="flex items-baseline gap-3">
                <span className="text-slate-500 text-xs">投資</span>
                <span className="text-lg font-bold text-slate-800">26,397,766</span>
              </div>
              <div className="flex items-baseline gap-3">
                <span className="text-slate-500 text-xs">市值</span>
                <span className="text-lg font-bold text-slate-800">51,044,319</span>
              </div>
            </div>
            <div className="flex justify-between items-baseline">
              <div className="flex items-baseline gap-1.5">
                <span className="text-slate-500 text-xs">損益</span>
                <span className="text-base font-bold text-[#e1251b]">24,646,553</span>
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-slate-500 text-xs">股息</span>
                <span className="text-base font-bold text-slate-800">8,054,927</span>
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-slate-500 text-xs">績效</span>
                <span className="text-base font-bold text-[#e1251b]">32,701,479</span>
              </div>
            </div>
          </div>

          {/* 4. 第四區為 介面資料或表格 (佔位區) */}
          <div className="flex-1 overflow-y-auto p-2 pb-20 bg-slate-50 space-y-3">
            {activeTab === 'XXXX' ? (
              <InvestmentXXXXView activeAccount={activeAccount} refreshKey={refreshKey} />
            ) : activeTab === 'YYYY' ? (
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col items-center justify-center text-slate-400 h-full">
                <FileText size={40} className="mb-2 opacity-50" />
                <span className="font-bold text-sm">YYYY 視圖區塊</span>
                <span className="text-[10px] mt-1">（規劃中）</span>
              </div>
            ) : (
              <>
                {/* 圖表佔位 */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-3 h-64 flex flex-col items-center justify-center text-slate-400">
                   <LineChart size={40} className="mb-2 opacity-50" />
                   <span className="font-bold text-sm">歷年變動趨勢圖表區塊</span>
                   <span className="text-[10px] mt-1">（規劃中）</span>
                </div>
                
                {/* 表格佔位 */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                  <div className="grid grid-cols-5 bg-slate-50 p-2 border-b border-slate-100 text-[10px] text-slate-500 font-bold text-center">
                    <div>年份</div>
                    <div>資產市值</div>
                    <div>股息收益</div>
                    <div>投資金額</div>
                    <div>損益變化</div>
                  </div>
                  <div className="p-6 text-center text-slate-400 font-bold flex flex-col items-center">
                    <FileText size={24} className="mb-2 opacity-50" />
                    <span className="text-sm">詳細資料表格區塊</span>
                    <span className="text-[10px] mt-1">（規劃中）</span>
                  </div>
                </div>
              </>
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
