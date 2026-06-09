import fs from 'fs';

let content = fs.readFileSync('components/EcommerceAnalysisSystem.tsx', 'utf-8');

// 1. Add "turnover" tab to activeTab state.
content = content.replace(
  /const \[activeTab, setActiveTab\] = useState\<'shipping' \| 'profit' \| 'cash' \| 'reconciliation' \| 'purchase'\>\('shipping'\);/,
  "const [activeTab, setActiveTab] = useState<'shipping' | 'profit' | 'turnover' | 'cash' | 'reconciliation' | 'purchase'>('shipping');"
);

// Add "turnover" title
content = content.replace(
  /case 'profit': return '利潤分析';/,
  "case 'profit': return '利潤分析';\n          case 'turnover': return '週期分析';"
);

// 1.1 Bottom Nav bar changes
const navReplacement = `<button 
        onClick={() => setActiveTab('profit')} 
        className={\`flex-1 flex flex-col items-center justify-center h-full transition-all duration-200 \${activeTab === 'profit' ? 'text-yellow-300 bg-sky-800/50' : 'text-sky-200 hover:text-white'}\`}
      >
        <DollarSign size={22} strokeWidth={activeTab === 'profit' ? 2.5 : 2} />
        <span className="text-[11px] font-bold mt-1 tracking-wide">利潤</span>
      </button>

      <button 
        onClick={() => setActiveTab('turnover')} 
        className={\`flex-1 flex flex-col items-center justify-center h-full transition-all duration-200 \${activeTab === 'turnover' ? 'text-yellow-300 bg-sky-800/50' : 'text-sky-200 hover:text-white'}\`}
      >
        <Clock size={22} strokeWidth={activeTab === 'turnover' ? 2.5 : 2} />
        <span className="text-[11px] font-bold mt-1 tracking-wide">週期</span>
      </button>`;
      
content = content.replace(/<button \n\s*onClick={\(\) => setActiveTab\('profit'\)}[\s\S]+?<\/button>/, navReplacement);

// import Clock
if (!content.includes('Clock,')) {
    content = content.replace(/Truck, DollarSign, Wallet, FileCheck, ShoppingCart, Home, X, CheckCircle, AlertTriangle/, "Truck, DollarSign, Clock, Wallet, FileCheck, ShoppingCart, Home, X, CheckCircle, AlertTriangle");
}


// 2. Add 'turnover' to Filter Tabs
content = content.replace(
  /{\(activeTab === 'shipping' \|\| activeTab === 'profit'\) && \(/g,
  "{(activeTab === 'shipping' || activeTab === 'profit' || activeTab === 'turnover') && ("
);

// color table form - update table rows for shipping/profit
content = content.replace(
  /<tr key={item\.id} className="hover:bg-slate-50">/g,
  `<tr key={item.id} className={\`\${item.status === 'processing' ? 'bg-emerald-50/80 hover:bg-emerald-100/80' : item.status === 'preorder' ? 'bg-rose-50/80 hover:bg-rose-100/80' : 'bg-yellow-50/80 hover:bg-yellow-100/80'}\`}>`
);

// color cash filter and list items
content = content.replace(
  /let label = mode === 'withdrawn' \? '已領' : mode === 'unwithdrawn' \? '未領' : '前期';/,
  "let label = mode === 'withdrawn' ? '領現' : mode === 'unwithdrawn' ? '未領' : '前期';"
);
content = content.replace(
  /\$ {2}\{cashFilter === mode \n {27}\? 'bg-sky-100 text-sky-700 border-sky-300 shadow-sm' \n {27}: 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'/g,
  `$ {cashFilter === mode 
                          ? (mode === 'withdrawn' ? 'bg-blue-100 text-blue-800 border-blue-300 shadow-sm' : mode === 'unwithdrawn' ? 'bg-rose-100 text-rose-800 border-rose-300 shadow-sm' : 'bg-emerald-100 text-emerald-800 border-emerald-300 shadow-sm')
                          : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'`
);

content = content.replace(
  /let cardBg = 'bg-white border-slate-200';\n                          if \(cashFilter === 'unwithdrawn'\) cardBg = 'bg-rose-50 border-rose-200';\n                          if \(cashFilter === 'previous'\) cardBg = 'bg-emerald-50 border-emerald-200';/,
  `let cardBg = cashFilter === 'withdrawn' ? 'bg-blue-50/50 border-blue-200' : cashFilter === 'unwithdrawn' ? 'bg-rose-50/50 border-rose-200' : 'bg-emerald-50/50 border-emerald-200';`
);

// 3. Purchase Filter Buttons color
content = content.replace(
  /purchaseFilter === 'all' \? 'bg-indigo-100 text-indigo-800 border-indigo-300 shadow-sm' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'/g,
  "purchaseFilter === 'all' ? 'bg-orange-100 text-orange-800 border-orange-300 shadow-sm' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'"
);
content = content.replace(
  /purchaseFilter === 'unsettled' \? 'bg-indigo-100 text-indigo-800 border-indigo-300 shadow-sm' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'/g,
  "purchaseFilter === 'unsettled' ? 'bg-orange-100 text-orange-800 border-orange-300 shadow-sm' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'"
);
content = content.replace(
  /purchaseFilter === 'settled' \? 'bg-indigo-100 text-indigo-800 border-indigo-300 shadow-sm' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'/g,
  "purchaseFilter === 'settled' ? 'bg-orange-100 text-orange-800 border-orange-300 shadow-sm' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'"
);

// 4. Purchase 合計列 優化
const oldPurchaseTotalStr = `<div className="p-3 bg-indigo-50 border-b border-indigo-100 shrink-0 shadow-sm">
                    <div className="flex justify-between items-center text-xs font-bold text-indigo-800 mb-1">
                        <span>訂單總收入</span>
                        <span>購買總金額</span>
                        <span>百分比</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="font-mono font-bold text-lg text-slate-700">{formatCurrency(totalRevenue)}</span>
                        <span className="font-mono font-bold text-lg text-indigo-600">{formatCurrency(totalPurchase)}</span>
                        <span className="font-mono font-bold text-lg text-fuchsia-600">{percentage}%</span>
                    </div>
                </div>`;
const newPurchaseTotalStr = `<div className="px-3 py-2 bg-orange-50 border-b border-orange-100 shrink-0 shadow-sm">
                    <div className="flex justify-between items-center text-[10px] font-bold text-orange-800 mb-0.5">
                        <div className="w-1/3 text-left">訂單</div>
                        <div className="w-1/3 text-center">購買</div>
                        <div className="w-1/3 text-right"></div>
                    </div>
                    <div className="flex justify-between items-baseline text-xs font-bold text-slate-600">
                        <div className="w-1/3 text-left flex items-baseline">
                            總收入 <span className="font-mono text-[15px] font-bold text-slate-800 ml-1.5">{formatCurrency(totalRevenue)}</span>
                        </div>
                        <div className="w-1/3 text-center flex items-baseline justify-center">
                            總金額 <span className="font-mono text-[15px] font-bold text-orange-600 ml-1.5">{formatCurrency(totalPurchase)}</span>
                        </div>
                        <div className="w-1/3 text-right flex items-baseline justify-end">
                            百分比 <span className="font-mono text-[15px] font-bold text-fuchsia-600 ml-1.5">{percentage}%</span>
                        </div>
                    </div>
                </div>`;
                
content = content.replace(oldPurchaseTotalStr, newPurchaseTotalStr);

fs.writeFileSync('components/EcommerceAnalysisSystem.tsx', content);
console.log("Patched preliminary");
