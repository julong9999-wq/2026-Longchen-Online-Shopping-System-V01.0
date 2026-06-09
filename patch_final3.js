import fs from 'fs';

let content = fs.readFileSync('components/EcommerceAnalysisSystem.tsx', 'utf-8');

const t = "<thead className={`sticky top-0 z-10 shadow-sm ${activeTab === 'shipping' ? 'bg-sky-600 text-white border-b border-sky-700' : 'bg-emerald-600 text-white border-b border-emerald-700'}`}>";
const tNew = "<thead className={`sticky top-0 z-10 shadow-sm border-b ${statusFilter === 'processing' ? 'bg-emerald-600 text-white border-emerald-700' : statusFilter === 'preorder' ? 'bg-rose-600 text-white border-rose-700' : 'bg-yellow-500 text-white border-yellow-600'}`}>";

content = content.replace(t, tNew);

fs.writeFileSync('components/EcommerceAnalysisSystem.tsx', content);
console.log("Patched literal!");
