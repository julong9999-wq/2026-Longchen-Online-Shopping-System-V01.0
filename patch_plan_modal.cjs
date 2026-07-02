const fs = require('fs');
let code = fs.readFileSync('components/ShiftSystem.tsx', 'utf8');

// 1. Add getTimeColor function at the top
const timeColorCode = `
const getTimeColor = (timeStr: string) => {
    if (!timeStr) return 'text-slate-700';
    const hour = parseInt(timeStr.split(':')[0], 10);
    if (hour >= 5 && hour < 12) return 'text-amber-600';
    if (hour >= 12 && hour < 18) return 'text-orange-600';
    return 'text-indigo-600';
};
`;

if (!code.includes('getTimeColor')) {
    code = code.replace(/const getFirstDayOfMonth[^\n]+\n/, match => match + timeColorCode);
}

// 2. Replace the date input logic in the modal
const oldDateInputSection = /<div className="flex flex-col gap-1\.5">\s*<input type="date"[\s\S]*?<\/div>\s*\)\}\s*<\/div>/;

const newDateInputSection = `<div className="w-full h-10 px-2 border rounded-lg bg-slate-50 flex items-center gap-1.5 overflow-x-auto no-scrollbar relative">
                                <div className="relative shrink-0 flex items-center justify-center h-7 px-2 bg-slate-200 text-slate-700 rounded font-bold text-xs cursor-pointer hover:bg-slate-300 transition-colors">
                                    <Calendar size={14} className="mr-1"/> 選擇日期
                                    <input 
                                        type="date" 
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                                        disabled={!!editPlanId}
                                        value={planDates.length > 0 ? planDates[planDates.length - 1] : ''} 
                                        onChange={e => {
                                            const d = e.target.value;
                                            if (!d) return;
                                            if (editPlanId) {
                                                setPlanDates([d]);
                                                return;
                                            }
                                            if (!planDates.includes(d)) {
                                                setPlanDates([...planDates, d].sort());
                                            }
                                        }} 
                                    />
                                </div>
                                {planDates.map(date => (
                                    <span key={date} className={\`shrink-0 bg-\${mainColor}-100 text-\${mainColor}-700 px-2 h-7 rounded text-xs font-bold flex items-center gap-1 shadow-sm\`}>
                                        {date}
                                        {!editPlanId && (
                                            <button onClick={() => setPlanDates(planDates.filter(d => d !== date))} className="hover:text-rose-500 rounded-full bg-white/50 p-0.5 ml-0.5">
                                                <X size={10}/>
                                            </button>
                                        )}
                                    </span>
                                ))}
                                {planDates.length === 0 && <span className="text-slate-400 text-sm ml-1">未選擇</span>}
                            </div>`;

code = code.replace(oldDateInputSection, newDateInputSection);

// 3. Replace time inputs in modal
const oldTimeInputs = /<input type="time" step="1800" className="flex-1 h-10 px-3 border rounded-lg bg-slate-50 font-mono text-sm" required value=\{planStartTime\} onChange=\{e => setPlanStartTime\(e\.target\.value\)\} \/>\s*<span className="text-slate-400">~<\/span>\s*<input type="time" step="1800" className="flex-1 h-10 px-3 border rounded-lg bg-slate-50 font-mono text-sm" required value=\{planEndTime\} onChange=\{e => setPlanEndTime\(e\.target\.value\)\} \/>/;

const newTimeInputs = `<input type="time" step="1800" className={\`flex-1 h-10 px-3 border rounded-lg bg-slate-50 font-mono text-sm font-bold \${getTimeColor(planStartTime)}\`} required value={planStartTime} onChange={e => setPlanStartTime(e.target.value)} />
                                <span className="text-slate-400">~</span>
                                <input type="time" step="1800" className={\`flex-1 h-10 px-3 border rounded-lg bg-slate-50 font-mono text-sm font-bold \${getTimeColor(planEndTime)}\`} required value={planEndTime} onChange={e => setPlanEndTime(e.target.value)} />`;

code = code.replace(oldTimeInputs, newTimeInputs);

// 4. Also replace the location buttons to horizontally scroll
const oldPlanFormPattern = /<div className="flex justify-between items-center">\s*<div className="flex flex-wrap gap-1\.5">[\s\S]*?<\/button>\s*<\/div>/;

const newPlanForm = `<div className="flex items-center gap-2 w-full overflow-hidden">
                                <div className="flex-1 overflow-x-auto flex items-center gap-1.5 no-scrollbar pb-1">
                                    <button 
                                        onClick={() => setPlanListLocFilter('all')}
                                        className={\`shrink-0 px-3 h-8 rounded-lg border text-xs font-bold transition-colors \${planListLocFilter === 'all' ? activeBtnClass : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'}\`}
                                    >全部</button>
                                    {activeCurrentLocs.map(l => (
                                        <button 
                                            key={l.id} 
                                            onClick={() => setPlanListLocFilter(l.id)}
                                            className={\`shrink-0 px-3 h-8 rounded-lg border text-xs font-bold transition-colors \${planListLocFilter === l.id ? activeBtnClass : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'}\`}
                                        >
                                            {l.name}
                                        </button>
                                    ))}
                                    {activeCurrentLocs.length === 0 && <span className="text-sm text-slate-400 shrink-0">請至詞庫新增地點</span>}
                                </div>
                                <div className="shrink-0 border-l pl-2 pb-1">
                                    <button 
                                        onClick={() => {
                                            setPlanLocationId('');
                                            setPlanDates([]);
                                            setPlanStartTime('');
                                            setPlanEndTime('');
                                            setPlanRemarks('');
                                            setEditPlanId(null);
                                            setShowPlanModal(true);
                                        }}
                                        className={\`h-8 px-4 rounded-lg font-bold text-white shadow-sm flex items-center gap-1 text-xs \${mainColorClass}\`}
                                    >
                                        <Plus size={14}/> 新增
                                    </button>
                                </div>
                            </div>`;

code = code.replace(oldPlanFormPattern, newPlanForm);

fs.writeFileSync('components/ShiftSystem.tsx', code);
