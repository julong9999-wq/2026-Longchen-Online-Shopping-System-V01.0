const fs = require('fs');
let code = fs.readFileSync('components/ShiftSystem.tsx', 'utf8');

const locModalJSX = `{showLocModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl flex flex-col overflow-hidden">
                        <div className="flex items-center justify-between p-4 border-b">
                            <h3 className="text-lg font-bold text-slate-800">{locForm.id ? '編輯地點' : '新增地點'}</h3>
                            <button onClick={()=>setShowLocModal(false)} className="p-1 rounded-full text-slate-400 hover:bg-slate-100"><X size={20}/></button>
                        </div>
                        <div className="p-4 flex flex-col gap-4">
                            <div>
                                <label className="text-xs font-bold text-slate-500 block mb-1">地點名稱</label>
                                <input type="text" className="w-full h-10 px-3 border rounded-lg bg-slate-50" value={locForm.name || ''} onChange={e => setLocForm({...locForm, name: e.target.value})} />
                            </div>
                            <div className="flex items-center gap-6">
                                <div className="flex items-center gap-2">
                                    <label className="text-xs font-bold text-slate-500">顯示 (Y/N)</label>
                                    <input type="checkbox" checked={locForm.isActive === undefined ? true : locForm.isActive} onChange={e => setLocForm({...locForm, isActive: e.target.checked})} className="w-4 h-4" />
                                </div>
                                <div className="flex items-center gap-2">
                                    <label className="text-xs font-bold text-slate-500">休息 (Y/N)</label>
                                    <input type="checkbox" checked={locForm.hasBreak === true} onChange={e => setLocForm({...locForm, hasBreak: e.target.checked})} className="w-4 h-4" />
                                </div>
                            </div>
                            <div className="text-xs text-slate-400 bg-slate-50 p-2 rounded">
                                休息(Y): 每做滿 4 小時休息 1 小時 (排班滿5小時扣1小時)
                            </div>
                            <button onClick={handleSaveLoc} disabled={!locForm.name} className={\`w-full py-2 rounded-lg font-bold text-white transition-opacity \${!locForm.name ? 'opacity-50' : ''} \${mainColorClass}\`}>儲存</button>
                        </div>
                    </div>
                </div>
            )}
            
            {showWageModal && (`;

code = code.replace(/{showWageModal && \(/, locModalJSX);

fs.writeFileSync('components/ShiftSystem.tsx', code);
