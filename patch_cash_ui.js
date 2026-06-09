import fs from 'fs';

let content = fs.readFileSync('components/EcommerceAnalysisSystem.tsx', 'utf-8');

// 1. thead & tfoot for shipping/profit/turnover
content = content.replace(
  /className=\{\`sticky top-0 z-10 shadow-sm \\\$\{activeTab === 'shipping' \? 'bg-sky-600 text-white border-b border-sky-700' : 'bg-emerald-600 text-white border-b border-emerald-700'\}\`\}/g,
  `className={\`sticky top-0 z-10 shadow-sm \${activeTab === 'shipping' ? 'bg-emerald-600 text-white border-b border-emerald-700' : 'bg-rose-600 text-white border-b border-rose-700'}\`}`
);

content = content.replace(
  /className=\{\`sticky bottom-0 z-10 shadow-\[0_-4px_6px_-1px_rgba\(0,0,0,0\.1\)\] border-t-2 \\\$\{activeTab === 'shipping' \? 'bg-sky-200 border-sky-400 text-sky-900' : 'bg-emerald-200 border-emerald-400 text-emerald-900'\}\`\}/g,
  `className={\`sticky bottom-0 z-10 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] border-t-2 \${activeTab === 'shipping' ? 'bg-emerald-200 border-emerald-400 text-emerald-900' : 'bg-rose-200 border-rose-400 text-rose-900'}\`}`
);

// Turnover text colors (Turnover is Amber/Yellow. Amber is already there but let's make it more deep tone if needed, or leave Amber as it is yellowish)
content = content.replace(
    /className="sticky top-0 z-10 shadow-sm bg-amber-500 text-white border-b border-amber-600"/g,
    `className="sticky top-0 z-10 shadow-sm bg-yellow-500 text-white border-b border-yellow-600"`
);
content = content.replace(
    /tfoot className="sticky bottom-0 z-10 shadow-\[0_-4px_6px_-1px_rgba\(0,0,0,0\.1\)\] border-t-2 bg-amber-200 border-amber-400 text-amber-900"/g,
    `tfoot className="sticky bottom-0 z-10 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] border-t-2 bg-yellow-200 border-yellow-400 text-yellow-900"`
);

// 2. Buttons in Cash filter
const oldCashButtons = `className=\`flex-1 py-2 font-bold text-sm rounded-xl transition-all border
                      \${cashFilter === mode 
                          ? 'bg-sky-100 text-sky-700 border-sky-300 shadow-sm' 
                          : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'
                      }
                  \``;

const newCashButtons = `className=\`flex-1 py-2 font-bold text-sm rounded-xl transition-all border
                      \${cashFilter === mode 
                          ? (mode === 'withdrawn' ? 'bg-blue-100 text-blue-800 border-blue-300 shadow-sm' : mode === 'unwithdrawn' ? 'bg-rose-100 text-rose-800 border-rose-300 shadow-sm' : 'bg-emerald-100 text-emerald-800 border-emerald-300 shadow-sm')
                          : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'
                      }
                  \``;

content = content.replace(oldCashButtons, newCashButtons);

fs.writeFileSync('components/EcommerceAnalysisSystem.tsx', content);
console.log("Patched headers, footers and buttons");
