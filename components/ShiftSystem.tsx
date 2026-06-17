import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Home, Calendar as CalendarIcon, FileText, Calculator, Edit, Trash2, X, ChevronLeft, ChevronRight, Plus, BarChart2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid } from 'recharts';
import { ShiftPerson, ShiftLocation, ShiftWage, ShiftRecord } from '../types';

import { db } from '../firebase';
import { collection, onSnapshot, doc, setDoc, deleteDoc, writeBatch, updateDoc } from 'firebase/firestore';
import { generateUUID } from '../utils';

interface ShiftSystemProps {
    onNavigateHome: () => void;
}

type ShiftView = 'schedule' | 'plan' | 'salary' | 'dictionary' | 'analysis';

// Generate days of month
const getDaysInMonth = (year: number, month: number) => new Date(year, month, 0).getDate();
const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month - 1, 1).getDay();

const ShiftSystem: React.FC<ShiftSystemProps> = ({ onNavigateHome }) => {
    const [view, setView] = useState<ShiftView>('plan');
    const [activePerson, setActivePerson] = useState<ShiftPerson>('禹君');
    
    const [locations, setLocations] = useState<ShiftLocation[]>([]);
    const [wages, setWages] = useState<ShiftWage[]>([]);
    const [records, setRecords] = useState<ShiftRecord[]>([]);

    useEffect(() => {
        const unsubLoc = onSnapshot(collection(db, 'shiftLocations'), snap => {
            setLocations(snap.docs.map(d => d.data() as ShiftLocation));
        });
        const unsubWages = onSnapshot(collection(db, 'shiftWages'), snap => {
            setWages(snap.docs.map(d => d.data() as ShiftWage));
        });
        const unsubRecords = onSnapshot(collection(db, 'shiftRecords'), snap => {
            setRecords(snap.docs.map(d => d.data() as ShiftRecord));
        });
        return () => { unsubLoc(); unsubWages(); unsubRecords(); };
    }, []);

    // -------- Plan View State --------
        const [planLocationId, setPlanLocationId] = useState('');
    const [planDate, setPlanDate] = useState('');
    const [planStartTime, setPlanStartTime] = useState('');
    const [planEndTime, setPlanEndTime] = useState('');
    const [planRemarks, setPlanRemarks] = useState('');
    const [editPlanId, setEditPlanId] = useState<string | null>(null);
    
    const [quickEditDate, setQuickEditDate] = useState<string | null>(null);
    const [salaryLocFilter, setSalaryLocFilter] = useState<string>('all');
    const [analysisYear, setAnalysisYear] = useState<string>(new Date().getFullYear().toString());
    const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (salaryLocFilter !== 'all') {
            const isValid = locations.some(l => l.id === salaryLocFilter && l.person === activePerson && l.isActive);
            if (!isValid) {
                setSalaryLocFilter('all');
            }
        }
    }, [locations, activePerson, salaryLocFilter]);

    const handlePointerDownDay = (dateStr: string) => {
        longPressTimerRef.current = setTimeout(() => {
            setQuickEditDate(dateStr);
            setPlanDate(dateStr);
            setPlanStartTime('');
            setPlanEndTime('');
            setPlanRemarks('');
            setPlanLocationId('');
            setEditPlanId(null);
            // Optionally auto-populate if there's an existing record
            const existing = records.filter(r => r.person === activePerson && r.date === dateStr);
            if (existing.length > 0) {
                const r = existing[0];
                setPlanLocationId(r.locationId);
                setPlanStartTime(r.startTime);
                setPlanEndTime(r.endTime);
                setPlanRemarks(r.remarks || '');
                setEditPlanId(r.id);
            }
        }, 500);
    };
    const handlePointerUpDay = () => {
        if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
    };



    useEffect(() => {
        const currentLocsForActive = locations.filter(l => l.person === activePerson && l.isActive);
        if (!planLocationId || !currentLocsForActive.find(l => l.id === planLocationId)) {
            if (currentLocsForActive.length > 0) {
                setPlanLocationId(currentLocsForActive[0].id);
            } else {
                setPlanLocationId('');
            }
        }
    }, [locations, activePerson]);
    
    // -------- Dictionary View State --------
    const [showLocModal, setShowLocModal] = useState(false);
    const [locForm, setLocForm] = useState<Partial<ShiftLocation>>({});
    const [activeLocId, setActiveLocId] = useState(''); // for sub-table
    const [showWageModal, setShowWageModal] = useState(false);
    const [wageForm, setWageForm] = useState<Partial<ShiftWage>>({});

    // -------- Schedule View State --------
    const [currentDate, setCurrentDate] = useState(new Date());

    // -------- Filters & Computed --------
    const currentLocs = useMemo(() => locations.filter(l => l.person === activePerson), [locations, activePerson]);
    const activeCurrentLocs = useMemo(() => currentLocs.filter(l => l.isActive), [currentLocs]);
    const currentRecords = useMemo(() => records.filter(r => r.person === activePerson).sort((a, b) => {
        const cmp = b.date.localeCompare(a.date);
        if (cmp !== 0) return cmp;
        return a.startTime.localeCompare(b.startTime);
    }), [records, activePerson]);
    const upcomingRecords = useMemo(() => {
        const today = new Date().toISOString().split('T')[0];
        return currentRecords.filter(r => r.date >= today).sort((a, b) => {
            const cmp = a.date.localeCompare(b.date);
            if (cmp !== 0) return cmp;
            return a.startTime.localeCompare(b.startTime);
        });
    }, [currentRecords]);

    // ==== Plan Functions ====
    const handleSavePlan = async () => {
        if (!planLocationId || !planDate || !planStartTime || !planEndTime) return;
        
        // Check duplicate (exclude current edit)
        const isDuplicate = records.some(r => r.id !== editPlanId && r.person === activePerson && r.date === planDate && r.startTime === planStartTime && r.endTime === planEndTime && r.locationId === planLocationId);
        if (isDuplicate) {
            alert('已有重複的排班資料（日期、時間、地點皆相同）！請確認後再存檔。');
            return;
        }

        if (editPlanId) {
            await updateDoc(doc(collection(db, 'shiftRecords'), editPlanId), {
                locationId: planLocationId,
                date: planDate,
                startTime: planStartTime,
                endTime: planEndTime,
                remarks: planRemarks
            });
        } else {
            const newRec: ShiftRecord = {
                id: generateUUID(),
                person: activePerson,
                locationId: planLocationId,
                date: planDate,
                startTime: planStartTime,
                endTime: planEndTime,
                remarks: planRemarks,
                createdAt: Date.now()
            };
            await setDoc(doc(collection(db, 'shiftRecords'), newRec.id), newRec);
        }
        setPlanDate(''); setPlanStartTime(''); setPlanEndTime(''); setPlanRemarks(''); setEditPlanId(null);
    };

    const handleEditRecord = (r: ShiftRecord) => {
        setPlanLocationId(r.locationId);
        setPlanDate(r.date);
        setPlanStartTime(r.startTime);
        setPlanEndTime(r.endTime);
        setPlanRemarks(r.remarks);
        setEditPlanId(r.id);
        setView('plan');
    };

    const handleDeleteRecord = async (id: string) => {
        if(confirm('確定刪除此排班？')) {
            await deleteDoc(doc(collection(db, 'shiftRecords'), id));
        }
    };

    // ==== Dictionary Functions ====
    const handleSaveLoc = async () => {
        if(!locForm.name) return;
        const isNew = !locForm.id;
        const docId = isNew ? generateUUID() : locForm.id!;
        const docData: ShiftLocation = {
            id: docId,
            person: activePerson,
            name: locForm.name!,
            isActive: locForm.isActive !== undefined ? locForm.isActive : true,
            hasBreak: locForm.hasBreak || false,
            createdAt: locForm.createdAt || Date.now()
        };
        await setDoc(doc(collection(db, 'shiftLocations'), docId), docData);
        setShowLocModal(false);
    };

    const handleSaveWage = async () => {
        if(!wageForm.effectiveDate || !wageForm.hourlyWage || !activeLocId) return;
        const isNew = !wageForm.id;
        const docId = isNew ? generateUUID() : wageForm.id!;
        const docData: ShiftWage = {
            id: docId,
            locationId: activeLocId,
            effectiveDate: wageForm.effectiveDate!,
            hourlyWage: Number(wageForm.hourlyWage),
            remarks: wageForm.remarks || '',
            createdAt: wageForm.createdAt || Date.now()
        };
        await setDoc(doc(collection(db, 'shiftWages'), docId), docData);
        setShowWageModal(false);
    };

    const handleDeleteLoc = async (id: string) => {
        if(confirm('確定刪除此地點及時薪紀錄？')) {
            await deleteDoc(doc(collection(db, 'shiftLocations'), id));
            const relatedWages = wages.filter(w => w.locationId === id);
            const batch = writeBatch(db);
            relatedWages.forEach(w => batch.delete(doc(collection(db, 'shiftWages'), w.id)));
            await batch.commit();
            if(activeLocId === id) setActiveLocId('');
        }
    };

    const handleDeleteWage = async (id: string) => {
        if(confirm('確定刪除此紀錄？')) {
            await deleteDoc(doc(collection(db, 'shiftWages'), id));
        }
    };

    // ==== Calculate Salary Functions ====
    const getWageRate = (locId: string, date: string) => {
        const wList = wages.filter(w => w.locationId === locId && w.effectiveDate <= date).sort((a, b) => b.effectiveDate.localeCompare(a.effectiveDate));
        return wList.length > 0 ? wList[0].hourlyWage : 0;
    };

    const calculateHours = (start: string, end: string, hasBreak: boolean = false) => {
        const [sh, sm] = start.split(':').map(Number);
        const [eh, em] = end.split(':').map(Number);
        let sMins = sh * 60 + sm;
        let eMins = eh * 60 + em;
        if (eMins < sMins) eMins += 24 * 60; // assumed overnight
        let hours = (eMins - sMins) / 60;
        if (hasBreak) {
            // 每 5 小時涵蓋 1 小時休息
            hours -= Math.floor(hours / 5);
        }
        return hours;
    };

    // Salary Stats
    const salaryStats = useMemo(() => {
        const pastMap = new Map<string, { yearMonth: string, locationId: string, hours: number, amount: number }>();
        let pastTotalHours = 0;
        let pastTotalAmount = 0;
        
        const futureMap = new Map<string, { yearMonth: string, locationId: string, hours: number, amount: number }>();
        let futureTotalHours = 0;
        let futureTotalAmount = 0;

        const today = new Date().toISOString().split('T')[0];

        currentRecords.forEach(r => {
            if (salaryLocFilter !== 'all' && r.locationId !== salaryLocFilter) return;

            const isStrictFuture = r.date > today;
            const ym = r.date.substring(0, 7);
            
            const locInfo = locations.find(l => l.id === r.locationId);
            const hours = calculateHours(r.startTime, r.endTime, locInfo?.hasBreak);
            const rate = getWageRate(r.locationId, r.date);
            const amt = hours * rate;
            
            if (isStrictFuture) {
                const key = `${ym}_${r.locationId}`;
                if(!futureMap.has(key)) futureMap.set(key, { yearMonth: ym, locationId: r.locationId, hours: 0, amount: 0 });
                const stats = futureMap.get(key)!;
                stats.hours += hours;
                stats.amount += amt;

                futureTotalHours += hours;
                futureTotalAmount += amt;
            } else {
                const key = `${ym}_${r.locationId}`;
                if(!pastMap.has(key)) pastMap.set(key, { yearMonth: ym, locationId: r.locationId, hours: 0, amount: 0 });
                const stats = pastMap.get(key)!;
                stats.hours += hours;
                stats.amount += amt;

                pastTotalHours += hours;
                pastTotalAmount += amt;
            }
        });

        return { 
            pastItems: Array.from(pastMap.values()).sort((a,b) => b.yearMonth.localeCompare(a.yearMonth)), 
            futureItems: Array.from(futureMap.values()).sort((a,b) => b.yearMonth.localeCompare(a.yearMonth)),
            pastTotalHours, pastTotalAmount,
            futureTotalHours, futureTotalAmount,
            totalHours: pastTotalHours + futureTotalHours,
            totalAmount: pastTotalAmount + futureTotalAmount,
        };
    }, [currentRecords, locations, wages, salaryLocFilter]);

    // Analysis Stats
    const analysisStats = useMemo(() => {
        const ymMap = new Map<string, { yearMonth: string, '禹君': number, '禹辰': number }>();
        const locMap = new Map<string, { locationName: string, '禹君': number, '禹辰': number }>();

        records.forEach(r => {
            const ym = r.date.substring(0, 7);
            const p = r.person as '禹君' | '禹辰';
            const locName = locations.find(l => l.id === r.locationId)?.name || '未知';
            
            const locInfo2 = locations.find(l => l.id === r.locationId);
            const hours = calculateHours(r.startTime, r.endTime, locInfo2?.hasBreak);
            const rate = getWageRate(r.locationId, r.date);
            const amt = hours * rate;

            // Update ymMap
            if (!ymMap.has(ym)) {
                ymMap.set(ym, { yearMonth: ym, '禹君': 0, '禹辰': 0 });
            }
            ymMap.get(ym)![p] += amt;

            // Update locMap
            if (!locMap.has(locName)) {
                locMap.set(locName, { locationName: locName, '禹君': 0, '禹辰': 0 });
            }
            locMap.get(locName)![p] += amt;
        });

        return {
            ymData: Array.from(ymMap.values()).sort((a, b) => b.yearMonth.localeCompare(a.yearMonth)),
            locData: Array.from(locMap.values())
        };
    }, [records, locations, wages]);

    // ==== Person Colors ====
    const getPersonColor = (p: ShiftPerson) => p === '禹君' ? 'orange' : 'purple';
    const mainColor = getPersonColor(activePerson);
    const mainColorClass = mainColor === 'orange' ? 'bg-orange-600 text-white' : 'bg-purple-600 text-white';
    const activeBtnClass = mainColor === 'orange' ? 'bg-orange-100 border-orange-600 text-orange-800' : 'bg-purple-100 border-purple-600 text-purple-800';

    const colorShades = mainColor === 'orange' ? 
        [
            'bg-orange-50 text-orange-900 border-orange-200',
            'bg-orange-200 text-orange-900 border-orange-300', 
            'bg-orange-400 text-white border-orange-500', 
            'bg-orange-600 text-white border-orange-700',
            'bg-orange-800 text-white border-orange-900'
        ] : 
        [
            'bg-purple-50 text-purple-900 border-purple-200',
            'bg-purple-200 text-purple-900 border-purple-300', 
            'bg-purple-400 text-white border-purple-500', 
            'bg-purple-600 text-white border-purple-700',
            'bg-purple-800 text-white border-purple-900'
        ];
    const locColors: Record<string, string> = {};
    currentLocs.forEach((l, i) => {
         locColors[l.id] = colorShades[i % colorShades.length];
    });

    // UI Render Helpers
    const renderPersonToggle = () => (
        <div className="flex bg-white rounded-lg shadow-sm border p-1 shrink-0">
            <button 
                onClick={() => setActivePerson('禹君')}
                className={`flex-1 py-2 text-sm font-bold rounded-md transition-colors ${activePerson === '禹君' ? 'bg-orange-500 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-100'}`}
            >
                禹君
            </button>
            <button 
                onClick={() => setActivePerson('禹辰')}
                className={`flex-1 py-2 text-sm font-bold rounded-md transition-colors ${activePerson === '禹辰' ? 'bg-purple-500 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-100'}`}
            >
                禹辰
            </button>
        </div>
    );

    return (
        <div className="flex flex-col h-screen bg-slate-50 font-sans mx-auto max-w-lg lg:max-w-4xl shadow-xl border-x">
            {/* Main Tabs Navigation (Bottom) */}
            <div className="flex items-center bg-pink-100 border-t border-pink-200 mt-auto order-last shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-20 pb-safe px-1 gap-1 py-1">
                <button onClick={() => setView('schedule')} className={`flex-1 py-2 rounded-xl flex flex-col items-center gap-1 transition-colors ${view === 'schedule' ? 'bg-pink-300 text-pink-900' : 'text-pink-600/70 hover:bg-pink-200/50'}`}>
                    <CalendarIcon size={20} /><span className="text-[10px] font-bold">排班表</span>
                </button>
                <button onClick={() => setView('plan')} className={`flex-1 py-2 rounded-xl flex flex-col items-center gap-1 transition-colors ${view === 'plan' ? 'bg-pink-300 text-pink-900' : 'text-pink-600/70 hover:bg-pink-200/50'}`}>
                    <Edit size={20} /><span className="text-[10px] font-bold">計畫</span>
                </button>
                <button onClick={() => setView('salary')} className={`flex-1 py-2 rounded-xl flex flex-col items-center gap-1 transition-colors ${view === 'salary' ? 'bg-pink-300 text-pink-900' : 'text-pink-600/70 hover:bg-pink-200/50'}`}>
                    <Calculator size={20} /><span className="text-[10px] font-bold">薪資</span>
                </button>
                <button onClick={() => setView('analysis')} className={`flex-1 py-2 rounded-xl flex flex-col items-center gap-1 transition-colors ${view === 'analysis' ? 'bg-pink-300 text-pink-900' : 'text-pink-600/70 hover:bg-pink-200/50'}`}>
                    <BarChart2 size={20} /><span className="text-[10px] font-bold">分析</span>
                </button>
                <button onClick={() => setView('dictionary')} className={`flex-1 py-2 rounded-xl flex flex-col items-center gap-1 transition-colors ${view === 'dictionary' ? 'bg-pink-300 text-pink-900' : 'text-pink-600/70 hover:bg-pink-200/50'}`}>
                    <FileText size={20} /><span className="text-[10px] font-bold">詞庫</span>
                </button>
                <button onClick={onNavigateHome} className="flex-1 py-2 rounded-xl flex flex-col items-center gap-1 text-pink-600/70 hover:bg-pink-200/50 transition-colors">
                    <Home size={20} /><span className="text-[10px] font-bold">返回</span>
                </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-hidden flex flex-col relative z-10 w-full max-w-[600px] mx-auto">
                <div className="p-4 shrink-0 pb-0 hidden"></div>{/* Spacing placeholder */}
                
                {/* ---------- PLAN VIEW ---------- */}
                {view === 'plan' && (
                    <div className="p-2 flex-1 overflow-y-auto flex flex-col gap-1.5">
                        {renderPersonToggle()}
                        <div className="bg-white p-2 rounded-xl shadow-sm border border-slate-200 flex flex-col gap-1.5">
                            <div>
                                <div className="flex flex-wrap gap-1.5">
                                    {activeCurrentLocs.map(l => (
                                        <button 
                                            key={l.id} 
                                            onClick={() => setPlanLocationId(l.id)}
                                            className={`px-3 py-1 rounded-lg border text-sm font-bold transition-colors ${planLocationId === l.id ? activeBtnClass : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'}`}
                                        >
                                            {l.name}
                                        </button>
                                    ))}
                                    {activeCurrentLocs.length === 0 && <span className="text-sm text-slate-400">請先至詞庫新增顯示的打工地點</span>}
                                </div>
                            </div>
                            <div>
                                <div className="flex gap-1.5 mb-1.5">
                                    <input type="date" className="flex-1 h-9 px-2 border rounded-lg bg-slate-50 font-mono text-sm" value={planDate} onChange={e => setPlanDate(e.target.value)} />
                                </div>
                                <div className="flex gap-1.5 items-center">
                                    <input type="time" step="1800" className="flex-1 h-9 px-2 border rounded-lg bg-slate-50 font-mono text-sm" required value={planStartTime} onChange={e => setPlanStartTime(e.target.value)} />
                                    <span className="text-slate-400">~</span>
                                    <input type="time" step="1800" className="flex-1 h-9 px-2 border rounded-lg bg-slate-50 font-mono text-sm" required value={planEndTime} onChange={e => setPlanEndTime(e.target.value)} />
                                </div>
                            </div>
                            <div>
                                <input type="text" className="w-full h-9 px-2 border rounded-lg bg-slate-50 text-sm" value={planRemarks} onChange={e => setPlanRemarks(e.target.value)} placeholder="備註說明" />
                            </div>
                            <div className="flex gap-1.5 mt-1">
                                <button onClick={() => {setPlanDate(''); setPlanStartTime(''); setPlanEndTime(''); setPlanRemarks(''); setEditPlanId(null);}} className="flex-1 h-9 rounded-lg border border-slate-300 font-bold text-slate-600">取消</button>
                                <button onClick={handleSavePlan} disabled={!planLocationId || !planDate || !planStartTime || !planEndTime} className={`flex-1 h-9 rounded-lg font-bold text-white transition-opacity ${!planLocationId || !planDate || !planStartTime || !planEndTime ? 'opacity-50' : ''} ${mainColorClass}`}>{editPlanId ? '更新' : '存檔'}</button>
                            </div>
                        </div>

                        <div className="mt-1">
                            <h3 className="font-bold text-slate-700 mb-2 flex items-center gap-2"><div className={`w-1.5 h-4 rounded-full bg-${mainColor}-500`}></div>即將到來的排班</h3>
                            <div className="flex flex-col gap-1.5">
                                {upcomingRecords.map(r => (
                                    <div key={r.id} className="bg-white p-1.5 rounded-lg border border-slate-100 flex justify-between items-center shadow-sm text-sm overflow-hidden">
                                        <div className="flex items-center gap-2 flex-1 overflow-hidden whitespace-nowrap">
                                            <span className="font-mono text-slate-800 font-bold shrink-0">{r.date}</span>
                                            <span className={`text-[10px] px-1.5 py-0.5 rounded bg-${mainColor}-100 text-${mainColor}-700 font-bold shrink-0`}>{currentLocs.find(l=>l.id===r.locationId)?.name || '未知'}</span>
                                            <span className="font-mono font-bold text-slate-600 shrink-0">{r.startTime}-{r.endTime}</span>
                                            {r.remarks && <span className="text-slate-400 text-xs truncate ml-1">{r.remarks}</span>}
                                        </div>
                                        <div className="flex gap-1 shrink-0 ml-2">
                                            <button onClick={() => handleEditRecord(r)} className="text-blue-400 hover:text-blue-600 p-1"><Edit size={16}/></button>
                                            <button onClick={() => handleDeleteRecord(r.id)} className="text-rose-400 hover:text-rose-600 p-1"><Trash2 size={16}/></button>
                                        </div>
                                    </div>
                                ))}
                                {upcomingRecords.length === 0 && <div className="text-center py-6 text-slate-400 text-sm bg-white rounded-lg border border-slate-100">尚無即將到來的排班</div>}
                            </div>
                        </div>
                    </div>
                )}

                {/* ---------- DICTIONARY VIEW ---------- */}
                {view === 'dictionary' && (
                    <div className="p-2 md:p-4 flex-1 overflow-y-auto flex flex-col gap-2">
                        {renderPersonToggle()}
                        
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                            <div className="p-3 bg-slate-50 border-b flex justify-between items-center">
                                <h3 className="font-bold text-slate-700 text-sm">打工地點設定</h3>
                                <button onClick={() => {setLocForm({isActive: true}); setShowLocModal(true);}} className={`bg-${mainColor}-600 text-white px-2 py-1 rounded text-xs font-bold flex items-center gap-1`}><Plus size={14}/>新增</button>
                            </div>
                            <table className="w-full text-sm text-left">
                                <thead className="bg-slate-100 text-slate-500">
                                    <tr><th className="p-2 w-full font-bold">打工地點</th><th className="p-2 font-bold whitespace-nowrap text-center">顯示(Y/N)</th><th className="p-2 font-bold whitespace-nowrap text-center">休息(Y/N)</th><th className="p-2"></th></tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {currentLocs.map(l => (
                                        <tr key={l.id} className={`hover:bg-slate-50 cursor-pointer ${activeLocId === l.id ? 'bg-blue-50/50' : ''}`} onClick={() => setActiveLocId(l.id === activeLocId ? '' : l.id)}>
                                            <td className="p-2 font-bold text-slate-700 w-full">{l.name}</td>
                                            <td className="p-2 text-center">{l.isActive ? <span className="text-emerald-600 font-bold">Y</span>:<span className="text-rose-500">N</span>}</td>
                                            <td className="p-2 text-center">{l.hasBreak ? <span className="text-orange-500 font-bold">Y</span>:<span className="text-slate-400">N</span>}</td>
                                            <td className="p-0 pr-1 text-right whitespace-nowrap">
                                                <div className="flex items-center justify-end gap-1">
                                                <button onClick={(e) => {e.stopPropagation(); setLocForm(l); setShowLocModal(true);}} className="text-blue-500 p-2"><Edit size={16}/></button>
                                                <button onClick={(e) => {e.stopPropagation(); handleDeleteLoc(l.id);}} className="text-rose-500 p-2"><Trash2 size={16}/></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {currentLocs.length === 0 && <tr><td colSpan={3} className="p-4 text-center text-slate-400">目前無打工地點資料</td></tr>}
                                </tbody>
                            </table>
                        </div>

                        {activeLocId && (
                            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mt-2 border-l-4" style={{borderLeftColor: mainColor === 'orange' ? '#ea580c' : '#9333ea'}}>
                                <div className="p-3 bg-slate-50 border-b flex justify-between items-center">
                                    <h3 className="font-bold text-slate-700 text-sm">[{currentLocs.find(l=>l.id===activeLocId)?.name}] 時薪紀錄</h3>
                                    <button onClick={() => {setWageForm({effectiveDate: new Date().toISOString().split('T')[0]}); setShowWageModal(true);}} className={`bg-${mainColor}-100 text-${mainColor}-700 px-2 py-1 rounded text-xs font-bold flex items-center gap-1`}><Plus size={14}/>新增</button>
                                </div>
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-slate-100 text-slate-500">
                                        <tr><th className="p-2 font-bold">日期</th><th className="p-2 font-bold text-right">時薪</th><th className="p-2 font-bold">備註</th><th className="p-2"></th></tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {wages.filter(w=>w.locationId===activeLocId).sort((a,b)=>b.effectiveDate.localeCompare(a.effectiveDate)).map(w => (
                                            <tr key={w.id} className="hover:bg-slate-50">
                                                <td className="p-2 font-mono text-xs">{w.effectiveDate}</td>
                                                <td className="p-2 text-right font-bold font-mono">${w.hourlyWage}</td>
                                                <td className="p-2 text-xs truncate max-w-[80px]">{w.remarks}</td>
                                                <td className="p-0 pr-1 text-right whitespace-nowrap">
                                                    <div className="flex items-center justify-end gap-1">
                                                    <button onClick={() => {setWageForm(w); setShowWageModal(true);}} className="text-blue-500 p-2"><Edit size={16}/></button>
                                                    <button onClick={() => handleDeleteWage(w.id)} className="text-rose-500 p-2"><Trash2 size={16}/></button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}

                {/* ---------- SCHEDULE VIEW ---------- */}
                {view === 'schedule' && (() => {
                    const year = currentDate.getFullYear();
                    const month = currentDate.getMonth() + 1;
                    const days = getDaysInMonth(year, month);
                    const firstDay = getFirstDayOfMonth(year, month);
                    const blanks = Array.from({ length: firstDay }, (_, i) => i);
                    const daysArray = Array.from({ length: days }, (_, i) => i + 1);
                    
                    const handlePrevMonth = () => setCurrentDate(new Date(year, month - 2, 1));
                    const handleNextMonth = () => setCurrentDate(new Date(year, month, 1));
                    const handleCurrentMonth = () => setCurrentDate(new Date());



                    return (
                        <div className="p-2 md:p-4 flex-1 flex flex-col gap-2 overflow-hidden">
                            {renderPersonToggle()}
                            <div className="flex justify-between items-center bg-white p-1 rounded-xl border border-slate-200 shadow-sm shrink-0">
                                <button onClick={handlePrevMonth} className="p-2 hover:bg-slate-100 rounded-lg text-slate-600"><ChevronLeft size={20}/></button>
                                <button onClick={handleCurrentMonth} className="font-bold text-lg text-slate-800 bg-slate-50 px-4 py-1.5 rounded-lg hover:bg-slate-100">{year}年 {month.toString().padStart(2, '0')}月</button>
                                <button onClick={handleNextMonth} className="p-2 hover:bg-slate-100 rounded-lg text-slate-600"><ChevronRight size={20}/></button>
                            </div>
                            <div className="flex flex-wrap gap-2 px-1 shrink-0">
                                {currentLocs.map(l => (
                                    <div key={l.id} className="flex items-center gap-1">
                                        <div className={`w-3 h-3 rounded-sm ${locColors[l.id]}`}></div>
                                        <span className="text-xs text-slate-600 font-bold">{l.name}</span>
                                    </div>
                                ))}
                            </div>
                            <div className="flex-1 bg-white shadow-sm border-y sm:border sm:rounded-xl border-slate-200 flex flex-col overflow-hidden">
                                <div className="grid grid-cols-7 border-b text-center bg-slate-50 shrink-0">
                                    {['日','一','二','三','四','五','六'].map((d,i) => <div key={i} className={`py-1 md:py-2 text-xs font-bold ${i===0||i===6?'text-red-500':'text-slate-500'}`}>{d}</div>)}
                                </div>
                                <div className="flex-1 grid grid-cols-7 grid-rows-[repeat(auto-fit,minmax(0,1fr))] auto-rows-fr">
                                    {blanks.map(b => <div key={`b-${b}`} className="border-r border-b p-1 bg-slate-50/50"></div>)}
                                    {daysArray.map(d => {
                                        const dStr = `${year}-${month.toString().padStart(2, '0')}-${d.toString().padStart(2, '0')}`;
                                        const dayRecs = currentRecords.filter(r => r.date === dStr).sort((a, b) => a.startTime.localeCompare(b.startTime));
                                        const isToday = dStr === new Date().toISOString().split('T')[0];
                                        const isPast = dStr < new Date().toISOString().split('T')[0];
                                        return (
                                            <div 
                                                key={d} 
                                                onPointerDown={() => handlePointerDownDay(dStr)}
                                                onPointerUp={handlePointerUpDay}
                                                onPointerCancel={handlePointerUpDay}
                                                onPointerLeave={handlePointerUpDay}
                                                className={`border-r border-b flex flex-col overflow-hidden select-none cursor-pointer hover:opacity-80 transition-opacity ${isToday ? `bg-${mainColor}-50` : isPast ? 'bg-slate-200/60' : 'bg-white'}`}
                                            >
                                                <div className={`text-[10px] md:text-sm font-mono font-bold text-center py-0.5 ${isToday ? `text-${mainColor}-700 bg-${mainColor}-100/50` : isPast ? 'text-slate-500 bg-slate-200' : 'text-slate-700 bg-slate-50/50'}`}>{d}</div>
                                                <div className="flex-1 flex flex-col p-px md:p-0.5 gap-px">
                                                    {dayRecs.map(r => {
                                                        const bClass = locColors[r.locationId] || `bg-${mainColor}-100 text-${mainColor}-900`;
                                                        return (
                                                        <div key={r.id} className={`${bClass} border flex flex-col items-center justify-around flex-1 min-h-[0] rounded-sm p-0.5 overflow-hidden`} title={`${currentLocs.find(l=>l.id===r.locationId)?.name}`}>
                                                            <div className="text-[8px] md:text-[10px] truncate leading-none mb-0.5 opacity-90">{currentLocs.find(l=>l.id===r.locationId)?.name}</div>
                                                            <div className="text-[9px] md:text-xs font-bold leading-none">{r.startTime}</div>
                                                            <div className="text-[9px] md:text-xs font-bold leading-none">{r.endTime}</div>
                                                        </div>
                                                    )})}
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        </div>
                    );
                })()}

                {/* ---------- SALARY VIEW ---------- */}
                {view === 'salary' && (
                    <div className="p-2 flex-1 overflow-y-auto flex flex-col gap-2 relative">
                        {renderPersonToggle()}
                        <div className="bg-white rounded-xl shadow-sm border-2 border-slate-200 overflow-hidden flex-1 flex flex-col">
                            <div className="p-2 bg-slate-50 border-b flex flex-wrap gap-1.5 items-center">
                                <button
                                    onClick={() => setSalaryLocFilter('all')}
                                    className={`px-3 py-1 rounded-lg border text-sm font-bold transition-colors ${salaryLocFilter === 'all' ? activeBtnClass : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'}`}
                                >
                                    全部
                                </button>
                                {activeCurrentLocs.map(l => (
                                    <button 
                                        key={l.id} 
                                        onClick={() => setSalaryLocFilter(l.id)}
                                        className={`px-3 py-1 rounded-lg border text-sm font-bold transition-colors ${salaryLocFilter === l.id ? activeBtnClass : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'}`}
                                    >
                                        {l.name}
                                    </button>
                                ))}
                            </div>
                            <div className="flex-1 overflow-y-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-slate-100 text-slate-500 sticky top-0">
                                        <tr>
                                            <th className="p-2 font-bold whitespace-nowrap w-20">年月</th>
                                            <th className="p-2 font-bold whitespace-nowrap">工作地點</th>
                                            <th className="p-2 font-bold text-right whitespace-nowrap">時數</th>
                                            <th className="p-2 font-bold text-right whitespace-nowrap">金額</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {salaryStats.futureItems.map((fi, idx) => {
                                            const bClass = locColors[fi.locationId] || `bg-${mainColor}-100 text-${mainColor}-900`;
                                            return (
                                            <tr key={`f-${idx}`} className="hover:bg-red-50/80 bg-red-50/50 text-red-500">
                                                <td className="p-2 font-mono text-xs text-red-400">{fi.yearMonth}</td>
                                                <td className="p-2">
                                                    <span className={`px-2 py-0.5 rounded text-xs font-bold leading-none inline-block ${bClass} opacity-80`}>
                                                        {currentLocs.find(l=>l.id===fi.locationId)?.name || '未知'}
                                                    </span>
                                                </td>
                                                <td className="p-2 text-right font-mono text-red-400">(預){fi.hours.toFixed(1)}</td>
                                                <td className="p-2 text-right font-bold text-red-400 font-mono">${Math.round(fi.amount).toLocaleString()}</td>
                                            </tr>
                                        )})}

                                        {salaryStats.pastItems.map((cat, idx) => {
                                            const bClass = locColors[cat.locationId] || `bg-${mainColor}-100 text-${mainColor}-900`;
                                            return (
                                            <tr key={`p-${idx}`} className="hover:bg-slate-50">
                                                <td className="p-2 font-mono text-xs">{cat.yearMonth}</td>
                                                <td className="p-2">
                                                    <span className={`px-2 py-0.5 rounded text-xs font-bold leading-none inline-block ${bClass}`}>
                                                        {currentLocs.find(l=>l.id===cat.locationId)?.name || '未知'}
                                                    </span>
                                                </td>
                                                <td className="p-2 text-right font-mono">{cat.hours.toFixed(1)}</td>
                                                <td className="p-2 text-right font-bold text-emerald-600 font-mono">${Math.round(cat.amount).toLocaleString()}</td>
                                            </tr>
                                        )})}
                                        
                                        {salaryStats.pastItems.length === 0 && salaryStats.futureItems.length === 0 && <tr><td colSpan={4} className="p-4 text-center text-slate-400">目前無計算資料</td></tr>}
                                    </tbody>
                                    {(salaryStats.pastItems.length > 0 || salaryStats.futureItems.length > 0) && (
                                        <tfoot className="bg-blue-50 border-t border-blue-100 sticky bottom-0 z-10 shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
                                            <tr>
                                                <td colSpan={2} className="p-3 font-bold text-blue-900 text-right">合計</td>
                                                <td className="p-3 text-right font-mono font-bold text-blue-900">{salaryStats.totalHours.toFixed(1)}</td>
                                                <td className="p-3 text-right font-mono font-bold text-emerald-700">${Math.round(salaryStats.totalAmount).toLocaleString()}</td>
                                            </tr>
                                        </tfoot>
                                    )}
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {/* ---------- ANALYSIS VIEW ---------- */}
                {view === 'analysis' && (() => {
                    const availableYears = Array.from(new Set(analysisStats.ymData.map(d => d.yearMonth.substring(0, 4)))).sort((a,b)=>b.localeCompare(a));
                    const currentAnalysisYear = availableYears.includes(analysisYear) ? analysisYear : (availableYears[0] || new Date().getFullYear().toString());
                    const filteredYmData = analysisStats.ymData.filter(d => d.yearMonth.startsWith(currentAnalysisYear));

                    return (
                    <div className="p-2 flex-1 overflow-y-auto flex flex-col gap-2">
                        <div className="bg-white rounded-xl shadow-sm border-2 border-slate-200 p-2 shrink-0 flex flex-col">
                            <div className="flex justify-between items-center mb-2">
                                <h3 className="font-bold text-slate-700 text-sm flex items-center gap-2">
                                    <BarChart2 size={16} className="text-emerald-500" /> 每月薪資分析
                                </h3>
                                <select
                                    value={currentAnalysisYear}
                                    onChange={(e) => setAnalysisYear(e.target.value)}
                                    className="bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs font-bold text-slate-700 outline-none"
                                >
                                    {availableYears.map(y => <option key={y} value={y}>{y}年</option>)}
                                </select>
                            </div>
                            <div className="w-full overflow-y-auto max-h-96">
                                <div style={{ height: Math.max(200, filteredYmData.length * 45) }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart layout="vertical" data={filteredYmData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }} barCategoryGap={8}>
                                            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
                                            <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} />
                                            <YAxis type="category" dataKey="yearMonth" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} width={60} interval={0} />
                                            <Tooltip cursor={{ fill: '#F1F5F9' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }} />
                                            <Legend />
                                            <Bar dataKey="禹君" name="禹君" fill="#fdba74" radius={[0, 4, 4, 0]} />
                                            <Bar dataKey="禹辰" name="禹辰" fill="#d8b4fe" radius={[0, 4, 4, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                            
                            <div className="mt-2 border-2 border-slate-100 rounded-lg overflow-hidden">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-slate-50 text-slate-500 border-b border-slate-100">
                                        <tr>
                                            <th className="p-2 font-bold whitespace-nowrap">年月</th>
                                            <th className="p-2 font-bold text-right whitespace-nowrap text-orange-400">禹君</th>
                                            <th className="p-2 font-bold text-right whitespace-nowrap text-purple-400">禹辰</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {filteredYmData.map((d, i) => (
                                            <tr key={i} className="hover:bg-slate-50">
                                                <td className="p-2 text-slate-700 font-mono text-xs">{d.yearMonth}</td>
                                                <td className="p-2 text-right font-mono text-orange-400 font-bold">${Math.round(d['禹君']).toLocaleString()}</td>
                                                <td className="p-2 text-right font-mono text-purple-400 font-bold">${Math.round(d['禹辰']).toLocaleString()}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl shadow-sm border-2 border-slate-200 p-2 shrink-0 flex flex-col">
                            <h3 className="font-bold text-slate-700 text-sm mb-2 flex items-center gap-2">
                                <BarChart2 size={16} className="text-emerald-500" /> 地點薪資分析
                            </h3>
                            <div className="w-full overflow-y-auto max-h-96">
                                <div style={{ height: Math.max(200, analysisStats.locData.length * 45) }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart layout="vertical" data={analysisStats.locData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }} barCategoryGap={8}>
                                            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
                                            <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} />
                                            <YAxis type="category" dataKey="locationName" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748B' }} width={70} interval={0} />
                                            <Tooltip cursor={{ fill: '#F1F5F9' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }} />
                                            <Legend />
                                            <Bar dataKey="禹君" name="禹君" fill="#fdba74" radius={[0, 4, 4, 0]} />
                                            <Bar dataKey="禹辰" name="禹辰" fill="#d8b4fe" radius={[0, 4, 4, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                            
                            <div className="mt-2 border-2 border-slate-100 rounded-lg overflow-hidden">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-slate-50 text-slate-500 border-b border-slate-100">
                                        <tr>
                                            <th className="p-2 font-bold whitespace-nowrap">地點</th>
                                            <th className="p-2 font-bold text-right whitespace-nowrap text-orange-400">禹君</th>
                                            <th className="p-2 font-bold text-right whitespace-nowrap text-purple-400">禹辰</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {analysisStats.locData.map((d, i) => (
                                            <tr key={i} className="hover:bg-slate-50">
                                                <td className="p-2 text-slate-700 text-xs truncate max-w-[80px]">{d.locationName}</td>
                                                <td className="p-2 text-right font-mono text-orange-400 font-bold">${Math.round(d['禹君']).toLocaleString()}</td>
                                                <td className="p-2 text-right font-mono text-purple-400 font-bold">${Math.round(d['禹辰']).toLocaleString()}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                    );
                })()}
            </div>

            {/* Quick Edit Modal */}
            {quickEditDate && (() => {
                const dayRecords = currentRecords.filter(r => r.date === quickEditDate).sort((a,b)=>a.startTime.localeCompare(b.startTime));
                return (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm sm:p-4 pb-safe animate-in fade-in duration-150">
                    <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-sm flex flex-col overflow-hidden shadow-2xl animate-in slide-in-from-bottom sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-150 border border-slate-200">
                        <div className="flex items-center justify-between p-4 border-b bg-slate-50">
                            <h3 className="text-lg font-bold text-slate-800">{editPlanId ? '編輯排班' : '新增排班'} - {quickEditDate}</h3>
                            <button onClick={()=>setQuickEditDate(null)} className="p-1 rounded-full text-slate-400 hover:bg-slate-200"><X size={20}/></button>
                        </div>
                        <div className="p-4 flex flex-col gap-4 max-h-[80vh] overflow-y-auto">
                            {dayRecords.length > 0 && (
                                <div className="flex flex-col gap-2 pb-4 border-b border-slate-100">
                                    <div className="text-xs font-bold text-slate-500 flex justify-between items-center mb-1">
                                        <span>當日排班資料 (選擇以編輯)</span>
                                        <button onClick={() => { setEditPlanId(null); setPlanLocationId(activeCurrentLocs.length > 0 ? activeCurrentLocs[0].id : ''); setPlanStartTime(''); setPlanEndTime(''); setPlanRemarks(''); }} className={`text-${mainColor}-600 hover:text-${mainColor}-800 px-2 py-1 rounded bg-${mainColor}-50 flex items-center gap-1`}><Plus size={12}/>新增一筆</button>
                                    </div>
                                    {dayRecords.map(r => (
                                        <div key={r.id} onClick={() => {
                                            setEditPlanId(r.id);
                                            setPlanLocationId(r.locationId);
                                            setPlanStartTime(r.startTime);
                                            setPlanEndTime(r.endTime);
                                            setPlanRemarks(r.remarks || '');
                                        }} className={`p-2.5 rounded-lg border text-left transition-colors cursor-pointer ${editPlanId === r.id ? `bg-${mainColor}-50 border-${mainColor}-300` : 'bg-white border-slate-200 hover:bg-slate-50'}`}>
                                            <div className="text-sm font-bold flex justify-between text-slate-700">
                                                <span>{currentLocs.find(l=>l.id===r.locationId)?.name}</span>
                                                <span className="font-mono text-slate-500">{r.startTime} ~ {r.endTime}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                            <div className="flex flex-wrap gap-2">
                                {activeCurrentLocs.map(l => (
                                    <button 
                                        key={l.id} 
                                        onClick={() => setPlanLocationId(l.id)}
                                        className={`px-3 py-1.5 rounded-lg border text-sm font-bold transition-colors ${planLocationId === l.id ? activeBtnClass : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'}`}
                                    >
                                        {l.name}
                                    </button>
                                ))}
                            </div>
                            <div className="flex gap-2 items-center">
                                <input type="time" step="1800" className="flex-1 h-10 px-3 border rounded-lg bg-slate-50 font-mono text-sm" required value={planStartTime} onChange={e => setPlanStartTime(e.target.value)} />
                                <span className="text-slate-400">~</span>
                                <input type="time" step="1800" className="flex-1 h-10 px-3 border rounded-lg bg-slate-50 font-mono text-sm" required value={planEndTime} onChange={e => setPlanEndTime(e.target.value)} />
                            </div>
                            <div>
                                <input type="text" className="w-full h-10 px-3 border rounded-lg bg-slate-50 text-sm" value={planRemarks} onChange={e => setPlanRemarks(e.target.value)} placeholder="備註說明" />
                            </div>
                            <button onClick={() => { handleSavePlan(); setQuickEditDate(null); }} disabled={!planLocationId || !planStartTime || !planEndTime} className={`w-full py-2.5 rounded-lg font-bold text-white transition-opacity ${(!planLocationId || !planStartTime || !planEndTime) ? 'opacity-50' : ''} ${mainColorClass}`}>
                                {editPlanId ? '更新' : '存檔'}
                            </button>
                            {editPlanId && (
                                <button onClick={() => { handleDeleteRecord(editPlanId); setQuickEditDate(null); }} className="w-full py-2.5 rounded-lg font-bold text-rose-500 bg-rose-50 border border-rose-200 mt-2">
                                    刪除此排班
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            ); })()}

{/* Modals for Dictionary */}
            {showLocModal && (
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
                            <button onClick={handleSaveLoc} disabled={!locForm.name} className={`w-full py-2 rounded-lg font-bold text-white transition-opacity ${!locForm.name ? 'opacity-50' : ''} ${mainColorClass}`}>儲存</button>
                        </div>
                    </div>
                </div>
            )}

            {showWageModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl flex flex-col overflow-hidden">
                        <div className="flex items-center justify-between p-4 border-b">
                            <h3 className="text-lg font-bold text-slate-800">{wageForm.id ? '編輯時薪' : '新增時薪'}</h3>
                            <button onClick={()=>setShowWageModal(false)} className="p-1 rounded-full text-slate-400 hover:bg-slate-100"><X size={20}/></button>
                        </div>
                        <div className="p-4 flex flex-col gap-4">
                            <div>
                                <label className="text-xs font-bold text-slate-500 block mb-1">生效日期</label>
                                <input type="date" className="w-full h-10 px-3 border rounded-lg bg-slate-50 font-mono" value={wageForm.effectiveDate || ''} onChange={e => setWageForm({...wageForm, effectiveDate: e.target.value})} />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 block mb-1">時薪</label>
                                <input type="number" inputMode="decimal" className="w-full h-10 px-3 border rounded-lg bg-slate-50 font-mono" value={wageForm.hourlyWage || ''} onChange={e => setWageForm({...wageForm, hourlyWage: e.target.value ? Number(e.target.value) : undefined})} />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 block mb-1">備註</label>
                                <input type="text" className="w-full h-10 px-3 border rounded-lg bg-slate-50" value={wageForm.remarks || ''} onChange={e => setWageForm({...wageForm, remarks: e.target.value})} />
                            </div>
                            <button onClick={handleSaveWage} disabled={!wageForm.effectiveDate || !wageForm.hourlyWage} className={`w-full py-2 rounded-lg font-bold text-white transition-opacity ${!wageForm.effectiveDate || !wageForm.hourlyWage ? 'opacity-50' : ''} ${mainColorClass}`}>儲存</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ShiftSystem;
