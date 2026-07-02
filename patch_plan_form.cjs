const fs = require('fs');
let code = fs.readFileSync('components/ShiftSystem.tsx', 'utf8');

const oldPlanFormPattern = /<div className="flex items-center gap-2 w-full overflow-hidden">[\s\S]*?<Plus size=\{14\}\/> 新增\s*<\/button>\s*<\/div>\s*<\/div>/;

const newPlanForm = `<div className="flex flex-col gap-2 w-full">
                                <div className="flex flex-wrap items-center gap-1.5">
                                    <button 
                                        onClick={() => setPlanListLocFilter('all')}
                                        className={\`px-3 h-8 rounded-lg border text-xs font-bold transition-colors \${planListLocFilter === 'all' ? activeBtnClass : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'}\`}
                                    >全部</button>
                                    {activeCurrentLocs.map(l => (
                                        <button 
                                            key={l.id} 
                                            onClick={() => setPlanListLocFilter(l.id)}
                                            className={\`px-3 h-8 rounded-lg border text-xs font-bold transition-colors \${planListLocFilter === l.id ? activeBtnClass : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'}\`}
                                        >
                                            {l.name}
                                        </button>
                                    ))}
                                    {activeCurrentLocs.length === 0 && <span className="text-sm text-slate-400 shrink-0">請至詞庫新增地點</span>}
                                </div>
                                <div className="border-t border-slate-100 pt-2 flex justify-end">
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
                                        className={\`h-9 px-6 rounded-lg font-bold text-white shadow-sm flex items-center gap-1 text-sm \${mainColorClass}\`}
                                    >
                                        <Plus size={16}/> 新增排班
                                    </button>
                                </div>
                            </div>`;

code = code.replace(oldPlanFormPattern, newPlanForm);

const oldDateInputSection = /<div className="w-full h-10 px-2 border rounded-lg bg-slate-50 flex items-center gap-1\.5 overflow-x-auto no-scrollbar relative">[\s\S]*?\{planDates\.length === 0 && <span className="text-slate-400 text-sm ml-1">未選擇<\/span>\}\s*<\/div>/;

const newDateInputSection = `<div className="flex flex-col gap-1.5 w-full">
                                <div className="relative flex items-center justify-center h-10 px-3 bg-slate-200 text-slate-700 rounded-lg font-bold text-sm cursor-pointer hover:bg-slate-300 transition-colors w-full">
                                    <CalendarIcon size={16} className="mr-1"/> 選擇日期
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
                                <div className="w-full h-[90px] p-2 border rounded-lg bg-slate-50 flex flex-wrap gap-1.5 overflow-y-auto content-start items-start">
                                    {planDates.map(date => (
                                        <span key={date} className={\`bg-\${mainColor}-100 text-\${mainColor}-700 px-2 py-1 rounded text-xs font-bold flex items-center gap-1 shadow-sm shrink-0\`}>
                                            {date}
                                            {!editPlanId && (
                                                <button onClick={() => setPlanDates(planDates.filter(d => d !== date))} className="hover:text-rose-500 rounded-full bg-white/50 p-0.5 ml-0.5">
                                                    <X size={12}/>
                                                </button>
                                            )}
                                        </span>
                                    ))}
                                    {planDates.length === 0 && (
                                        <div className="w-full h-full flex items-center justify-center text-slate-400 text-sm font-bold">
                                            未選擇
                                        </div>
                                    )}
                                </div>
                            </div>`;

code = code.replace(oldDateInputSection, newDateInputSection);

fs.writeFileSync('components/ShiftSystem.tsx', code);
