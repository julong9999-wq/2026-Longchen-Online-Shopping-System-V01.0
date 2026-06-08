import React, { useState, useMemo, useEffect } from 'react';
import { Home, Truck, DollarSign, Wallet, FileCheck, Edit2, X, Save, AlertTriangle, CheckCircle, ShoppingCart, ChevronDown, ChevronUp } from 'lucide-react';
import { OrderGroup, OrderItem, ProductItem, ProductGroup } from '../types';
import { formatCurrency } from '../utils';
import { db } from '../firebase';
import { doc, setDoc, collection, onSnapshot } from 'firebase/firestore';
import { PurchasingRecord } from './PurchasingSystem';

interface EcommerceAnalysisSystemProps {
  orderGroups: OrderGroup[];
  orderItems: OrderItem[];
  productGroups: ProductGroup[];
  productItems: ProductItem[];
  allIncomeSettings: Record<string, any>;
  onNavigateHome: () => void;
}

const PREVIOUS_PERIOD_IDS = ['202511A', '202511B', '202511C', '202511D'];

const EcommerceAnalysisSystem: React.FC<EcommerceAnalysisSystemProps> = ({
  orderGroups,
  orderItems,
  productGroups,
  productItems,
  allIncomeSettings,
  onNavigateHome,
}) => {
  const [activeTab, setActiveTab] = useState<'shipping' | 'profit' | 'cash' | 'reconciliation' | 'purchase'>('shipping');
  const [statusFilter, setStatusFilter] = useState<'processing' | 'preorder' | 'closed'>('processing');
  
  const [purchaseFilter, setPurchaseFilter] = useState<'all' | 'unsettled' | 'settled'>('all');
  const [expandedPurchaseId, setExpandedPurchaseId] = useState<string | null>(null);
  
  // Cash sub-tabs and edit modal states
  const [cashFilter, setCashFilter] = useState<'withdrawn' | 'unwithdrawn' | 'previous'>('withdrawn');
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<string | null>(null);
  const [editDad, setEditDad] = useState('');
  const [editSister, setEditSister] = useState('');
  const [editNote, setEditNote] = useState('');
  const [editStatus, setEditStatus] = useState<string>('processing');

  const getStatusColor = (status: string) => {
      switch(status) {
          case 'processing': return 'bg-emerald-500 shadow-emerald-200';
          case 'closed': return 'bg-yellow-400 shadow-yellow-200';
          default: return 'bg-rose-500 shadow-rose-200';
      }
  };

  const [purchasingRecords, setPurchasingRecords] = useState<PurchasingRecord[]>([]);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'purchasingRecords'), (snapshot) => {
      const data = snapshot.docs.map(doc => doc.data() as PurchasingRecord);
      setPurchasingRecords(data);
    }, (error) => {
      console.error("error fetching purchasing records", error);
    });
    return () => unsub();
  }, []);

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
    setEditStatus(item.status || 'processing');
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
           paymentNote: editNote,
           status: editStatus
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
        onClick={() => setActiveTab('purchase')} 
        className={`flex-1 flex flex-col items-center justify-center h-full transition-all duration-200 ${activeTab === 'purchase' ? 'text-yellow-300 bg-sky-800/50' : 'text-sky-200 hover:text-white'}`}
      >
        <ShoppingCart size={22} strokeWidth={activeTab === 'purchase' ? 2.5 : 2} />
        <span className="text-[11px] font-bold mt-1 tracking-wide">購買</span>
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
          case 'purchase': return '購買分析';
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
             
             let activeColor = '';
             if (status === 'processing') activeColor = 'bg-emerald-100 text-emerald-800 border-emerald-300 shadow-sm';
             else if (status === 'preorder') activeColor = 'bg-rose-100 text-rose-800 border-rose-300 shadow-sm';
             else if (status === 'closed') activeColor = 'bg-yellow-100 text-yellow-800 border-yellow-300 shadow-sm';
             
             return (
               <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`flex-1 py-1.5 font-bold text-sm rounded-lg transition-all border
                      ${statusFilter === status 
                          ? activeColor 
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
                     
                     {!isWithdrawnView && (() => {
                        const sumUnwithProfit = cashData.reduce((acc, item) => acc + item.profit, 0);
                        const sumUnwithRev = cashData.reduce((acc, item) => acc + item.revenue, 0);
                        const rate = sumUnwithRev > 0 ? ((sumUnwithProfit / sumUnwithRev) * 100).toFixed(1) : '0';
                        const estDad = Math.round(sumUnwithProfit * 0.2);
                        const estSister = Math.round(sumUnwithProfit * 0.8);
                        
                        return (
                          <div className="bg-rose-50 shadow-sm p-3">
                              <div className="flex items-center border-b border-rose-200 pb-1.5 mb-1.5">
                                 <span className="w-1/4 font-bold text-slate-900 text-left text-sm border-r border-rose-200">合計</span>
                                 <span className="w-1/4 text-emerald-800 font-mono font-bold text-right text-sm border-r border-rose-200">{formatCurrency(sumUnwithProfit)}</span>
                                 <span className="w-1/4 text-orange-800 font-mono font-bold text-right text-sm border-r border-rose-200">{formatCurrency(estDad)}</span>
                                 <span className="w-1/4 text-fuchsia-800 font-mono font-bold text-right text-sm">{formatCurrency(estSister)}</span>
                              </div>
                              <div className="flex items-center text-[10px] text-slate-600">
                                 <span className="w-1/2 font-bold text-left text-rose-800 border-r border-rose-200 pl-1">未領總利率: {rate}%</span>
                                 <span className="w-1/4 text-rose-600 text-right font-mono font-bold border-r border-rose-200">(估計爸爸)</span>
                                 <span className="w-1/4 text-rose-600 text-right font-mono font-bold">(估計妹妹)</span>
                              </div>
                          </div>
                        );
                     })()}
                     
                     {isWithdrawnView ? (
                        <div className="flex flex-col text-xs font-bold text-slate-500 px-3 py-2 border-b border-slate-200">
                            <div className="flex items-center mb-1">
                                <span className="flex-1 text-left">訂單序</span>
                                <span className="w-16 text-right shrink-0">利潤</span>
                                <span className="w-20 text-right shrink-0">爸爸應收</span>
                                <span className="w-20 text-right shrink-0">妹妹應收</span>
                            </div>
                            <div className="flex items-center">
                                <span className="flex-1 text-left">收款說明</span>
                                <span className="w-20 text-right shrink-0">爸爸%</span>
                                <span className="w-20 text-right shrink-0">妹妹%</span>
                            </div>
                        </div>
                     ) : (
                        <div className="flex items-center text-xs font-bold text-slate-500 px-3 py-2 border-b border-slate-200 bg-white">
                            <span className="flex-1">訂單序</span>
                            <span className="w-20 text-right">總利潤</span>
                            <span className="w-16 text-right">利潤率</span>
                            <span className="w-12 text-right">操作</span>
                        </div>
                     )}
                   </div>
                   
                   <div className="overflow-y-auto flex-1 pb-16 bg-slate-50">
                     <div className="flex flex-col gap-1.5 p-2">
                       {cashData.map(item => {
                          let cardBg = 'bg-white border-slate-200';
                          if (cashFilter === 'unwithdrawn') cardBg = 'bg-rose-50 border-rose-200';
                          if (cashFilter === 'previous') cardBg = 'bg-emerald-50 border-emerald-200';
                          
                          return (
                          <div key={item.id} className={`border rounded-md p-2 shadow-sm hover:shadow transition-shadow ${cardBg}`}>
                             {isWithdrawnView ? (
                                <>
                                  <div className="flex items-center border-b border-slate-100 pb-1.5 mb-1.5">
                                     <span className="flex-1 font-mono font-bold text-slate-700 text-left">{item.id}</span>
                                     <span className="w-16 shrink-0 text-emerald-600 font-mono font-bold text-right">{formatCurrency(item.profit)}</span>
                                     <span className="w-20 shrink-0 text-orange-600 font-mono font-bold text-right">{formatCurrency(item.dadReceivable)}</span>
                                     <span className="w-20 shrink-0 text-fuchsia-600 font-mono font-bold text-right">{formatCurrency(item.sisterReceivable)}</span>
                                  </div>
                                  <div className="flex items-center text-[11px] text-slate-500">
                                     <span className="flex-1 text-left px-1">{item.paymentNote || '-'}</span>
                                     <span className="w-20 shrink-0 text-orange-600 text-right font-mono">{item.profit > 0 ? ((item.dadReceivable / item.profit) * 100).toFixed(1) : 0}%</span>
                                     <span className="w-20 shrink-0 text-fuchsia-600 text-right font-mono">{item.profit > 0 ? ((item.sisterReceivable / item.profit) * 100).toFixed(1) : 0}%</span>
                                  </div>
                                </>
                             ) : (
                                <>
                                  <div className="flex items-center">
                                     <div className="flex-1 flex items-center gap-1.5">
                                        <div className={`w-2.5 h-2.5 rounded-full shadow-sm shrink-0 ${getStatusColor(item.status || 'processing')}`} />
                                        <span className="font-mono font-bold text-slate-700">{item.id}</span>
                                     </div>
                                     <span className="font-mono font-bold text-emerald-600 text-right w-20 shrink-0">{formatCurrency(item.profit)}</span>
                                     <span className="text-sm font-bold text-slate-500 text-right w-16 shrink-0">
                                       {item.revenue > 0 ? ((item.profit / item.revenue) * 100).toFixed(1) : 0}%
                                     </span>
                                     <div className="w-12 flex justify-end shrink-0">
                                         <button onClick={() => openEditModal(item)} className="p-1 px-1.5 flex items-center justify-center bg-blue-50 text-blue-600 rounded border border-blue-200 hover:bg-blue-100 shadow-sm transition-colors">
                                           <Edit2 size={13} />
                                         </button>
                                     </div>
                                  </div>
                                </>
                             )}
                          </div>
                          );
                       })}
                     </div>
                   </div>
                 </>
              );
           })()}
        </div>
      )}

      {activeTab === 'reconciliation' && (() => {
          // 網購系統: 綠(processing), 紅(preorder). 過濾 黃(closed)
          const ecommerceOrders = batchData.filter(d => d.status !== 'closed');
          
          // 代購對帳: 最新月份有資料的月份
          const latestMonth = purchasingRecords.filter(r => 
              r.payments.length > 0 || r.collections.length > 0 || r.bankBalance > 0 || r.profitWithdrawn > 0
          ).map(r => r.month).sort((a, b) => b.localeCompare(a))[0];
          
          const latestRecord = purchasingRecords.find(r => r.month === latestMonth);
          const payments = latestRecord?.payments || [];
          const collections = latestRecord?.collections || [];
          
          // Combine order IDs from both sources
          const orderIds = Array.from(new Set([
              ...ecommerceOrders.map(o => o.id),
              ...payments.map(p => p.orderNo),
              ...collections.map(c => c.orderNo)
          ]));

          // Sort descending by Order ID
          orderIds.sort((a, b) => b.localeCompare(a));
          
          return (
             <div className="flex-1 overflow-y-auto pb-16 bg-white">
<div className="bg-slate-50 border-t border-slate-200 shrink-0">
                   <div className="p-3">
                       {(() => {
                           const totalPrepaymentAmount = orderIds.reduce((sum, id) => {
                               let s = 0;
                               orderItems.filter(i => i.orderGroupId === id).forEach(item => {
                                   const text = `${item.description} ${item.buyer} ${item.remarks} ${item.note}`;
                                   const matches = text.match(/(?:以匯款|已匯款|無卡)[^\d]*?(\d+)/g);
                                   if (matches) matches.forEach(m => { const v = m.match(/\d+/); if(v) s += parseInt(v[0], 10); });
                               });
                               return sum + s;
                           }, 0);

                           const allWithdrawn = batchData.filter(d => !PREVIOUS_PERIOD_IDS.includes(d.id) && (d.dadReceivable !== 0 || d.sisterReceivable !== 0));
                           const totalWithdrawnProfit = allWithdrawn.reduce((acc, d) => acc + d.profit, 0);
                           const sisterWithdrawn = allWithdrawn.reduce((acc, d) => acc + d.sisterReceivable, 0);
                           const dadUnwithdrawn = totalWithdrawnProfit - sisterWithdrawn;
                           const purchasingWithdrawn = latestRecord?.profitWithdrawn || 0;
                           
                           const totalPayments = payments.reduce((acc, p) => acc + p.amount, 0);
                           const totalCollections = collections.reduce((acc, c) => acc + c.amount, 0);
                           const bankBalance = latestRecord?.bankBalance || 0;
                           
                           const totalAmount = totalPayments + totalCollections + bankBalance;

                           return (
                               <>
                                   <div className="flex items-center text-sm font-bold border-b border-slate-200 pb-1">
                                       <span className="text-slate-500 w-1/4">項目</span>
                                       <span className="text-slate-500 w-1/4 text-right">金額</span>
                                       <span className="text-slate-500 w-1/4 text-right">預收</span>
                                       <span className="text-slate-500 w-1/4 text-right">利潤</span>
                                   </div>
                                   <div className="flex items-center text-sm font-bold py-1.5 border-b border-slate-100">
                                       <span className="text-slate-600 w-1/4">代購付款:</span>
                                       <span className="text-orange-600 font-mono w-1/4 text-right">{formatCurrency(totalPayments)}</span>
                                       <span className="text-slate-300 w-1/4 text-right">-</span>
                                       <span className="text-slate-300 w-1/4 text-right">-</span>
                                   </div>
                                   <div className="flex items-center text-sm font-bold py-1.5 border-b border-slate-100">
                                       <span className="text-slate-600 w-1/4">出貨代收:</span>
                                       <span className="text-fuchsia-600 font-mono w-1/4 text-right">{formatCurrency(totalCollections)}</span>
                                       <span className="text-slate-300 w-1/4 text-right">-</span>
                                       <span className="text-slate-300 w-1/4 text-right">-</span>
                                   </div>
                                   <div className="flex items-center text-sm font-bold py-1.5 border-b border-slate-100">
                                       <span className="text-slate-600 w-1/4">銀行餘額:</span>
                                       <span className="text-blue-600 font-mono w-1/4 text-right">{formatCurrency(bankBalance)}</span>
                                       <span className="text-slate-300 w-1/4 text-right">-</span>
                                       <span className="text-slate-300 w-1/4 text-right">-</span>
                                   </div>
                                   <div className="flex items-center text-sm font-bold py-1.5 border-b border-slate-100">
                                       <span className="text-slate-600 w-1/4">妹妹領現:</span>
                                       <span className="text-slate-500 font-normal w-1/4 text-right text-[11px] truncate px-1">(代購: {formatCurrency(purchasingWithdrawn)})</span>
                                       <span className="text-slate-300 w-1/4 text-right">-</span>
                                       <span className="text-indigo-600 font-mono w-1/4 text-right">{formatCurrency(sisterWithdrawn)}</span>
                                   </div>
                                   <div className="flex items-center text-sm font-bold py-1.5 border-b border-slate-100">
                                       <span className="text-slate-600 w-1/4">爸爸未領:</span>
                                       <span className="text-slate-300 w-1/4 text-right">-</span>
                                       <span className="text-slate-300 w-1/4 text-right">-</span>
                                       <span className="text-emerald-600 font-mono w-1/4 text-right">{formatCurrency(dadUnwithdrawn)}</span>
                                   </div>
                                   <div className="flex items-center text-sm font-bold py-1.5 border-b border-slate-100">
                                       <span className="text-slate-600 w-1/4">預收款項:</span>
                                       <span className="text-slate-300 w-1/4 text-right">-</span>
                                       <span className="text-emerald-600 font-mono w-1/4 text-right">{formatCurrency(totalPrepaymentAmount)}</span>
                                       <span className="text-slate-300 w-1/4 text-right">-</span>
                                   </div>
                                   <div className="flex items-center text-base font-bold pt-2 border-t border-slate-200 mt-2">
                                       <span className="text-slate-800 w-1/4">合計金額:</span>
                                       <span className="text-slate-800 font-mono w-1/4 text-right">{formatCurrency(totalAmount)}</span>
                                       <span className="text-slate-800 font-mono w-1/4 text-right">{formatCurrency(totalPrepaymentAmount)}</span>
                                       <span className="text-slate-800 font-mono w-1/4 text-right">{formatCurrency(totalWithdrawnProfit)}</span>
                                   </div>
                               </>
                           );
                       })()}
                   </div>
                </div>{/* 空間區隔 */}
                <div className="h-6 bg-slate-100 border-t border-slate-200 shadow-inner"></div>

                {latestMonth ? (
                   <div className="p-3 bg-slate-50 border-b border-slate-200 shrink-0 z-10 shadow-sm">
                      <div className="text-sm font-bold text-slate-700 flex items-center gap-2">
                          <CheckCircle size={16} className="text-emerald-500" /> 比對代購月份: <span className="text-blue-600 bg-blue-100 px-2 py-0.5 rounded-md">{latestMonth}</span>
                      </div>
                   </div>
                ) : (
                   <div className="p-3 bg-amber-50 text-amber-700 text-sm font-bold border-b border-amber-200 shrink-0 z-10">
                      <AlertTriangle size={16} className="inline mr-1" /> 尚未有代購對帳資料
                   </div>
                )}
                <table className="w-full text-left text-sm">
                   <thead className="bg-slate-100 text-slate-600 border-b border-slate-200 sticky top-0 z-10 shadow-sm">
                       <tr>
                           <th className="px-1 py-2 font-bold w-1/5">訂單序</th>
                           <th className="px-1 py-2 font-bold text-right w-1/5">網購收入</th>
                           <th className="px-1 py-2 font-bold text-right w-1/5 text-orange-700">代購付款</th>
                           <th className="px-1 py-2 font-bold text-right w-1/5 text-fuchsia-700">出貨代收</th>
                           <th className="px-1 py-2 font-bold text-right w-1/5 text-emerald-600">預收款</th>
                       </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-100">
                       {orderIds.map(id => {
                           const eo = ecommerceOrders.find(o => o.id === id);
                           const paymentAmount = payments.filter(p => p.orderNo === id).reduce((acc, p) => acc + p.amount, 0);
                           const collectionAmount = collections.filter(c => c.orderNo === id).reduce((acc, c) => acc + c.amount, 0);
                           
                           // Calculate prepayment amount from order items
                           const items = orderItems.filter(i => i.orderGroupId === id);
                           let prepaymentAmount = 0;
                           items.forEach(item => {
                               const text = `${item.description} ${item.buyer} ${item.remarks} ${item.note}`;
                               const matches = text.match(/(?:以匯款|已匯款|無卡)[^\d]*?(\d+)/g);
                               if (matches) {
                                   matches.forEach(m => {
                                       const v = m.match(/\d+/);
                                       if (v) prepaymentAmount += parseInt(v[0], 10);
                                   });
                               }
                           });
                           
                           const hasEo = !!eo;
                           const income = hasEo ? eo.revenue : 0;
                           
                           // Check if it's missing from ecommerce but exists in purchasing
                           const isWarning = !hasEo && (paymentAmount > 0 || collectionAmount > 0);
                           
                           return (
                               <tr key={id} className={`hover:bg-slate-50 transition-colors ${isWarning ? 'bg-amber-50/50' : ''}`}>
                                   <td className="px-1 py-3 border-r border-slate-100">
                                       <div className={`font-mono font-bold ${isWarning ? 'text-amber-700' : 'text-slate-700'}`}>{id}</div>
                                   </td>
                                   <td className="px-1 py-3 text-right border-r border-slate-100">
                                       <div className="font-mono font-bold text-blue-600">{hasEo ? formatCurrency(income) : '-'}</div>
                                   </td>
                                   <td className="px-1 py-3 text-right border-r border-slate-100 bg-orange-50/30">
                                       <div className="font-mono font-bold text-orange-600">{paymentAmount > 0 ? formatCurrency(paymentAmount) : '-'}</div>
                                   </td>
                                   <td className="px-1 py-3 text-right border-r border-slate-100 bg-fuchsia-50/30">
                                        <div className="font-mono font-bold text-fuchsia-600">{collectionAmount > 0 ? formatCurrency(collectionAmount) : '-'}</div>
                                   </td>
                                   <td className="px-1 py-3 text-right bg-emerald-50/30">
                                       <div className="font-mono font-bold text-emerald-600">{prepaymentAmount > 0 ? formatCurrency(prepaymentAmount) : '-'}</div>
                                   </td>
                               </tr>
                           );
                       })}
                       {orderIds.length === 0 && (
                           <tr>
                               <td colSpan={5} className="text-center py-8 text-slate-400 font-bold">目前沒有資料可比對</td>
                           </tr>
                       )}
                   </tbody>
                   {orderIds.length > 0 && (
                       <tfoot className="bg-slate-100 text-slate-700 font-bold border-t border-slate-200">
                           <tr>
                               <td className="px-1 py-3 border-r border-slate-200">合計</td>
                               <td className="px-1 py-3 text-right border-r border-slate-200 text-blue-600">{formatCurrency(orderIds.reduce((sum, id) => sum + (ecommerceOrders.find(o => o.id === id) ? ecommerceOrders.find(o => o.id === id)!.revenue : 0), 0))}</td>
                               <td className="px-1 py-3 text-right border-r border-slate-200 text-orange-600">{formatCurrency(orderIds.reduce((sum, id) => sum + payments.filter(p => p.orderNo === id).reduce((acc, p) => acc + p.amount, 0), 0))}</td>
                               <td className="px-1 py-3 text-right border-r border-slate-200 text-fuchsia-600">{formatCurrency(orderIds.reduce((sum, id) => sum + collections.filter(c => c.orderNo === id).reduce((acc, c) => acc + c.amount, 0), 0))}</td>
                               <td className="px-1 py-3 text-right text-emerald-600">{formatCurrency(orderIds.reduce((sum, id) => {
                                   let s = 0;
                                   orderItems.filter(i => i.orderGroupId === id).forEach(item => {
                                       const text = `${item.description} ${item.buyer} ${item.remarks} ${item.note}`;
                                       const matches = text.match(/(?:以匯款|已匯款|無卡)[^\d]*?(\d+)/g);
                                       if (matches) matches.forEach(m => { const v = m.match(/\d+/); if(v) s += parseInt(v[0], 10); });
                                   });
                                   return sum + s;
                               }, 0))}</td>
                           </tr>
                       </tfoot>
                   )}
               </table>
                
                
             </div>
          );
      })()}

      {activeTab === 'purchase' && (() => {
          let validOrderIds = batchData.map(b => b.id);
          if (purchaseFilter === 'unsettled') {
              validOrderIds = batchData.filter(b => b.status === 'processing' || b.status === 'preorder').map(b => b.id);
          } else if (purchaseFilter === 'settled') {
              validOrderIds = batchData.filter(b => b.status === 'closed').map(b => b.id);
          }
          
          const chenItems = orderItems.filter(i => i.buyer === '陳禹辰' && validOrderIds.includes(i.orderGroupId));
          
          const chensOrders = validOrderIds.map(id => {
              const itemsInOrder = chenItems.filter(i => {
                  if (i.orderGroupId !== id) return false;
                  const p = productItems.find(p => p.groupId === i.productGroupId && p.id === i.productItemId);
                  return p ? !p.name.includes('境內運費') : true;
              });
              if (itemsInOrder.length === 0) return null;
              
              const batch = batchData.find(b => b.id === id)!;
              let purchaseTotal = 0;
              const items = itemsInOrder.map(item => {
                  const product = productItems.find(p => p.groupId === item.productGroupId && p.id === item.productItemId);
                  const unitPrice = product ? product.inputPrice : 0;
                  const lineTotal = unitPrice * item.quantity;
                  purchaseTotal += lineTotal;
                  return {
                      ...item,
                      productName: product ? product.name : '未知商品',
                      unitPrice
                  };
              });
              
              return {
                  id,
                  status: batch.status,
                  orderRevenue: batch.revenue,
                  itemCount: itemsInOrder.length,
                  purchaseTotal,
                  items
              };
          }).filter(o => o !== null) as any[];

          chensOrders.sort((a,b) => b.id.localeCompare(a.id));
          
          const totalRevenue = chensOrders.reduce((sum, o) => sum + o.orderRevenue, 0);
          const totalPurchase = chensOrders.reduce((sum, o) => sum + o.purchaseTotal, 0);
          const percentage = totalRevenue > 0 ? ((totalPurchase / totalRevenue) * 100).toFixed(1) : '0.0';

          return (
             <div className="flex-1 flex flex-col min-h-0 bg-white">
                <div className="p-2 border-b border-slate-200 bg-slate-50 shrink-0 z-10 flex gap-2">
                    <button onClick={() => setPurchaseFilter('all')} className={`flex-1 py-1.5 text-sm font-bold rounded-lg border transition-all ${purchaseFilter === 'all' ? 'bg-indigo-100 text-indigo-800 border-indigo-300 shadow-sm' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'}`}>全部</button>
                    <button onClick={() => setPurchaseFilter('unsettled')} className={`flex-1 py-1.5 text-sm font-bold rounded-lg border transition-all ${purchaseFilter === 'unsettled' ? 'bg-indigo-100 text-indigo-800 border-indigo-300 shadow-sm' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'}`}>未結</button>
                    <button onClick={() => setPurchaseFilter('settled')} className={`flex-1 py-1.5 text-sm font-bold rounded-lg border transition-all ${purchaseFilter === 'settled' ? 'bg-indigo-100 text-indigo-800 border-indigo-300 shadow-sm' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'}`}>已結</button>
                </div>
                
                <div className="p-3 bg-indigo-50 border-b border-indigo-100 shrink-0 shadow-sm">
                    <div className="flex justify-between items-center text-xs font-bold text-indigo-800 mb-1">
                        <span>訂單總收入</span>
                        <span>購買總金額</span>
                        <span>百分比</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="font-mono font-bold text-lg text-slate-700">{formatCurrency(totalRevenue)}</span>
                        <span className="font-mono font-bold text-lg text-indigo-600">{formatCurrency(totalPurchase)}</span>
                        <span className="font-mono font-bold text-lg text-fuchsia-600">{percentage}%</span>
                    </div>
                </div>

                <div className="overflow-y-auto flex-1 pb-16 bg-white">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-orange-200 text-orange-900 border-b border-orange-300 sticky top-0 z-10 shadow-sm">
                            <tr>
                                <th className="px-2 py-2 font-bold w-1/3">燈號 訂單序</th>
                                <th className="px-2 py-2 font-bold text-left w-1/3">商品項目</th>
                                <th className="px-2 py-2 font-bold text-right w-1/3">金額</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-orange-200/50">
                            {chensOrders.length === 0 && (
                                <tr>
                                    <td colSpan={3} className="text-center text-slate-400 font-bold py-8">沒有符合的購買紀錄</td>
                                </tr>
                            )}
                            {chensOrders.map(order => {
                                const isExpanded = expandedPurchaseId === order.id;
                                const groupNames = Array.from(new Set(order.items.map((i: any) => {
                                    const g = productGroups.find(g => g.id === i.productGroupId);
                                    return g ? g.name : '';
                                }))).filter(Boolean).join(' / ');
                                return (
                                    <React.Fragment key={order.id}>
                                        <tr 
                                            className={`cursor-pointer hover:bg-orange-200 transition-colors ${isExpanded ? 'bg-orange-200' : 'bg-orange-100'}`}
                                            onClick={() => setExpandedPurchaseId(isExpanded ? null : order.id)}
                                        >
                                            <td className="px-2 py-3 border-r border-orange-200/50">
                                                <div className="flex items-center gap-1.5">
                                                    <div className={`w-2.5 h-2.5 rounded-full shadow-sm shrink-0 ${getStatusColor(order.status || 'processing')}`} />
                                                    <span className="font-mono font-bold text-slate-800">{order.id}</span>
                                                </div>
                                            </td>
                                            <td className="px-2 py-3 border-r border-orange-200/50 text-left">
                                                <div className="text-slate-800 font-bold text-xs truncate max-w-[150px]">
                                                    {groupNames || '-'}
                                                </div>
                                            </td>
                                            <td className="px-2 py-3">
                                                <div className="flex items-center justify-end gap-1">
                                                    <span className="font-mono font-bold text-indigo-700">{formatCurrency(order.purchaseTotal)}</span>
                                                    {isExpanded ? <ChevronUp size={16} className="text-slate-500" /> : <ChevronDown size={16} className="text-slate-500" />}
                                                </div>
                                            </td>
                                        </tr>
                                        {isExpanded && (
                                            <tr>
                                                <td colSpan={3} className="bg-orange-50 p-0 border-t border-orange-200">
                                                    <table className="w-full text-xs text-left">
                                                        <tbody className="divide-y divide-orange-100">
                                                            {order.items.map((item: any) => {
                                                                const lineTotal = item.quantity * item.unitPrice;
                                                                return (
                                                                    <tr key={item.id} className="hover:bg-orange-100/70 transition-colors text-slate-700">
                                                                        <td className="pl-6 py-2 font-bold truncate max-w-[180px]">
                                                                            {item.productName}
                                                                            {item.description && <span className="text-slate-500 font-normal"> : {item.description}</span>}
                                                                        </td>
                                                                        <td className="px-2 py-2 text-right font-bold w-12 text-slate-600">x{item.quantity}</td>
                                                                        <td className="px-2 py-2 text-right font-mono text-slate-500 w-16">{formatCurrency(item.unitPrice)}</td>
                                                                        <td className="px-2 py-2 text-right font-mono font-bold text-emerald-600 w-16">{formatCurrency(lineTotal)}</td>
                                                                    </tr>
                                                                );
                                                            })}
                                                        </tbody>
                                                    </table>
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
             </div>
          );
      })()}

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
                    {(() => {
                        const targetData = batchData.find(d => d.id === editTarget);
                        const targetProfit = targetData ? targetData.profit : 0;
                        return (
                          <div className="flex flex-col gap-4">
                              <div className="flex gap-2">
                                  {(['processing', 'preorder', 'closed'] as const).map(opt => {
                                      let label = '進行';
                                      if (opt === 'preorder') label = '預購';
                                      if (opt === 'closed') label = '結案';
                                      let activeColor = '';
                                      if (opt === 'processing') activeColor = 'bg-emerald-100 text-emerald-800 border-emerald-300 shadow-sm';
                                      else if (opt === 'preorder') activeColor = 'bg-rose-100 text-rose-800 border-rose-300 shadow-sm';
                                      else if (opt === 'closed') activeColor = 'bg-yellow-100 text-yellow-800 border-yellow-300 shadow-sm';
                                      return (
                                          <button 
                                              key={opt}
                                              onClick={() => setEditStatus(opt)}
                                              className={`flex-1 py-1.5 font-bold text-sm rounded-lg border transition-all ${editStatus === opt ? activeColor : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'}`}
                                          >
                                              {label}
                                          </button>
                                      );
                                  })}
                              </div>
                              <div className="flex gap-2 text-[11px] font-bold text-slate-400 select-none px-1">
                                  <div className="flex-1 text-left whitespace-nowrap overflow-hidden text-ellipsis">總利潤: {formatCurrency(targetProfit)}</div>
                                  <div className="flex-1 text-center whitespace-nowrap overflow-hidden text-ellipsis">預計爸爸: {formatCurrency(Math.round(targetProfit * 0.2))}</div>
                                  <div className="flex-1 text-right whitespace-nowrap overflow-hidden text-ellipsis">預計妹妹: {formatCurrency(Math.round(targetProfit * 0.8))}</div>
                              </div>
                          </div>
                        );
                    })()}
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
