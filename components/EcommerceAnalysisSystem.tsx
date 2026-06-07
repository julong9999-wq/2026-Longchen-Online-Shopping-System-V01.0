import React, { useState, useMemo } from 'react';
import { Home, Truck, DollarSign } from 'lucide-react';
import { OrderGroup, OrderItem, ProductItem } from '../types';
import { formatCurrency } from '../utils';

interface EcommerceAnalysisSystemProps {
  orderGroups: OrderGroup[];
  orderItems: OrderItem[];
  productItems: ProductItem[];
  allIncomeSettings: Record<string, any>;
  onNavigateHome: () => void;
}

const EcommerceAnalysisSystem: React.FC<EcommerceAnalysisSystemProps> = ({
  orderGroups,
  orderItems,
  productItems,
  allIncomeSettings,
  onNavigateHome,
}) => {
  const [activeTab, setActiveTab] = useState<'shipping' | 'profit'>('shipping');
  const [statusFilter, setStatusFilter] = useState<'processing' | 'preorder' | 'closed'>('processing');

  // Calculate batched data
  const batchData = useMemo(() => {
    return orderGroups.map(group => {
      const itemsInBatch = orderItems.filter(i => i.orderGroupId === group.id);
      const settings = allIncomeSettings[group.id] || {};
      const packaging = Number(settings.packagingRevenue) || 0;
      const cardCharge = Number(settings.cardCharge) || 0;
      const cardFee = Number(settings.cardFee) || 0;
      const intlShip = Number(settings.intlShipping) || 0;
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
        status
      };
    }).sort((a, b) => b.id.localeCompare(a.id));
  }, [orderGroups, orderItems, productItems, allIncomeSettings]);

  // Filter based on status
  const filteredData = batchData.filter(item => item.status === statusFilter);

  const renderNav = () => (
    <div className="bg-sky-600 border-t border-sky-700 flex justify-around items-center pb-safe shadow-2xl shrink-0 z-50 text-white h-20">
      <button 
        onClick={() => setActiveTab('shipping')} 
        className={`flex-1 flex flex-col items-center justify-center h-full transition-all duration-200 ${activeTab === 'shipping' ? 'text-yellow-300 bg-sky-800/50' : 'text-sky-200 hover:text-white'}`}
      >
        <Truck size={24} strokeWidth={activeTab === 'shipping' ? 2.5 : 2} />
        <span className="text-sm font-bold mt-1 tracking-wide">運費</span>
      </button>

      <button 
        onClick={() => setActiveTab('profit')} 
        className={`flex-1 flex flex-col items-center justify-center h-full transition-all duration-200 ${activeTab === 'profit' ? 'text-yellow-300 bg-sky-800/50' : 'text-sky-200 hover:text-white'}`}
      >
        <DollarSign size={24} strokeWidth={activeTab === 'profit' ? 2.5 : 2} />
        <span className="text-sm font-bold mt-1 tracking-wide">利潤</span>
      </button>

      <button 
        onClick={onNavigateHome}
        className="flex-1 flex flex-col items-center justify-center h-full transition-all duration-200 text-sky-200 hover:text-white"
      >
        <Home size={24} strokeWidth={2} />
        <span className="text-sm font-bold mt-1 tracking-wide">返回</span>
      </button>
    </div>
  );

  return (
    <div className="h-screen w-full flex flex-col bg-slate-50 overflow-hidden font-sans">
      {/* Header */}
      <div className="bg-sky-600 px-4 py-3 shrink-0 flex items-center shadow-md z-10 justify-between">
        <h1 className="text-white text-xl font-bold tracking-wide flex items-center gap-2">
            {activeTab === 'shipping' ? '國際運費分析' : '利潤分析'}
        </h1>
      </div>

      {/* Filter Tabs */}
      <div className="bg-white p-3 shadow-sm border-b border-slate-200 shrink-0 z-10 flex gap-2">
        {(['processing', 'preorder', 'closed'] as const).map(status => {
           let label = '進行';
           if (status === 'preorder') label = '預購';
           if (status === 'closed') label = '結案';
           
           return (
             <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`flex-1 py-2 font-bold text-sm rounded-xl transition-all border
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

      {/* Data Table */}
      <div className="flex-1 p-4 flex flex-col min-h-0">
         <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-y-auto flex-1">
            <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-500 border-b border-slate-100 sticky top-0 z-10">
                    <tr>
                        <th className="px-3 py-3 font-bold w-1/4">訂單序</th>
                        <th className="px-3 py-3 font-bold text-right w-1/4">收入</th>
                        <th className="px-3 py-3 font-bold text-right w-1/4">{activeTab === 'shipping' ? '國際運費' : '利潤'}</th>
                        <th className="px-3 py-3 font-bold text-right w-1/4">百分比</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {filteredData.length === 0 ? (
                        <tr>
                            <td colSpan={4} className="px-3 py-6 text-center text-slate-400">沒有符合的資料</td>
                        </tr>
                    ) : (
                        filteredData.map(item => {
                            const val = activeTab === 'shipping' ? item.intlShip : item.profit;
                            let percentage = 0;
                            if (item.revenue > 0) percentage = (val / item.revenue) * 100;

                            return (
                                <tr key={item.id} className="hover:bg-slate-50">
                                    <td className="px-3 py-3 font-mono font-bold text-slate-600">{item.id}</td>
                                    <td className="px-3 py-3 text-right font-mono font-bold text-blue-600">{formatCurrency(item.revenue)}</td>
                                    <td className={`px-3 py-3 text-right font-mono font-bold ${activeTab === 'shipping' ? 'text-amber-600' : (val > 0 ? 'text-emerald-600' : 'text-rose-600')}`}>
                                        {formatCurrency(val)}
                                    </td>
                                    <td className="px-3 py-3 text-right font-mono font-bold text-slate-700">
                                        {percentage.toFixed(1)}%
                                    </td>
                                </tr>
                            );
                        })
                    )}
                </tbody>
                {filteredData.length > 0 && (
                    <tfoot className="bg-sky-100 border-t-2 border-sky-300 sticky bottom-0 z-10 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
                        <tr>
                            <td className="px-3 py-3 font-bold text-slate-800">合計</td>
                            <td className="px-3 py-3 text-right font-mono font-bold text-blue-700">
                                {formatCurrency(filteredData.reduce((acc, item) => acc + item.revenue, 0))}
                            </td>
                            <td className={`px-3 py-3 text-right font-mono font-bold ${activeTab === 'shipping' ? 'text-amber-700' : 'text-emerald-700'}`}>
                                {formatCurrency(filteredData.reduce((acc, item) => acc + (activeTab === 'shipping' ? item.intlShip : item.profit), 0))}
                            </td>
                            <td className="px-3 py-3 text-right font-mono font-bold text-slate-800">
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

      {renderNav()}
    </div>
  );
};

export default EcommerceAnalysisSystem;
