import fs from 'fs';

let content = fs.readFileSync('components/EcommerceAnalysisSystem.tsx', 'utf-8');

const t1 = `<table className="w-full text-left text-sm">
                  <thead className="sticky top-0 z-10 shadow-sm bg-amber-500 text-white border-b border-amber-600">
                      <tr>
                          <th className="px-2 py-2 font-bold w-1/4">訂單序</th>`;

const t1New = `<table className="w-full text-left text-sm">
                  <thead className={\`sticky top-0 z-10 shadow-sm \${activeTab === 'shipping' ? 'bg-sky-600 text-white border-b border-sky-700' : 'bg-emerald-600 text-white border-b border-emerald-700'}\`}>
                      <tr>
                          <th className="px-2 py-2 font-bold w-1/4">訂單序</th>`;

content = content.replace(t1, t1New);

// This is the turnover table! It has orderDate, closedDate, days! Look at th tags!
const t2 = `<thead className={\`sticky top-0 z-10 shadow-sm \${activeTab === 'shipping' ? 'bg-sky-600 text-white border-b border-sky-700' : activeTab === 'profit' ? 'bg-emerald-600 text-white border-b border-emerald-700' : activeTab === 'turnover' ? 'bg-amber-500 text-white border-b border-amber-600' : 'bg-slate-100 text-slate-600 border-b border-slate-200'}\`}>
                      <tr>
                          <th className="px-2 py-2 font-bold">訂單序</th>
                          <th className="px-2 py-2 font-bold text-center">訂單日</th>`;

const t2New = `<thead className="sticky top-0 z-10 shadow-sm bg-amber-500 text-white border-b border-amber-600">
                      <tr>
                          <th className="px-2 py-2 font-bold">訂單序</th>
                          <th className="px-2 py-2 font-bold text-center">訂單日</th>`;

content = content.replace(t2, t2New);

const t3 = `<table className="w-full text-left text-sm">
                   <thead className={\`sticky top-0 z-10 shadow-sm \${activeTab === 'shipping' ? 'bg-sky-600 text-white border-b border-sky-700' : activeTab === 'profit' ? 'bg-emerald-600 text-white border-b border-emerald-700' : activeTab === 'turnover' ? 'bg-amber-500 text-white border-b border-amber-600' : 'bg-slate-100 text-slate-600 border-b border-slate-200'}\`}>
                       <tr>
                           <th className="px-1 py-2 font-bold w-1/5">訂單序</th>`;

const t3New = `<table className="w-full text-left text-sm">
                   <thead className="bg-slate-100 text-slate-600 border-b border-slate-200 sticky top-0 z-10 shadow-sm">
                       <tr>
                           <th className="px-1 py-2 font-bold w-1/5">訂單序</th>`;

content = content.replace(t3, t3New);


fs.writeFileSync('components/EcommerceAnalysisSystem.tsx', content);
console.log("Fixed headers");
