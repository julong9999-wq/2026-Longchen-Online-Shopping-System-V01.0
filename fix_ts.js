import fs from 'fs';

let content = fs.readFileSync('components/EcommerceAnalysisSystem.tsx', 'utf-8');

// 1. Fix turnover table thead:
// Inside turnover table (around line 336), activeTab is already 'turnover'
const turnoverBadThead = /<thead className=\{`sticky top-0 z-10 shadow-sm \$\{activeTab === 'shipping' \? 'bg-sky-600 text-white border-b border-sky-700' : activeTab === 'profit' \? 'bg-emerald-600 text-white border-b border-emerald-700' : activeTab === 'turnover' \? 'bg-amber-500 text-white border-b border-amber-600' : 'bg-slate-100 text-slate-600 border-b border-slate-200'\}`\}>/;

const turnoverGoodThead = `<thead className="sticky top-0 z-10 shadow-sm bg-amber-500 text-white border-b border-amber-600">`;

content = content.replace(turnoverBadThead, turnoverGoodThead);

// 2. Fix reconciliation table thead (around line 704):
// ActiveTab is 'reconciliation'.
const reconBadThead = turnoverBadThead; // It's exactly the same pattern since I replaced it globally using /g
const reconGoodThead = `<thead className="bg-slate-100 text-slate-600 border-b border-slate-200 sticky top-0 z-10 shadow-sm">`;

content = content.replace(reconBadThead, reconGoodThead);

fs.writeFileSync('components/EcommerceAnalysisSystem.tsx', content);
console.log("Fixed typescript typing issues");
