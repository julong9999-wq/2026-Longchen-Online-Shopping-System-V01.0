import React, { useState, useEffect } from 'react';

interface TimePickerModalProps {
    isOpen: boolean;
    initialTime: string; // "HH:mm"
    onClose: () => void;
    onConfirm: (time: string) => void;
}

const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
const minutes = ['00', '30'];

export const TimePickerModal: React.FC<TimePickerModalProps> = ({ isOpen, initialTime, onClose, onConfirm }) => {
    const [h, setH] = useState(initialTime ? initialTime.split(':')[0] : '09');
    const [m, setM] = useState(initialTime ? initialTime.split(':')[1] : '00');
    
    // Default fallback if initial time doesn't match 00 or 30
    useEffect(() => {
        if (initialTime) {
            setH(initialTime.split(':')[0]);
            const min = initialTime.split(':')[1];
            setM(min === '30' ? '30' : '00');
        }
    }, [initialTime, isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm sm:p-4 pb-safe animate-in fade-in duration-150">
            <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-sm flex flex-col overflow-hidden shadow-2xl animate-in slide-in-from-bottom sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-150 border border-slate-200">
                <div className="flex justify-between items-center p-3 border-b bg-slate-50">
                    <button onClick={onClose} className="text-slate-500 hover:bg-slate-200 rounded-lg font-bold px-4 py-2">取消</button>
                    <h3 className="font-bold text-slate-800 text-lg">選擇時間</h3>
                    <button onClick={() => onConfirm(`${h}:${m}`)} className="text-pink-600 hover:bg-pink-100 rounded-lg font-bold px-4 py-2">完成</button>
                </div>
                
                <div className="p-8 flex justify-center items-center h-48 bg-white relative">
                    <div className="absolute top-1/2 -translate-y-1/2 left-8 right-8 h-12 bg-pink-50 rounded-xl pointer-events-none border border-pink-100" />
                    <div className="flex gap-4 items-center z-10 relative">
                        <select 
                            value={h} 
                            onChange={e => setH(e.target.value)}
                            className="appearance-none bg-transparent text-2xl font-mono font-bold text-slate-800 outline-none cursor-pointer p-2 rounded-lg hover:bg-slate-100 transition-colors text-center w-16"
                        >
                            {hours.map(hx => <option key={hx} value={hx}>{hx}</option>)}
                        </select>
                        <span className="text-2xl font-bold text-slate-400 -mt-1">:</span>
                        <select 
                            value={m} 
                            onChange={e => setM(e.target.value)}
                            className="appearance-none bg-transparent text-2xl font-mono font-bold text-slate-800 outline-none cursor-pointer p-2 rounded-lg hover:bg-slate-100 transition-colors text-center w-16"
                        >
                            {minutes.map(mx => <option key={mx} value={mx}>{mx}</option>)}
                        </select>
                    </div>
                </div>
            </div>
        </div>
    );
};
