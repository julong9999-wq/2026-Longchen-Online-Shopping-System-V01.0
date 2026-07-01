const fs = require('fs');
let code = fs.readFileSync('components/ShiftSystem.tsx', 'utf8');

const oldPlanFormPattern = /<div className="bg-white p-2 rounded-xl shadow-sm border border-slate-200 flex flex-col gap-1\.5">\s*<div>\s*<div className="flex flex-wrap gap-1\.5">[\s\S]*?<button onClick=\{handleSavePlan\}[\s\S]*?<\/button>\s*<\/div>\s*<\/div>/;

const newPlanForm = `<div className="bg-white p-2 rounded-xl shadow-sm border border-slate-200 flex flex-col gap-2">
                            <div className="flex justify-between items-center">
                                <div className="flex flex-wrap gap-1.5">
                                    <button 
                                        onClick={() => setPlanListLocFilter('all')}
                                        className={\`px-3 py-1.5 rounded-lg border text-xs font-bold transition-colors \${planListLocFilter === 'all' ? activeBtnClass : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'}\`}
                                    >全部</button>
                                    {activeCurrentLocs.map(l => (
                                        <button 
                                            key={l.id} 
                                            onClick={() => setPlanListLocFilter(l.id)}
                                            className={\`px-3 py-1.5 rounded-lg border text-xs font-bold transition-colors \${planListLocFilter === l.id ? activeBtnClass : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'}\`}
                                        >
                                            {l.name}
                                        </button>
                                    ))}
                                    {activeCurrentLocs.length === 0 && <span className="text-sm text-slate-400">請先至詞庫新增顯示的打工地點</span>}
                                </div>
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
                                    className={\`shrink-0 px-4 py-1.5 rounded-lg font-bold text-white shadow-sm flex items-center gap-1 \${mainColorClass}\`}
                                >
                                    <Plus size={16}/> 新增
                                </button>
                            </div>
                        </div>`;

code = code.replace(oldPlanFormPattern, newPlanForm);

const oldQuickEditJSX = /\{quickEditDate && \([\s\S]*?\{editPlanId \? '更新' : '存檔'\}\s*<\/button>[\s\S]*?<\/div>\s*<\/div>\s*\)\}/;

const newPlanModalJSX = `{(showPlanModal || quickEditDate) && (() => {
            const isQuickEdit = !!quickEditDate;
            const title = editPlanId ? '編輯排班' : isQuickEdit ? '快速新增排班' : '新增排班';
            const closeFn = () => {
                if (isQuickEdit) {
                    setQuickEditDate(null);
                } else {
                    setShowPlanModal(false);
                }
                setPlanDates([]); setPlanStartTime(''); setPlanEndTime(''); setPlanRemarks(''); setEditPlanId(null); setPlanLocationId('');
            };
            return (
                <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/40 backdrop-blur-sm sm:items-center sm:justify-center">
                    <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md shadow-xl flex flex-col overflow-hidden animate-slide-up">
                        <div className="flex items-center justify-between p-4 border-b">
                            <h3 className="text-lg font-bold text-slate-800">{title}</h3>
                            <button onClick={closeFn} className="p-1 rounded-full text-slate-400 hover:bg-slate-100"><X size={20}/></button>
                        </div>
                        <div className="p-4 flex flex-col gap-3">
                            <div className="flex flex-wrap gap-1.5">
                                {activeCurrentLocs.map(l => (
                                    <button 
                                        key={l.id} 
                                        onClick={() => setPlanLocationId(l.id)}
                                        className={\`px-3 py-1.5 rounded-lg border text-sm font-bold transition-colors \${planLocationId === l.id ? activeBtnClass : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'}\`}
                                    >
                                        {l.name}
                                    </button>
                                ))}
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <input type="date" className="flex-1 h-10 px-3 border rounded-lg bg-slate-50 font-mono text-sm" disabled={!!editPlanId} value={planDates.length === 1 ? planDates[0] : ''} onChange={e => {
                                    const d = e.target.value;
                                    if (editPlanId) {
                                        setPlanDates([d]);
                                        return;
                                    }
                                    if (d && !planDates.includes(d)) {
                                        setPlanDates([...planDates, d].sort());
                                    } else if (d && planDates.includes(d) && planDates.length === 1) {
                                        setPlanDates([d]);
                                    }
                                }} />
                                {planDates.length > 0 && !editPlanId && (
                                    <div className="flex flex-wrap gap-1">
                                        {planDates.map(date => (
                                            <span key={date} className={\`bg-\${mainColor}-100 text-\${mainColor}-700 px-2 py-1 rounded text-xs font-bold flex items-center gap-1 shadow-sm\`}>
                                                {date}
                                                <button onClick={() => setPlanDates(planDates.filter(d => d !== date))} className="hover:text-rose-500 rounded-full bg-white/50 p-0.5"><X size={12}/></button>
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <div className="flex gap-2 items-center">
                                <input type="time" step="1800" className="flex-1 h-10 px-3 border rounded-lg bg-slate-50 font-mono text-sm" required value={planStartTime} onChange={e => setPlanStartTime(e.target.value)} />
                                <span className="text-slate-400">~</span>
                                <input type="time" step="1800" className="flex-1 h-10 px-3 border rounded-lg bg-slate-50 font-mono text-sm" required value={planEndTime} onChange={e => setPlanEndTime(e.target.value)} />
                            </div>
                            <div>
                                <input type="text" className="w-full h-10 px-3 border rounded-lg bg-slate-50 text-sm" value={planRemarks} onChange={e => setPlanRemarks(e.target.value)} placeholder="備註說明" />
                            </div>
                            <button onClick={() => { handleSavePlan(); closeFn(); }} disabled={!planLocationId || planDates.length === 0 || !planStartTime || !planEndTime} className={\`w-full py-2.5 rounded-lg font-bold text-white transition-opacity \${(!planLocationId || planDates.length === 0 || !planStartTime || !planEndTime) ? 'opacity-50' : ''} \${mainColorClass}\`}>
                                {editPlanId ? '更新' : '存檔'}
                            </button>
                            {editPlanId && (
                                <button onClick={() => { handleDeleteRecord(editPlanId); closeFn(); }} className="w-full py-2.5 rounded-lg font-bold text-rose-500 bg-rose-50 border border-rose-200 mt-1">
                                    刪除此排班
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            );
        })}`;

code = code.replace(oldQuickEditJSX, newPlanModalJSX);

fs.writeFileSync('components/ShiftSystem.tsx', code);
