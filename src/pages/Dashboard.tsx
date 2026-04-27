import React, { useEffect, useState } from 'react';
import { fetchApi } from '../lib/api';
import { Package, AlertCircle, DollarSign, TrendingUp, Info } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Cell, PieChart, Pie } from 'recharts';
import { formatGHS } from '../lib/formatters';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

export default function Dashboard() {
  const { user } = useAuth();
  const [summary, setSummary] = useState<any>(null);
  const [lowStockProducts, setLowStockProducts] = useState<any[]>([]);
  const [weeklyData, setWeeklyData] = useState<any[]>([]);
  const [monthlyTrends, setMonthlyTrends] = useState<any[]>([]);
  const [salesTrends, setSalesTrends] = useState<any[]>([]);
  const [trendTimeframe, setTrendTimeframe] = useState<'weekly' | 'monthly' | 'yearly'>('monthly');
  const [bestSellers, setBestSellers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetchApi('/reports/summary'),
      fetchApi('/reports/low-stock'),
      fetchApi('/reports/chart'),
      fetchApi('/reports/monthly-trends'),
      fetchApi('/reports/best-sellers')
    ])
      .then(([summaryData, lowStockData, weekly, monthly, top]) => {
         setSummary(summaryData);
         setLowStockProducts(lowStockData);
         setWeeklyData(weekly.map((d: any) => ({ ...d, total: d.total || 0 })));
         setMonthlyTrends(monthly.map((d: any) => ({ ...d, total: d.total || 0 })));
         setBestSellers(top);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user]);

  useEffect(() => {
    fetchApi(`/reports/sales-trends?timeframe=${trendTimeframe}`)
      .then(data => setSalesTrends(data))
      .catch(console.error);
  }, [trendTimeframe]);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="grid grid-cols-4 gap-4">
           {[1,2,3,4].map(i => <div key={i} className="h-32 bg-slate-200 rounded-sm"></div>)}
        </div>
        <div className="grid grid-cols-2 gap-8">
           <div className="h-80 bg-slate-200 rounded-sm"></div>
           <div className="h-80 bg-slate-200 rounded-sm"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
           <h1 className="text-[24px] font-black text-slate-900 tracking-tight">Business Intelligence</h1>
           <p className="text-[11px] text-slate-400 font-black uppercase tracking-[0.2em] mt-1">Ummis Lane Enterprise / Performance Metrics</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full border border-blue-100">
           <Info size={14} />
           <span className="text-[10px] font-black uppercase tracking-widest">Real-time Data Active</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Inventory Depth" value={summary?.totalProducts || 0} icon={<Package size={18} className="text-blue-500" />} subtitle="Total Unique SKUs" />
        <StatCard title="Critical Stock" value={summary?.lowStockProducts || 0} icon={<AlertCircle size={18} className="text-red-500" />} subtitle="Items below threshold" color="text-red-600" />
        <StatCard title="Lifetime Revenue" value={formatGHS(summary?.totalSalesValue || 0)} icon={<DollarSign size={18} className="text-emerald-500" />} subtitle="Across all transactions" />
        <StatCard title="Today's Velocity" value={formatGHS(summary?.todaySalesValue || 0)} icon={<TrendingUp size={18} className="text-blue-600" />} subtitle="Daily performance" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Sales Performance Trends */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
             <div>
                <h2 className="text-[13px] font-black text-slate-900 uppercase tracking-widest">Performance Insights</h2>
                <p className="text-[10px] text-slate-400 font-bold uppercase">Sales velocity trend analysis</p>
             </div>
             <div className="flex bg-slate-100 p-1 rounded-sm gap-1">
                {(['weekly', 'monthly', 'yearly'] as const).map(tf => (
                  <button 
                    key={tf}
                    onClick={() => setTrendTimeframe(tf)}
                    className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-sm transition-all ${trendTimeframe === tf ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                  >
                    {tf}
                  </button>
                ))}
             </div>
          </div>
          <div className="bg-white border border-slate-200 rounded-sm p-6 shadow-sm h-[320px] min-w-0">
            {salesTrends.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={salesTrends}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontStyle: 'bold', fill: '#94a3b8' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontStyle: 'bold', fill: '#94a3b8' }} tickFormatter={(val) => `₵${val}`} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '2px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', background: '#0f172a', color: '#fff' }}
                    itemStyle={{ color: '#fff', fontSize: '11px', fontWeight: 'bold' }}
                    labelStyle={{ color: '#64748b', fontSize: '10px', marginBottom: '4px', textTransform: 'uppercase' }}
                    formatter={(val: any) => [formatGHS(Number(val) || 0), 'Revenue']}
                  />
                  <Line type="monotone" dataKey="total" stroke="#3b82f6" strokeWidth={3} dot={{ fill: '#3b82f6', r: 4 }} activeDot={{ r: 6, strokeWidth: 0 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
               <EmptyState />
            )}
          </div>
        </div>

        {/* Best Sellers */}
        <div className="space-y-4">
           <h2 className="text-[13px] font-black text-slate-900 uppercase tracking-widest">Velocity Leaders</h2>
           <div className="bg-white border border-slate-200 rounded-sm p-6 shadow-sm h-[320px] min-w-0 flex flex-col justify-center">
              {bestSellers.length > 0 ? (
                <>
                   <div className="h-48 mb-6">
                      <ResponsiveContainer width="100%" height="100%">
                         <PieChart>
                            <Pie data={bestSellers} dataKey="total_sold" nameKey="name" cx="50%" cy="50%" innerRadius={40} outerRadius={60} paddingAngle={5}>
                               {bestSellers.map((_, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                            </Pie>
                            <Tooltip formatter={(value: any) => [`${Number(value) || 0} units`, 'Sales']} />
                         </PieChart>
                      </ResponsiveContainer>
                   </div>
                   <div className="space-y-2">
                      {bestSellers.map((p, index) => (
                        <div key={p.name} className="flex items-center justify-between text-[11px]">
                           <div className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></span>
                              <span className="font-bold text-slate-600 truncate max-w-[120px]">{p.name}</span>
                           </div>
                           <span className="font-black text-slate-900">{p.total_sold} Sold</span>
                        </div>
                      ))}
                   </div>
                </>
              ) : <EmptyState />}
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
           <h2 className="text-[13px] font-black text-slate-900 uppercase tracking-widest mb-4">Stock Alerts</h2>
           <div className="bg-white border border-slate-200 rounded-sm overflow-hidden shadow-sm">
              <table className="min-w-full divide-y divide-slate-100">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-5 py-3 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Item</th>
                    <th className="px-5 py-3 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Qty</th>
                    <th className="px-5 py-3 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Priority</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 italic">
                   {lowStockProducts.map(p => (
                     <tr key={p.id}>
                        <td className="px-5 py-3 text-[12px] font-bold text-slate-700 uppercase">{p.name}</td>
                        <td className="px-5 py-3 text-center text-[12px] font-black text-red-500">{p.stock_quantity}</td>
                        <td className="px-5 py-3 text-right">
                           <span className="inline-block w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                        </td>
                     </tr>
                   ))}
                   {lowStockProducts.length === 0 && (
                     <tr><td colSpan={3} className="px-5 py-6 text-center text-[11px] text-slate-400 uppercase font-black">All inventory healthy</td></tr>
                   )}
                </tbody>
              </table>
           </div>
        </div>

        <div>
           <h2 className="text-[13px] font-black text-slate-900 uppercase tracking-widest mb-4">Weekly Sales Volume</h2>
           <div className="bg-white border border-slate-200 rounded-sm p-6 shadow-sm h-64 min-w-0">
              <ResponsiveContainer width="100%" height="100%">
                 <BarChart data={weeklyData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 'bold', fill: '#64748B' }} />
                    <YAxis hide />
                     <Tooltip contentStyle={{ borderRadius: '2px', border: '1px solid #E2E8F0', fontSize: '11px' }} formatter={(val: any) => [formatGHS(Number(val) || 0), 'Volume']} />
                    <Bar dataKey="total" fill="#94a3b8" radius={[2, 2, 0, 0]} />
                 </BarChart>
              </ResponsiveContainer>
           </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, subtitle, color = 'text-slate-900' }: { title: string, value: string | number, icon: any, subtitle: string, color?: string }) {
  return (
    <div className="bg-white border border-slate-200 p-6 rounded-sm shadow-sm relative overflow-hidden group">
      <div className="absolute right-4 top-4 opacity-10 group-hover:opacity-20 transition-opacity">{icon}</div>
      <div className="space-y-4">
         <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">{title}</div>
         <div>
            <div className={`text-2xl font-black tracking-tight ${color}`}>{value}</div>
            <div className="text-[10px] font-bold text-slate-400 uppercase mt-1">{subtitle}</div>
         </div>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="h-full flex items-center justify-center text-slate-300 text-[11px] font-black uppercase tracking-widest">
       No Data Detected
    </div>
  );
}
