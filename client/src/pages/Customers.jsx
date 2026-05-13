import { useState, useEffect } from 'react';
import api from '../api/axios';
import { 
    Plus, 
    Search, 
    User, 
    Phone, 
    IndianRupee, 
    History, 
    X, 
    ArrowDownLeft, 
    ArrowUpRight,
    CreditCard
} from 'lucide-react';

const Customers = () => {
    const [customers, setCustomers] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [showHistory, setShowHistory] = useState(false);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [transactions, setTransactions] = useState([]);
    const [paymentAmount, setPaymentAmount] = useState('');
    const [paymentNote, setPaymentNote] = useState('');

    const [newCustomer, setNewCustomer] = useState({ name: '', phone: '' });

    useEffect(() => {
        fetchCustomers();
    }, []);

    const fetchCustomers = async () => {
        try {
            const res = await api.get('/customers');
            setCustomers(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const fetchTransactions = async (customerId) => {
        try {
            const res = await api.get(`/customers/${customerId}/transactions`);
            setTransactions(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const handleAddCustomer = async (e) => {
        e.preventDefault();
        try {
            await api.post('/customers', newCustomer);
            setShowModal(false);
            setNewCustomer({ name: '', phone: '' });
            fetchCustomers();
        } catch (err) {
            console.error(err);
        }
    };

    const handleAddPayment = async (e) => {
        e.preventDefault();
        try {
            await api.post(`/customers/${selectedCustomer._id}/payments`, {
                amount: Number(paymentAmount),
                note: paymentNote
            });
            setShowPaymentModal(false);
            setPaymentAmount('');
            setPaymentNote('');
            fetchCustomers();
            alert('Payment recorded successfully!');
        } catch (err) {
            console.error(err);
            alert('Error recording payment');
        }
    };

    const openHistory = (customer) => {
        setSelectedCustomer(customer);
        fetchTransactions(customer._id);
        setShowHistory(true);
    };

    const openPayment = (customer) => {
        setSelectedCustomer(customer);
        setPaymentAmount(customer.totalDue);
        setShowPaymentModal(true);
    };

    const filteredCustomers = customers.filter(c => 
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.phone.includes(searchTerm)
    );

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Customer Management</h1>
                    <p className="text-slate-500">Track customer details and Udhaar (credit) history.</p>
                </div>
                <button 
                    onClick={() => setShowModal(true)}
                    className="btn-primary flex items-center gap-2"
                >
                    <Plus className="w-5 h-5" /> Add Customer
                </button>
            </div>

            <div className="card !p-0 overflow-hidden">
                <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                    <div className="relative max-w-md">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 z-10" />
                        <input 
                            type="text" 
                            placeholder="Search by name or phone..." 
                            className="input input-with-icon"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
                    {filteredCustomers.map((customer) => (
                        <div key={customer._id} className="bg-white border border-slate-200 rounded-2xl p-5 hover:border-primary-200 transition-all">
                            <div className="flex justify-between items-start mb-4">
                                <div className="bg-primary-50 p-3 rounded-xl text-primary-600">
                                    <User className="w-6 h-6" />
                                </div>
                                <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-md ${customer.totalDue > 0 ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}>
                                    {customer.totalDue > 0 ? 'Pending Dues' : 'No Dues'}
                                </span>
                            </div>
                            <h3 className="text-lg font-bold text-slate-900">{customer.name}</h3>
                            <div className="flex items-center gap-2 text-slate-500 text-sm mt-1">
                                <Phone className="w-4 h-4" />
                                {customer.phone}
                            </div>
                            
                            <div className="mt-6 pt-4 border-t border-slate-100 flex justify-between items-center">
                                <div>
                                    <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest">Total Due</p>
                                    <p className={`text-xl font-black ${customer.totalDue > 0 ? 'text-red-600' : 'text-slate-900'}`}>
                                        ₹{customer.totalDue}
                                    </p>
                                </div>
                                <div className="flex gap-2">
                                    <button 
                                        onClick={() => openHistory(customer)}
                                        className="p-2 bg-slate-50 text-slate-600 hover:bg-primary-50 hover:text-primary-600 rounded-lg transition-colors"
                                        title="View History"
                                    >
                                        <History className="w-5 h-5" />
                                    </button>
                                    {customer.totalDue > 0 && (
                                        <button 
                                            onClick={() => openPayment(customer)}
                                            className="p-2 bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white rounded-lg transition-colors"
                                            title="Record Payment"
                                        >
                                            <IndianRupee className="w-5 h-5" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Add Customer Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-primary-600">
                            <h2 className="text-xl font-bold text-white">Add New Customer</h2>
                            <button onClick={() => setShowModal(false)} className="text-white hover:rotate-90 transition-transform"><X /></button>
                        </div>
                        <form onSubmit={handleAddCustomer} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Customer Name</label>
                                <input 
                                    type="text" required className="input" 
                                    value={newCustomer.name}
                                    onChange={(e) => setNewCustomer({...newCustomer, name: e.target.value})}
                                    placeholder="e.g. Rahul Sharma"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Phone Number</label>
                                <input 
                                    type="text" required className="input"
                                    value={newCustomer.phone}
                                    onChange={(e) => setNewCustomer({...newCustomer, phone: e.target.value})}
                                    placeholder="10-digit mobile number"
                                />
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button type="button" onClick={() => setShowModal(false)} className="flex-1 btn-secondary">Cancel</button>
                                <button type="submit" className="flex-1 btn-primary shadow-primary-200 shadow-lg">Save Customer</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Payment Modal */}
            {showPaymentModal && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-emerald-600">
                            <h2 className="text-xl font-bold text-white">Record Payment</h2>
                            <button onClick={() => setShowPaymentModal(false)} className="text-white"><X /></button>
                        </div>
                        <form onSubmit={handleAddPayment} className="p-6 space-y-4">
                            <div className="p-4 bg-emerald-50 rounded-xl mb-4">
                                <p className="text-sm text-emerald-800 font-medium text-center">Customer: <span className="font-bold">{selectedCustomer?.name}</span></p>
                                <p className="text-2xl font-black text-emerald-600 text-center">Due: ₹{selectedCustomer?.totalDue}</p>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Payment Amount (₹)</label>
                                <input 
                                    type="number" required className="input" 
                                    value={paymentAmount}
                                    onChange={(e) => setPaymentAmount(e.target.value)}
                                    max={selectedCustomer?.totalDue}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Notes (Optional)</label>
                                <input 
                                    type="text" className="input"
                                    value={paymentNote}
                                    onChange={(e) => setPaymentNote(e.target.value)}
                                    placeholder="e.g. Paid via PhonePe"
                                />
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button type="button" onClick={() => setShowPaymentModal(false)} className="flex-1 btn-secondary">Cancel</button>
                                <button type="submit" className="flex-1 bg-emerald-600 text-white font-bold py-3 rounded-xl hover:bg-emerald-700 shadow-lg shadow-emerald-100">Confirm Payment</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* History Modal */}
            {showHistory && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in slide-in-from-bottom duration-300">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                            <div>
                                <h2 className="text-xl font-black text-slate-900">{selectedCustomer?.name}'s Ledger</h2>
                                <p className="text-sm text-slate-500">Transaction History</p>
                            </div>
                            <button onClick={() => setShowHistory(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X /></button>
                        </div>
                        <div className="max-h-[60vh] overflow-y-auto p-6 space-y-4">
                            {transactions.map((t) => (
                                <div key={t._id} className="flex items-center justify-between p-4 rounded-2xl border border-slate-100 bg-slate-50/50">
                                    <div className="flex items-center gap-4">
                                        <div className={`p-2 rounded-xl ${t.type === 'credit' ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}>
                                            {t.type === 'credit' ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownLeft className="w-5 h-5" />}
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-900">{t.note}</p>
                                            <p className="text-xs text-slate-500">{new Date(t.createdAt).toLocaleString()}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className={`text-lg font-black ${t.type === 'credit' ? 'text-red-600' : 'text-emerald-600'}`}>
                                            {t.type === 'credit' ? '+' : '-'} ₹{t.amount}
                                        </p>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t.type}</p>
                                    </div>
                                </div>
                            ))}
                            {transactions.length === 0 && (
                                <div className="text-center py-12 text-slate-400 italic">No transaction history found.</div>
                            )}
                        </div>
                        <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
                             <div>
                                <p className="text-xs font-bold text-slate-500">Final Balance</p>
                                <p className="text-2xl font-black text-slate-900">₹{selectedCustomer?.totalDue}</p>
                             </div>
                             <button onClick={() => setShowHistory(false)} className="btn-secondary">Close Ledger</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Customers;
