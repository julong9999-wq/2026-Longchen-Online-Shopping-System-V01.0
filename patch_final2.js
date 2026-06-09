import fs from 'fs';

let content = fs.readFileSync('components/EcommerceAnalysisSystem.tsx', 'utf-8');

// The first thead for shipping/profit
const thead1Pattern = /<thead className=\{\`sticky top-0 z-10 shadow-sm \\\$\{activeTab === 'shipping'.*?\}\`\}>/;
content = content.replace(thead1Pattern, `<thead className={\`sticky top-0 z-10 shadow-sm border-b \${statusFilter === 'processing' ? 'bg-emerald-600 text-white border-emerald-700' : statusFilter === 'preorder' ? 'bg-rose-600 text-white border-rose-700' : 'bg-yellow-500 text-white border-yellow-600'}\`}>`);

// Purchase thead
const theadPurchase = /<thead className="bg-orange-200 text-orange-900 border-b border-orange-300 sticky top-0 z-10 shadow-sm">/;
content = content.replace(theadPurchase, `<thead className="bg-slate-100 text-slate-600 border-b border-slate-200 sticky top-0 z-10 shadow-sm">`);

fs.writeFileSync('components/EcommerceAnalysisSystem.tsx', content);
console.log("Patched the remaining theads!");
