import React, { useEffect, useState, useRef } from 'react';
import { fetchApi } from '../lib/api';
import { ShoppingCart, Printer, RotateCcw, Search, X, Tag, Minus, Plus, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { formatGHS } from '../lib/formatters';

export default function Sales() {
  const { user } = useAuth();
  const [sales, setSales] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [cart, setCart] = useState<{product_id: number, quantity: number, unit_price: number, notes?: string}[]>([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Card' | 'Mobile Money'>('Cash');
  const [recepiptData, setReceiptData] = useState<any>(null);
  const [customers, setCustomers] = useState<any[]>([]);

  useEffect(() => {
    loadData();
  }, [startDate, endDate, categoryFilter]);

  const handleRefund = async (saleId: number) => {
    const reason = prompt("Enter reason for refund (optional):");
    if (reason !== null && confirm("Are you sure you want to refund this sale? Items will be returned to inventory.")) {
      try {
        await fetchApi(`/sales/${saleId}/refund`, { 
          method: 'POST',
          body: JSON.stringify({ reason })
        });
        loadData();
      } catch (err: any) { alert(err.message); }
    }
  };

  const loadData = async () => {
    try {
      const query = new URLSearchParams();
      if (startDate) query.append('startDate', startDate);
      if (endDate) query.append('endDate', endDate);
      if (categoryFilter) query.append('category', categoryFilter);

      const [salesRes, prodRes, usersRes, customersRes, categoriesRes] = await Promise.all([
        fetchApi(`/sales?${query.toString()}`),
        fetchApi('/products'),
        fetchApi('/users'),
        fetchApi('/customers'),
        fetchApi('/categories')
      ]);
      setSales(salesRes);
      setProducts(prodRes);
      setUsers(usersRes);
      setCustomers(customersRes);
      setCategories(categoriesRes);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    try {
      const res = await fetchApi('/sales', {
        method: 'POST',
        body: JSON.stringify({ 
          items: cart, 
          customer_id: selectedCustomer ? parseInt(selectedCustomer, 10) : null,
          payment_method: paymentMethod
        })
      });
      setShowConfirmModal(false);
      setShowModal(false);
      setReceiptData({
         saleId: res.saleId,
         items: [...cart],
         total: totalCart,
         date: new Date(),
         customerName: customers.find(c => c.id.toString() === selectedCustomer)?.name || null,
         paymentMethod
      });
      setCart([]);
      setSelectedCustomer('');
      setPaymentMethod('Cash');
      loadData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleReprint = async (saleId: number) => {
    try {
      const sale = await fetchApi(`/sales/${saleId}`);
      setReceiptData({
        saleId: sale.id,
        items: sale.items,
        total: sale.total_amount,
        date: new Date(sale.created_at + 'Z'),
        customerName: sale.customer_name,
        paymentMethod: sale.payment_method
      });
    } catch (err: any) {
      alert(err.message);
    }
  };

  const addToCart = (productId: number, price: number) => {
    setCart(prev => {
      const existing = prev.find(i => i.product_id === productId);
      if (existing) {
        const p = products.find(prod => prod.id === productId);
        if (p && existing.quantity + 1 > p.stock_quantity) {
           alert(`Cannot exceed stock of ${p.stock_quantity}`);
           return prev;
        }
        return prev.map(i => i.product_id === productId ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { product_id: productId, quantity: 1, unit_price: price }];
    });
  };

  const totalCart = cart.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);

  const handleExportCSV = () => {
    if (sales.length === 0) return;
    const headers = ['Sale ID', 'Date', 'Cashier', 'Payment Method', 'Status', 'Total Amount', 'Transaction Profit'];
    const csvRows = [headers.join(',')];

    for (const s of sales) {
      const row = [
        `SALE-${s.id}`,
        `"${new Date(s.created_at + 'Z').toLocaleString()}"`,
        `"${s.user_name}"`,
        s.payment_method,
        s.status,
        `"${formatGHS(s.total_amount)}"`,
        user?.role === 'admin' ? `"${formatGHS(s.profit || 0)}"` : '',
      ];
      csvRows.push(row.join(','));
    }

    const csvStr = csvRows.join('\n');
    const blob = new Blob([csvStr], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `sales_report_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-[20px] font-bold text-slate-900 tracking-tight">Sales Records</h1>
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
          <div className="flex flex-wrap items-center gap-3 bg-white p-1 rounded-sm border border-slate-200">
             <div className="flex items-center gap-2 px-2 border-l border-slate-100">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Category:</label>
                <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} className="border-none bg-slate-50 px-2 py-1.5 rounded-sm text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500/20">
                  <option value="">All Categories</option>
                  {categories.map((c: any) => (
                    <option key={c.id} value={c.name}>{c.name}</option>
                  ))}
                </select>
             </div>
             <div className="h-4 w-[1px] bg-slate-200 hidden sm:block"></div>
             <div className="flex items-center gap-2 px-2 border-l border-slate-100">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Period:</label>
                <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="border-none bg-slate-50 px-2 py-1.5 rounded-sm text-xs text-slate-700 focus:outline-none" />
                <span className="text-slate-300 text-xs">-</span>
                <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="border-none bg-slate-50 px-2 py-1.5 rounded-sm text-xs text-slate-700 focus:outline-none" />
             </div>
             {(startDate || endDate || categoryFilter) && (
               <button 
                 onClick={() => {
                   setStartDate('');
                   setEndDate('');
                   setCategoryFilter('');
                 }}
                 className="text-[10px] font-bold text-blue-500 uppercase tracking-widest px-3 hover:text-blue-600 transition-colors border-l border-slate-100"
               >
                 Reset
               </button>
             )}
          </div>
          <button onClick={handleExportCSV} disabled={sales.length === 0} className="px-4 py-2 bg-slate-800 text-white rounded-sm font-semibold text-xs border-none hover:bg-slate-900 transition disabled:opacity-50 w-full sm:w-auto">
            Export CSV
          </button>
          <button onClick={() => setShowModal(true)} className="px-4 py-2 bg-blue-500 text-white rounded-sm font-semibold text-xs border-none hover:bg-blue-600 transition w-full sm:w-auto">
            New Sale
          </button>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-sm overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-3 divide-x divide-slate-100 border-b border-slate-100">
           <div className="p-4">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Filtered Sales Count</span>
              <span className="text-xl font-bold text-slate-900">{sales.length}</span>
           </div>
           <div className="p-4">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Filtered Total Value</span>
              <span className="text-xl font-bold text-emerald-500">{formatGHS(sales.reduce((sum, s) => sum + s.total_amount, 0))}</span>
           </div>
           {user?.role === 'admin' && (
             <div className="p-4">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Filtered Total Profit</span>
                <span className="text-xl font-bold text-blue-500">{formatGHS(sales.reduce((sum, s) => sum + (s.profit || 0), 0))}</span>
             </div>
           )}
        </div>
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-5 py-3 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider">Sale ID</th>
              <th className="px-5 py-3 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider">Date</th>
              <th className="px-5 py-3 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider">Cashier</th>
              <th className="px-5 py-3 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider">Payment</th>
              <th className="px-5 py-3 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider">Status</th>
              <th className="px-5 py-3 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Amount</th>
              {user?.role === 'admin' && <th className="px-5 py-3 text-left text-[11px] font-bold text-emerald-600 uppercase tracking-wider">Transaction Profit</th>}
              <th className="px-5 py-3 text-right text-[11px] font-bold text-slate-400 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-100">
            {sales.map(s => (
              <tr key={s.id} className={s.status === 'refunded' ? 'bg-red-50/50' : ''}>
                <td className="px-5 py-3 whitespace-nowrap text-[13px] font-medium text-slate-900">#SALE-{s.id}</td>
                <td className="px-5 py-3 whitespace-nowrap text-[13px] text-slate-500">{new Date(s.created_at + 'Z').toLocaleString()}</td>
                <td className="px-5 py-3 whitespace-nowrap text-[13px] text-slate-500">{s.user_name}</td>
                <td className="px-5 py-3 whitespace-nowrap text-[13px] text-slate-400 font-medium">{s.payment_method}</td>
                <td className="px-5 py-3 whitespace-nowrap text-[13px]">
                   {s.status === 'refunded' ? (
                     <div>
                       <span className="text-red-500 font-bold uppercase text-[10px]">Refunded</span>
                       <p className="text-[10px] text-slate-400 mt-0.5 max-w-[150px] truncate" title={s.refund_reason}>{s.refund_reason}</p>
                     </div>
                   ) : <span className="text-emerald-500 font-bold uppercase text-[10px]">Completed</span>}
                </td>
                <td className="px-5 py-3 whitespace-nowrap text-[13px] font-bold text-slate-900">{formatGHS(s.total_amount)}</td>
                {user?.role === 'admin' && <td className="px-5 py-3 whitespace-nowrap text-[13px] font-bold text-emerald-600">+{formatGHS(s.profit || 0)}</td>}
                <td className="px-5 py-3 whitespace-nowrap text-right space-x-3">
                   <button onClick={() => handleReprint(s.id)} className="text-[12px] text-blue-500 hover:underline inline-flex items-center" title="Reprint Receipt">
                      <Printer size={14} className="mr-1" />
                   </button>
                   {s.status !== 'refunded' && (
                     <button onClick={() => handleRefund(s.id)} className="text-[12px] text-red-500 hover:underline flex items-center inline-flex">
                        <RotateCcw size={14} className="mr-1" /> Refund
                     </button>
                   )}
                </td>
              </tr>
            ))}
            {sales.length === 0 && !loading && (
              <tr><td colSpan={6} className="px-5 py-8 text-center text-slate-500 text-[13px]">No sales found.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-sm max-w-5xl w-full p-6 border border-slate-200 shadow-2xl overflow-y-auto max-h-[95vh]">
            <div className="flex justify-between items-center border-b border-slate-200 pb-3 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-600 rounded-sm flex items-center justify-center text-white">
                   <ShoppingCart size={18} />
                </div>
                <h2 className="text-[16px] font-black text-slate-900 uppercase tracking-tight">New Sales Session</h2>
              </div>
              <button onClick={() => setShowModal(false)} className="w-8 h-8 flex items-center justify-center text-slate-400 hover:bg-slate-100 rounded-full transition-colors"><X size={18} /></button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
              {/* Product Selection */}
              <div className="md:col-span-5 space-y-6">
                 <div className="space-y-4">
                    <div className="space-y-2">
                       <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest text-left">Scan or Select Product</label>
                       <div className="relative group">
                         <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500" size={16} />
                         <select 
                           autoFocus
                           className="w-full border border-slate-300 rounded-sm pl-10 pr-3 py-3 text-[13px] focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 bg-white transition-all appearance-none"
                           onChange={(e) => {
                             const pId = parseInt(e.target.value);
                             if (!pId) return;
                             const p = products.find(x => x.id === pId);
                             if (p) {
                               addToCart(p.id, p.selling_price);
                               e.target.value = "";
                             }
                           }}
                         >
                           <option value="">Scan Barcode or Search Item...</option>
                           {products.filter(p => p.stock_quantity > 0).map(p => (
                             <option key={p.id} value={p.id}>{p.name} — {p.sku} ({p.stock_quantity} in stock)</option>
                           ))}
                         </select>
                         <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-300">
                           <Plus size={14} />
                         </div>
                       </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
                      <div>
                        <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest text-left mb-1">Customer Selection</label>
                        <select value={selectedCustomer} onChange={e => setSelectedCustomer(e.target.value)} className="w-full border border-slate-300 rounded-sm px-3 py-2 text-[13px] focus:outline-none focus:border-blue-500 bg-slate-50">
                          <option value="">Walk-in Customer</option>
                          {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest text-left mb-1">Payment Channel</label>
                        <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value as any)} className="w-full border border-slate-300 rounded-sm px-3 py-2 text-[13px] focus:outline-none focus:border-blue-500 bg-slate-50">
                          <option value="Cash">Physical Cash</option>
                          <option value="Card">Bank Card</option>
                          <option value="Mobile Money">MoMo / Digital</option>
                        </select>
                      </div>
                    </div>
                 </div>
              </div>

              {/* Cart Ledger */}
              <div className="md:col-span-7 flex flex-col h-full min-h-[400px]">
                 <div className="flex justify-between items-center border-b border-slate-100 pb-2 mb-3">
                    <h3 className="text-[12px] font-black text-slate-900 uppercase tracking-widest">Transaction Ledger</h3>
                    <span className="text-[10px] bg-slate-100 px-2 py-1 rounded-full font-bold text-slate-500">{cart.length} Items</span>
                 </div>
                 <div className="flex-1 overflow-y-auto border border-slate-100 rounded-sm bg-slate-50/30">
                    {cart.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-slate-300 py-12">
                         <ShoppingCart size={40} strokeWidth={1.5} className="mb-2 opacity-20" />
                         <span className="text-[11px] font-bold uppercase tracking-widest">Cart is currently empty</span>
                      </div>
                    ) : (
                      <table className="min-w-full divide-y divide-slate-100">
                        <thead className="bg-white sticky top-0 z-10 shadow-sm">
                          <tr>
                            <th className="px-5 py-3 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Description</th>
                            <th className="px-5 py-3 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Quantity</th>
                            <th className="px-5 py-3 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Subtotal</th>
                            <th className="px-5 py-3"></th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                          {cart.map((item, idx) => {
                            const p = products.find(x => x.id === item.product_id);
                            return (
                              <tr key={idx} className="text-[13px] hover:bg-slate-50 transition-colors">
                                <td className="px-5 py-4">
                                   <div className="flex flex-col">
                                      <span className="font-bold text-slate-900">{p?.name}</span>
                                      <span className="text-[10px] text-slate-400 font-mono tracking-tighter">{p?.sku}</span>
                                      <input 
                                        type="text" 
                                        placeholder="Note..." 
                                        className="w-full mt-1 bg-slate-100 border-none rounded px-2 py-0.5 text-[10px] focus:ring-1 focus:ring-blue-500"
                                        value={item.notes || ''}
                                        onChange={(e) => setCart(prev => prev.map(it => it.product_id === item.product_id ? { ...it, notes: e.target.value } : it))}
                                      />
                                      <div className="flex gap-1 mt-1 flex-wrap">
                                         {['Gift Wrap', 'No Bag', 'Discounted'].map(quickNote => (
                                           <button 
                                             key={quickNote}
                                             onClick={() => setCart(prev => prev.map(it => it.product_id === item.product_id ? { ...it, notes: quickNote } : it))}
                                             className="text-[8px] font-black uppercase bg-slate-50 text-slate-400 px-1.5 py-0.5 rounded border border-slate-100 hover:bg-blue-50 hover:text-blue-500 hover:border-blue-100 transition-all"
                                           >
                                             + {quickNote}
                                           </button>
                                         ))}
                                      </div>
                                   </div>
                                </td>
                                <td className="px-5 py-4">
                                  <div className="flex items-center space-x-1">
                                    <button onClick={() => {
                                      setCart(prev => prev.map(i => i.product_id === item.product_id ? { ...i, quantity: Math.max(0, i.quantity - 1) } : i).filter(i => i.quantity > 0));
                                    }} className="w-7 h-7 flex items-center justify-center border border-slate-200 rounded-md text-slate-400 hover:text-red-600 hover:border-red-200 transition-colors"><Minus size={14} /></button>
                                    <span className="w-8 text-center font-black text-slate-700">{item.quantity}</span>
                                    <button onClick={() => addToCart(item.product_id, item.unit_price)} className="w-7 h-7 flex items-center justify-center border border-slate-200 rounded-md text-slate-400 hover:text-blue-600 hover:border-blue-200 transition-colors"><Plus size={14} /></button>
                                  </div>
                                </td>
                                <td className="px-5 py-4 text-right font-black text-slate-900">{formatGHS(item.quantity * item.unit_price)}</td>
                                <td className="px-5 py-4 text-right">
                                  <button onClick={() => setCart(prev => prev.filter(i => i.product_id !== item.product_id))} className="text-slate-200 hover:text-red-500 transition-colors"><Trash2 size={16} /></button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    )}
                 </div>

                 <div className="mt-6 pt-6 border-t-2 border-slate-100">
                    <div className="flex justify-between items-center mb-6 px-2">
                       <span className="text-[12px] font-black text-slate-500 uppercase tracking-[0.2em]">Final Total Due:</span>
                       <span className="text-[32px] font-black text-blue-600 tracking-tight">{formatGHS(totalCart)}</span>
                    </div>
                    <button 
                      onClick={() => setShowConfirmModal(true)} 
                      disabled={cart.length === 0} 
                      className="w-full py-4 bg-slate-900 text-white rounded-sm font-black text-[14px] uppercase tracking-[0.2em] hover:bg-blue-600 shadow-xl shadow-slate-200 hover:shadow-blue-200 transition-all disabled:opacity-20 disabled:shadow-none translate-y-0 active:translate-y-1"
                    >
                      Process Transaction
                    </button>
                    <p className="text-center text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-4 opacity-50">Validated Transaction Session</p>
                 </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showConfirmModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-[60]">
          <div className="bg-white rounded-sm max-w-sm w-full border border-slate-200 overflow-hidden shadow-2xl relative">
            <div className="p-8 text-center bg-slate-50 border-b border-slate-100">
               <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce hover:animate-none group">
                  <ShoppingCart size={24} className="group-hover:scale-110 transition-transform" />
               </div>
               <h2 className="text-[14px] font-black text-slate-900 uppercase tracking-widest">Verify Transaction</h2>
               <p className="text-[11px] text-slate-400 font-bold uppercase tracking-tight mt-1">Final Review Protocol</p>
            </div>
            
            <div className="p-8 space-y-6 text-center">
              <div className="space-y-3">
                 <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Purchase Summary</div>
                 <div className="flex flex-col gap-1">
                    {cart.slice(0, 3).map(item => {
                       const p = products.find(prod => prod.id === item.product_id);
                       return <div key={item.product_id} className="text-[12px] font-bold text-slate-600 uppercase italic leading-none">{item.quantity}x {p?.name}</div>;
                    })}
                    {cart.length > 3 && <div className="text-[10px] font-bold text-slate-400 italic">...and {cart.length - 3} more items</div>}
                 </div>
              </div>

              <div className="py-4 border-y border-slate-100 space-y-1">
                 <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Expected Settlement</div>
                 <div className="text-3xl font-black text-slate-900">{formatGHS(totalCart)}</div>
                 <div className="text-[11px] font-black text-blue-500 uppercase tracking-[0.1em]">{paymentMethod} Payment Mode</div>
              </div>

              <div className="flex flex-col gap-3 pt-2">
                <button 
                  onClick={handleCheckout} 
                  className="w-full py-4 bg-slate-900 text-white rounded-sm font-black text-[12px] uppercase tracking-[0.2em] hover:bg-emerald-600 transition-all shadow-lg active:scale-95"
                >
                  Checkout
                </button>
                <button 
                  onClick={() => setShowConfirmModal(false)} 
                  className="w-full py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-900 transition-colors"
                >
                  Return to Cart
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {recepiptData && (
        <div className="fixed inset-0 bg-slate-900/40 flex items-center justify-center p-4 z-[70]">
          <div className="bg-white rounded-sm w-80 p-6 border border-slate-200 text-center shadow-xl flex flex-col">
            <style>{`@media print { body * { display: none; } #print-area, #print-area * { display: block; } #print-area { position: absolute; left: 0; top: 0; width: 100%; border: none; box-shadow: none; } }`}</style>
            <div id="print-area" className="text-left font-mono text-[12px] text-slate-800 space-y-3 pb-6 border-b border-dashed border-slate-300">
               <div className="text-center mb-4">
                  <h2 className="font-bold text-[16px] tracking-widest uppercase">Ummis Lane Enterprise</h2>
                  <p className="text-[10px] text-slate-500">Email: Issakrabiat92@gmail.com</p>
                  <p className="text-[10px] text-slate-500">Tel: 0545570191 / 0591369282</p>
                  <p className="text-[10px] text-slate-500">Sale #{recepiptData.saleId}</p>
                  <p className="text-[10px] text-slate-500">{recepiptData.date.toLocaleString()}</p>
                  {recepiptData.customerName && <p className="text-[10px] text-slate-500 border-t border-slate-200 mt-2 pt-1 inline-block">Customer: {recepiptData.customerName}</p>}
               </div>
               <div className="border-b border-dashed border-slate-300 pb-2 mb-2">
                 {recepiptData.items.map((item: any, idx: number) => {
                    const product = products.find(p => p.id === item.product_id);
                    return (
                      <div key={idx} className="flex flex-col mb-1 last:mb-0">
                         <div className="flex justify-between">
                            <span>{product?.name} x{item.quantity}</span>
                            <span>{formatGHS(item.quantity * item.unit_price)}</span>
                         </div>
                         {item.notes && <div className="text-[9px] text-slate-500 italic">Note: {item.notes}</div>}
                      </div>
                    )
                 })}
               </div>
               <div className="flex justify-between font-bold text-[14px]">
                 <span>TOTAL</span>
                 <span>{formatGHS(recepiptData.total)}</span>
               </div>
               <p className="text-center italic text-[10px] pt-4">Thank you for your business!</p>
            </div>
            <div className="flex justify-center space-x-3 mt-6">
              <button onClick={() => setReceiptData(null)} className="px-4 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-300 rounded-sm hover:bg-slate-50">Close</button>
              <button onClick={() => { setReceiptData(null); setShowModal(true); }} className="px-4 py-2 text-xs font-bold text-white bg-blue-600 border-none rounded-sm hover:bg-blue-700">New Sale</button>
              <button onClick={() => window.print()} className="flex items-center px-4 py-2 text-xs font-bold text-white bg-slate-900 border-none rounded-sm hover:bg-slate-800"><Printer size={14} className="mr-2" /> Print Receipt</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
