import { useState, useEffect } from 'react';
import api from '../api/axios';
import { 
    Search, 
    Calendar, 
    Printer, 
    Eye, 
    User, 
    ChevronRight,
    ArrowLeft,
    Download
} from 'lucide-react';

const Sales = () => {
    const [bills, setBills] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedBill, setSelectedBill] = useState(null);

    useEffect(() => {
        fetchBills();
    }, []);

    const fetchBills = async () => {
        try {
            const res = await api.get('/bills');
            setBills(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const filteredBills = bills.filter(bill => 
        bill._id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        bill.customer?.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handlePrint = () => {
        window.print();
    };

    if (loading) return <div className="p-8 text-center text-slate-500">Loading sales history...</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center no-print">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Sales History</h1>
                    <p className="text-slate-500">Manage and re-print all your past shop invoices.</p>
                </div>
            </div>

            <div className="card !p-0 overflow-hidden no-print">
                <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row gap-4 bg-slate-50/50">
                    <div className="relative flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 z-10" />
                        <input 
                            type="text" 
                            placeholder="Search by Bill ID or Customer name..." 
                            className="input input-with-icon"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50 text-slate-500 text-sm uppercase tracking-wider font-bold">
                                <th className="px-6 py-4">Bill ID</th>
                                <th className="px-6 py-4">Date</th>
                                <th className="px-6 py-4">Customer</th>
                                <th className="px-6 py-4">Amount</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredBills.map((bill) => (
                                <tr key={bill._id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-6 py-4 font-mono text-xs font-bold text-primary-600">
                                        #{bill._id.slice(-8).toUpperCase()}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-slate-600">
                                        <div className="flex items-center gap-2">
                                            <Calendar className="w-3.5 h-3.5" />
                                            {new Date(bill.createdAt).toLocaleDateString()}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <User className="w-4 h-4 text-slate-400" />
                                            <span className="text-sm font-medium text-slate-900">
                                                {bill.customer?.name || 'Walking Customer'}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 font-black text-slate-900">₹{bill.totalAmount}</td>
                                    <td className="px-6 py-4">
                                        <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-full ${bill.paymentStatus === 'paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-orange-100 text-orange-700'}`}>
                                            {bill.paymentStatus}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button 
                                            onClick={() => setSelectedBill(bill)}
                                            className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                                        >
                                            <Eye className="w-5 h-5" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Bill Detail Modal */}
            {selectedBill && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 no-print">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="p-4 border-b border-slate-100 flex justify-between items-center">
                            <button 
                                onClick={() => setSelectedBill(null)}
                                className="flex items-center gap-2 text-slate-500 hover:text-slate-900 font-bold text-sm"
                            >
                                <ArrowLeft className="w-4 h-4" /> Back to List
                            </button>
                            <div className="flex gap-2">
                                <button onClick={handlePrint} className="btn-primary !py-2 !text-sm flex items-center gap-2">
                                    <Printer className="w-4 h-4" /> Print
                                </button>
                            </div>
                        </div>
                        
                        <div className="p-8 max-h-[70vh] overflow-y-auto">
                            <div className="flex justify-between items-start mb-8">
                                <div>
                                    <h2 className="text-2xl font-black text-slate-900">INVOICE</h2>
                                    <p className="text-slate-500 font-mono text-sm">#{selectedBill._id.toUpperCase()}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-bold text-slate-900">{new Date(selectedBill.createdAt).toLocaleDateString()}</p>
                                    <p className="text-xs text-slate-500">{new Date(selectedBill.createdAt).toLocaleTimeString()}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-8 mb-8">
                                <div className="p-4 bg-slate-50 rounded-xl">
                                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Billed To</h4>
                                    <p className="font-bold text-slate-900">{selectedBill.customer?.name || 'Walking Customer'}</p>
                                    <p className="text-sm text-slate-500">{selectedBill.customer?.phone || '-'}</p>
                                </div>
                                <div className="p-4 bg-slate-50 rounded-xl text-right">
                                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Payment Status</h4>
                                    <span className={`text-xs font-black uppercase px-3 py-1 rounded-full ${selectedBill.paymentStatus === 'paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-orange-100 text-orange-700'}`}>
                                        {selectedBill.paymentStatus}
                                    </span>
                                </div>
                            </div>

                            <table className="w-full text-sm mb-8">
                                <thead className="border-b-2 border-slate-100 text-slate-400 uppercase text-[10px] font-black">
                                    <tr>
                                        <th className="text-left py-3">Item Description</th>
                                        <th className="text-center py-3">Qty</th>
                                        <th className="text-right py-3">Price</th>
                                        <th className="text-right py-3">Total</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {selectedBill.items.map((item, i) => (
                                        <tr key={i}>
                                            <td className="py-4 font-semibold text-slate-900">{item.name}</td>
                                            <td className="py-4 text-center text-slate-600">{item.quantity}</td>
                                            <td className="py-4 text-right text-slate-600">₹{item.price}</td>
                                            <td className="py-4 text-right font-bold text-slate-900">₹{item.subtotal}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            <div className="flex justify-end pt-6 border-t-2 border-slate-100">
                                <div className="text-right">
                                    <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Grand Total</p>
                                    <h2 className="text-4xl font-black text-primary-600">₹{selectedBill.totalAmount}</h2>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Hidden Print Content */}
            <div className="print-only">
                {selectedBill && (
                     <div className="p-10">
                        <h1 className="text-3xl font-black mb-2">INVOICE RECEIPT</h1>
                        <p className="text-slate-500 mb-8 font-mono">Bill ID: {selectedBill._id}</p>
                        <hr className="mb-8" />
                        <div className="grid grid-cols-2 gap-10 mb-10">
                            <div>
                                <h4 className="font-bold uppercase text-xs text-slate-400 mb-2">Customer</h4>
                                <p className="text-lg font-bold">{selectedBill.customer?.name || 'Walking Customer'}</p>
                                <p>{selectedBill.customer?.phone || '-'}</p>
                            </div>
                            <div className="text-right">
                                <h4 className="font-bold uppercase text-xs text-slate-400 mb-2">Date & Status</h4>
                                <p className="text-lg font-bold">{new Date(selectedBill.createdAt).toLocaleString()}</p>
                                <p className="uppercase font-bold text-primary-600">{selectedBill.paymentStatus}</p>
                            </div>
                        </div>
                        <table className="w-full mb-10">
                            <thead className="border-b-2 border-black">
                                <tr>
                                    <th className="text-left py-2">Item</th>
                                    <th className="text-right py-2">Qty</th>
                                    <th className="text-right py-2">Price</th>
                                    <th className="text-right py-2">Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {selectedBill.items.map((item, i) => (
                                    <tr key={i} className="border-b border-slate-100">
                                        <td className="py-4 font-bold">{item.name}</td>
                                        <td className="text-right py-4">{item.quantity}</td>
                                        <td className="text-right py-4">₹{item.price}</td>
                                        <td className="text-right py-4 font-bold">₹{item.subtotal}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <div className="text-right">
                            <h2 className="text-4xl font-black">Total: ₹{selectedBill.totalAmount}</h2>
                        </div>
                     </div>
                )}
            </div>
        </div>
    );
};

export default Sales;
