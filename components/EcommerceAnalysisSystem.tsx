import React, { useState, useMemo } from 'react';
import { Home, Truck, DollarSign, Wallet, FileCheck, Edit2, X, Save } from 'lucide-react';
import { OrderGroup, OrderItem, ProductItem } from '../types';
import { formatCurrency } from '../utils';
import { db } from '../firebase';
import { doc, setDoc } from 'firebase/firestore';

interface EcommerceAnalysisSystemProps {
  orderGroups: OrderGroup[];
  orderItems: OrderItem[];
  productItems: ProductItem[];
  allIncomeSettings: Record<string, any>;
  onNavigateHome: () => void;
}

const PREVIOUS_PERIOD_IDS = ['202511A', '202511B', '202511C', '202511D'];

const EcommerceAnalysisSystem: React.FC<EcommerceAnalysisSystemProps> = ({
  orderGroups,
  orderItems,
  productItems,
  allIncomeSettings,
  onNavigateHome,
}) => {
  const [activeTab, setActiveTab] = useState<'shipping' | 'profit' | 'cash' | 'reconciliation'>('shipping');
  const [statusFilter, setStatusFilter] = useState<'processing' | 'preorder' | 'closed'>('processing');
  
  // Cash sub-tabs and edit modal states
  const [cashFilter, setCashFilter] = useState<'withdrawn' | 'unwithdrawn' | 'previous'>('withdrawn');
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<string | null>(null);
  const [editDad, setEditDad] = useState('');
  const [editSister, setEditSister] = useState('');
  const [editNote, setEditNote] = useState('');

  // Calculate batched data
  const batchData = useMemo(() => {
    return orderGroups.map(group => {
      const itemsInBatch = orderItems.filter(i => i.orderGroupId === group.id);
      const settings = allIncomeSettings[group.id] || {};
      const packaging = Number(settings.packagingRevenue) || 0;
      const cardCharge = Number(settings.cardCharge) || 0;
      const cardFee = Number(settings.cardFee) || 0;
      const intlShip = Number(settings.intlShipping) || 0;
      const dadReceivable = Number(settings.dadReceivable) || 0;
      const sisterReceivable = Number(settings.sisterReceivable) || 0;
      const paymentNote = settings.paymentNote || '';
      const status = settings.status || 'processing';
      
      let totalItemSales = 0;
      itemsInBatch.forEach(item => {
        const product = productItems.find(p => p.groupId === item.productGroupId && p.id === item.productItemId);
        if (product) totalItemSales += product.inputPrice * item.quantity;
      });

      const revenue = totalItemSales + packaging;
      const profit = revenue - (cardCharge + cardFee + intlShip);

      return {
        id: group.id,
        revenue,
        intlShip,
        profit,
        dadReceivable,
        sisterReceivable,
        paymentNote,
        status
      };
    }).sort((a, b) => b.id.localeCompare(a.id));
  }, [orderGroups, orderItems, productItems, allIncomeSettings]);

  // Filter based on status
  const filteredData = batchData.filter(item => item.status === statusFilter);

  const openEditModal = (item: any) => {
    setEditTarget(item.id);
    setEditDad(item.dadReceivable.toString());
    setEditSister(item.sisterReceivable.toString());
    setEditNote(item.paymentNote);
    setEditModalOpen(true);
  };

  const saveEdit = async () => {
    if (!editTarget) return;
    try {
       const existingSettings = allIncomeSettings[editTarget] || {};
       const updatedSettings = {
           ...existingSettings,
           dadReceivable: parseFloat(editDad) || 0,
           sisterReceivable: parseFloat(editSister) || 0,
           paymentNote: editNote
       };
       await setDoc(doc(db, 'incomeSettings', editTarget), updatedSettings);
       setEditModalOpen(false);
       setEditTarget(null);
    } catch (e) {
       console.error("Save error", e);
       alert("儲存失敗");
    }
  };

  const renderNav = () => (
    <div className="bg-sky-600 border-t border-sky-700 flex justify-around items-center pb-safe shadow-2xl shrink-0 z-50 text-white h-16">
      <button 
        onClick={() => setActiveTab('shipping')} 
        className={`flex-1 flex flex-col items-center justify-center h-full transition-all duration-200 ${activeTab === 'shipping' ? 'text-yellow-300 bg-sky-800/50' : 'text-sky-200 hover:text-white'}`}
      >
        <Truck size={22} strokeWidth={activeTab === 'shipping' ? 2.5 : 2} />
        <span className="text-[11px] font-bold mt-1 tracking-wide">運費</span>
      </button>

      <button 
        onClick={() => setActiveTab('profit')} 
        className={`flex-1 flex flex-col items-center justify-center h-full transition-all duration-200 ${activeTab === 'profit' ? 'text-yellow-300 bg-sky-800/50' : 'text-sky-200 hover:text-white'}`}
      >
        <DollarSign size={22} strokeWidth={activeTab === 'profit' ? 2.5 : 2} />
        <span className="text-[11px] font-bold mt-1 tracking-wide">利潤</span>
      </button>

      <button 
        onClick={() => setActiveTab('cash')} 
        className={`flex-1 flex flex-col items-center justify-center h-full transition-all duration-200 ${activeTab === 'cash' ? 'text-yellow-300 bg-sky-800/50' : 'text-sky-200 hover:text-white'}`}
      >
        <Wallet size={22} strokeWidth={activeTab === 'cash' ? 2.5 : 2} />
        <span className="text-[11px] font-bold mt-1 tracking-wide">領現</span>
      </button>

      <button 
        onClick={() => setActiveTab('reconciliation')} 
        className={`flex-1 flex flex-col items-center justify-center h-full transition-all duration-200 ${activeTab === 'reconciliation' ? 'text-yellow-300 bg-sky-800/50' : 'text-sky-200 hover:text-white'}`}
      >
        <FileCheck size={22} strokeWidth={activeTab === 'reconciliation' ? 2.5 : 2} />
        <span className="text-[11px] font-bold mt-1 tracking-wide">對帳</span>
      </button>

      <button 
        onClick={onNavigateHome}
        className="flex-1 flex flex-col items-center justify-center h-full transition-all duration-200 text-sky-200 hover:text-white"
      >
        <Home size={22} strokeWidth={2} />
        <span className="text-[11px] font-bold mt-1 tracking-wide">返回</span>
      </button>
    </div>
  );

  const getHeaderTitle = () => {
      switch (activeTab) {
          case 'shipping': return '國際運費分析';
          case 'profit': return '利潤分析';
          case 'cash': return '領現分析';
          case 'reconciliation': return '對帳分析';
      }
  };

  return (
    <div className="h-screen w-full flex flex-col bg-slate-50 overflow-hidden font-sans">
      {/* Header */}
      <div className="bg-sky-600 px-3 py-2 shrink-0 flex items-center shadow-md z-10 justify-between">
        <h1 className="text-white text-lg font-bold tracking-wide flex items-center gap-2">
            {getHeaderTitle()}
        </h1>
      </div>

      {/* Filter Tabs */}
      {(activeTab === 'shipping' || activeTab === 'profit') && (
        <div className="bg-white p-2 shadow-sm border-b border-slate-200 shrink-0 z-10 flex gap-1">
          {(['processing', 'preorder', 'closed'] as const).map(status => {
             let label = '進行';
             if (status === 'preorder') label = '預購';
             if (status === 'closed') label = '結案';
             
             return (
               <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`flex-1 py-1.5 font-bold text-sm rounded-lg transition-all border
                      ${statusFilter === status 
                          ? 'bg-sky-100 text-sky-700 border-sky-300 shadow-sm' 
                          : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'
                      }
                  `}
               >
                  {label} ({batchData.filter(d => d.status === status).length})
               </button>
             );
          })}
        </div>
      )}

      {activeTab === 'cash' && (
        <div className="bg-white p-2 shadow-sm border-b border-slate-200 shrink-0 z-10 flex gap-1">
          {(['withdrawn', 'unwithdrawn', 'previous'] as const).map(mode => {
             let label = mode === 'withdrawn' ? '已領' : mode === 'unwithdrawn' ? '未領' : '前期';
             let count = 0;
             if (mode === 'previous') {
                 count = batchData.filter(d => PREVIOUS_PERIOD_IDS.includes(d.id)).length;
             } else if (mode === 'withdrawn') {
                 count = batchData.filter(d => !PREVIOUS_PERIOD_IDS.includes(d.id) && (d.dadReceivable !== 0 || d.sisterReceivable !== 0)).length;
             } else {
                 count = batchData.filter(d => !PREVIOUS_PERIOD_IDS.includes(d.id) && d.dadReceivable === 0 && d.sisterReceivable === 0).length;
             }
             return (
               <button
                  key={mode}
                  onClick={() => setCashFilter(mode)}
                  className={`flex-1 py-2 font-bold text-sm rounded-xl transition-all border
                      ${cashFilter === mode 
                          ? 'bg-sky-100 text-sky-700 border-sky-300 shadow-sm' 
                          : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'
                      }
                  `}
               >
                  {label} ({count})
               </button>
             );
          })}
        </div>
      )}

      {/* Data views based on activeTab */}
      {(activeTab === 'shipping' || activeTab === 'profit') && (
        <div className="flex-1 flex flex-col min-h-0 bg-white">
           <div className="overflow-y-auto flex-1 pb-16">
              <table className="w-full text-left text-sm">
                  <thead className="bg-slate-100 text-slate-600 border-b border-slate-200 sticky top-0 z-10 shadow-sm">
                      <tr>
                          <th className="px-2 py-2 font-bold w-1/4">訂單序</th>
                          <th className="px-2 py-2 font-bold text-right w-1/4">收入</th>
                          <th className="px-2 py-2 font-bold text-right w-1/4">{activeTab === 'shipping' ? '國際運費' : '利潤'}</th>
                          <th className="px-2 py-2 font-bold text-right w-1/4">百分比</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                      {filteredData.length === 0 ? (
                          <tr>
                              <td colSpan={4} className="px-2 py-6 text-center text-slate-400">沒有符合的資料</td>
                          </tr>
                      ) : (
                          filteredData.map(item => {
                              const val = activeTab === 'shipping' ? item.intlShip : item.profit;
                              let percentage = 0;
                              if (item.revenue > 0) percentage = (val / item.revenue) * 100;
  
                              return (
                                  <tr key={item.id} className="hover:bg-slate-50">
                                      <td className="px-2 py-2 font-mono font-bold text-slate-600 truncate">{item.id}</td>
                                      <td className="px-2 py-2 text-right font-mono font-bold text-blue-600">{formatCurrency(item.revenue)}</td>
                                      <td className={`px-2 py-2 text-right font-mono font-bold ${activeTab === 'shipping' ? 'text-amber-600' : (val > 0 ? 'text-emerald-600' : 'text-rose-600')}`}>
                                          {formatCurrency(val)}
                                      </td>
                                      <td className="px-2 py-2 text-right font-mono font-bold text-slate-700">
                                          {percentage.toFixed(1)}%
                                      </td>
                                  </tr>
                              );
                          })
                      )}
                  </tbody>
                  {filteredData.length > 0 && (
                      <tfoot className="bg-sky-100 border-t-2 border-sky-300 sticky bottom-0 z-10 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
                          <tr>
                              <td className="px-2 py-2 font-bold text-slate-900 border-r border-sky-200">合計</td>
                              <td className="px-2 py-2 text-right font-mono font-bold text-blue-800 border-r border-sky-200">
                                  {formatCurrency(filteredData.reduce((acc, item) => acc + item.revenue, 0))}
                              </td>
                              <td className={`px-2 py-2 text-right font-mono font-bold border-r border-sky-200 ${activeTab === 'shipping' ? 'text-amber-800' : 'text-emerald-800'}`}>
                                  {formatCurrency(filteredData.reduce((acc, item) => acc + (activeTab === 'shipping' ? item.intlShip : item.profit), 0))}
                              </td>
                              <td className="px-2 py-2 text-right font-mono font-bold text-slate-900">
                                  {(() => {
                                      const sumRev = filteredData.reduce((acc, item) => acc + item.revenue, 0);
                                      const sumVal = filteredData.reduce((acc, item) => acc + (activeTab === 'shipping' ? item.intlShip : item.profit), 0);
                                      if (sumRev === 0) return '0.0%';
                                      return `${((sumVal / sumRev) * 100).toFixed(1)}%`;
                                  })()}
                              </td>
                          </tr>
                      </tfoot>
                  )}
              </table>
           </div>
        </div>
      )}

      {activeTab === 'cash' && (
        <div className="flex-1 flex flex-col min-h-0 bg-white">
           {(() => {
              const cashData = (() => {
                 if (cashFilter === 'previous') {
                     return batchData.filter(d => PREVIOUS_PERIOD_IDS.includes(d.id));
                 } else if (cashFilter === 'withdrawn') {
                     return batchData.filter(d => !PREVIOUS_PERIOD_IDS.includes(d.id) && (d.dadReceivable !== 0 || d.sisterReceivable !== 0));
                 } else {
                     return batchData.filter(d => !PREVIOUS_PERIOD_IDS.includes(d.id) && d.dadReceivable === 0 && d.sisterReceivable === 0);
                 }
              })();

              if (cashData.length === 0) return <div className="text-center py-6 text-slate-400 overflow-y-auto flex-1">沒有符合的資料</div>;

              const isWithdrawnView = cashFilter === 'withdrawn' || cashFilter === 'previous';
              const sumProfit = isWithdrawnView ? cashData.reduce((acc, item) => acc + item.profit, 0) : 0;
              const sumDad = isWithdrawnView ? cashData.reduce((acc, item) => acc + item.dadReceivable, 0) : 0;
              const sumSister = isWithdrawnView ? cashData.reduce((acc, item) => acc + item.sisterReceivable, 0) : 0;

              return (
                 <>
                   <div className="shrink-0 bg-white z-10 relative shadow-sm">
                     {isWithdrawnView && (
                        <div className="bg-sky-50 shadow-sm p-3">
                            <div className="flex items-center border-b border-sky-200 pb-1.5 mb-1.5">
                               <span className="w-1/4 font-bold text-slate-900 text-left text-sm border-r border-sky-200">合計</span>
                               <span className="w-1/4 text-emerald-800 font-mono font-bold text-right text-sm border-r border-sky-200">{formatCurrency(sumProfit)}</span>
                               <span className="w-1/4 text-orange-800 font-mono font-bold text-right text-sm border-r border-sky-200">{formatCurrency(sumDad)}</span>
                               <span className="w-1/4 text-fuchsia-800 font-mono font-bold text-right text-sm">{formatCurrency(sumSister)}</span>
                            </div>
                            <div className="flex items-center text-[10px] text-slate-600">
                               <span className="w-1/2 font-bold text-left text-sky-800 border-r border-sky-200 pl-1">-</span>
                               <span className="w-1/4 text-orange-700 text-right font-mono font-bold border-r border-sky-200">{sumProfit > 0 ? ((sumDad / sumProfit) * 100).toFixed(1) : 0}%</span>
                               <span className="w-1/4 text-fuchsia-700 text-right font-mono font-bold">{sumProfit > 0 ? ((sumSister / sumProfit) * 100).toFixed(1) : 0}%</span>
                            </div>
                        </div>
                     )}
                     
                     {isWithdrawnView ? (
                        <div className="flex flex-col text-xs font-bold text-slate-500 px-3 py-2 border-b border-slate-200">
                            <div className="flex items-center mb-1">
                                <span className="w-1/4 text-left">訂單序</span>
                                <span className="w-1/4 text-right">利潤</span>
                                <span className="w-1/4 text-right">爸爸應收</span>
                                <span className="w-1/4 text-right">妹妹應收</span>
                            </div>
                            <div className="flex items-center">
                                <span className="w-1/2 text-left">收款說明</span>
                                <span className="w-1/4 text-right">爸爸%</span>
                                <span className="w-1/4 text-right">妹妹%</span>
                            </div>
                        </div>
                     ) : (
                        <div className="flex justify-between items-center text-xs font-bold text-slate-500 px-3 py-2 border-b border-slate-200">
                            <span>訂單序</span>
                            <span>總利潤</span>
                            <span>利潤率</span>
                            <span className="w-8 text-center">操作</span>
                        </div>
                     )}
                   </div>
                   
                   <div className="overflow-y-auto flex-1 pb-16 bg-slate-50">
                     <div className="flex flex-col gap-1.5 p-2">
                       {cashData.map(item => (
                          <div key={item.id} className="border border-slate-200 bg-white rounded-md p-2 shadow-sm hover:shadow transition-shadow">
                             {isWithdrawnView ? (
                                <>
                                  <div className="flex items-center border-b border-slate-100 pb-1.5 mb-1.5">
                                     <span className="w-1/4 font-mono font-bold text-slate-700 text-left truncate">{item.id}</span>
                                     <span className="w-1/4 text-emerald-600 font-mono font-bold text-right">{formatCurrency(item.profit)}</span>
                                     <span className="w-1/4 text-orange-600 font-mono font-bold text-right">{formatCurrency(item.dadReceivable)}</span>
                                     <span className="w-1/4 text-fuchsia-600 font-mono font-bold text-right">{formatCurrency(item.sisterReceivable)}</span>
                                  </div>
                                  <div className="flex items-center text-[11px] text-slate-500">
                                     <span className="w-1/2 truncate font-bold text-left px-1">{item.paymentNote || '-'}</span>
                                     <span className="w-1/4 text-orange-600 text-right font-mono">{item.profit > 0 ? ((item.dadReceivable / item.profit) * 100).toFixed(1) : 0}%</span>
                                     <span className="w-1/4 text-fuchsia-600 text-right font-mono">{item.profit > 0 ? ((item.sisterReceivable / item.profit) * 100).toFixed(1) : 0}%</span>
                                  </div>
                                </>
                             ) : (
                                <>
                                  <div className="flex justify-between items-center">
                                     <span className="font-mono font-bold text-slate-700 w-1/4 truncate">{item.id}</span>
                                     <span className="font-mono font-bold text-emerald-600 text-right w-1/4">{formatCurrency(item.profit)}</span>
                                     <span className="text-sm font-bold text-slate-500 text-right w-1/4">
                                       {item.revenue > 0 ? ((item.profit / item.revenue) * 100).toFixed(1) : 0}%
                                     </span>
                                     <div className="w-1/4 flex justify-end">
                                         <button onClick={() => openEditModal(item)} className="p-1 px-1.5 flex items-center justify-center bg-blue-50 text-blue-600 rounded shrink-0 border border-blue-200 hover:bg-blue-100 shadow-sm transition-colors">
                                           <Edit2 size={13} />
                                         </button>
                                     </div>
                                  </div>
                                </>
                             )}
                          </div>
                       ))}
                     </div>
                   </div>
                 </>
              );
           })()}
        </div>
      )}

      {activeTab === 'reconciliation' && (
         <div className="flex-1 p-2 flex flex-col items-center justify-center text-slate-400 font-bold bg-white">
             <FileCheck size={48} className="mb-4 opacity-50" />
             <p>對帳分析模組建置中...</p>
         </div>
      )}

      {renderNav()}

      {/* Edit Modal */}
      {editModalOpen && editTarget && (
        <div className="fixed inset-0 z-[100] bg-slate-900/50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden flex flex-col">
                <div className="bg-sky-600 px-4 py-3 flex justify-between items-center">
                    <h3 className="text-white font-bold tracking-wide">編輯領現 ({editTarget})</h3>
                    <button onClick={() => setEditModalOpen(false)} className="text-sky-100 hover:text-white"><X size={20}/></button>
                </div>
                <div className="p-4 flex flex-col gap-4">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">爸爸應收</label>
                        <input type="number" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-lg font-mono focus:ring-2 focus:ring-sky-500 focus:outline-none" value={editDad} onChange={e => setEditDad(e.target.value)} />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">妹妹應收</label>
                        <input type="number" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-lg font-mono focus:ring-2 focus:ring-sky-500 focus:outline-none" value={editSister} onChange={e => setEditSister(e.target.value)} />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">收款說明</label>
                        <input type="text" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-lg focus:ring-2 focus:ring-sky-500 focus:outline-none" value={editNote} onChange={e => setEditNote(e.target.value)} />
                    </div>
                    <button onClick={saveEdit} className="mt-2 w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors">
                        <Save size={18} /> 存檔
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default EcommerceAnalysisSystem;
