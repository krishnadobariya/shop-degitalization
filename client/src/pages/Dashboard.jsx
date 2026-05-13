import { useState, useEffect } from 'react';
import api from '../api/axios';
import { 
    TrendingUp, 
    Users, 
    AlertTriangle, 
    DollarSign,
    ArrowUpRight,
    ArrowDownLeft,
    ShoppingBag,
    Package,
    ArrowLeftRight,
    Star
} from 'lucide-react';
import { 
    ResponsiveContainer,
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip
} from 'recharts';

const Dashboard = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await api.get('/dashboard/stats');
                setStats(res.data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    if (loading) return <div className="p-8 text-center text-slate-500">Loading your business overview...</div>;

    const cards = [
        { title: "Today's Sales", value: `₹${stats?.todaySales || 0}`, icon: TrendingUp, color: "text-emerald-600", bg: "bg-emerald-50" },
        { title: "Total Revenue", value: `₹${stats?.totalRevenue || 0}`, icon: DollarSign, color: "text-blue-600", bg: "bg-blue-50" },
        { title: "Stock Value", value: `₹${stats?.totalStockValue || 0}`, icon: Package, color: "text-purple-600", bg: "bg-purple-50" },
        { title: "Total Customers", value: stats?.totalCustomers || 0, icon: Users, color: "text-orange-600", bg: "bg-orange-50" },
    ];

    return (
        <div className="space-y-8 pb-12">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">Business Overview</h1>
                    <p className="text-slate-500 font-medium">Real-time performance of your shop.</p>
                </div>
                <div className="text-sm font-bold text-slate-500 bg-white px-5 py-2.5 rounded-2xl border border-slate-200 shadow-sm">
                    {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {cards.map((card, i) => (
                    <div key={i} className="card group hover:scale-[1.02] transition-all duration-300 relative overflow-hidden">
                        <div className="flex justify-between items-start relative z-10">
                            <div className={`${card.bg} ${card.color} p-4 rounded-2xl transition-transform group-hover:rotate-6`}>
                                <card.icon className="w-6 h-6" />
                            </div>
                        </div>
                        <div className="mt-5 relative z-10">
                            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">{card.title}</p>
                            <h3 className="text-3xl font-black text-slate-900 mt-1">{card.value}</h3>
                        </div>
                        {/* Subtle background decoration */}
                        <div className={`absolute -right-4 -bottom-4 w-24 h-24 rounded-full ${card.bg} opacity-20 blur-2xl group-hover:opacity-40 transition-opacity`}></div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Revenue Chart */}
                <div className="lg:col-span-2 card">
                    <div className="flex justify-between items-center mb-8">
                        <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-primary-600" /> Revenue Trends
                        </h3>
                    </div>
                    <div className="h-[350px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={stats?.weeklySales || []}>
                                <defs>
                                    <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.2}/>
                                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 600}} dy={15} />
                                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 600}} />
                                <Tooltip 
                                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', padding: '12px' }}
                                    itemStyle={{ fontWeight: 800, color: '#4c1d95' }}
                                />
                                <Area type="monotone" dataKey="total" stroke="#8b5cf6" strokeWidth={4} fillOpacity={1} fill="url(#colorTotal)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Top Products */}
                <div className="card">
                    <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                        <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" /> Top Products
                    </h3>
                    <div className="space-y-5">
                        {stats?.topProducts?.map((p, i) => (
                            <div key={p._id} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:border-primary-100 transition-colors">
                                <div className="flex items-center gap-4">
                                    <span className="text-xl font-black text-slate-200">0{i+1}</span>
                                    <div>
                                        <p className="text-sm font-bold text-slate-900 truncate max-w-[120px]">{p.name}</p>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{p.totalQty} sold</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-black text-primary-600">₹{p.revenue}</p>
                                </div>
                            </div>
                        ))}
                        {(!stats?.topProducts || stats.topProducts.length === 0) && (
                            <div className="text-center py-12 text-slate-400 italic font-medium">No sales data yet</div>
                        )}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Recent Ledger Transactions */}
                <div className="card">
                    <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                        <ArrowLeftRight className="w-5 h-5 text-primary-600" /> Recent Transactions
                    </h3>
                    <div className="space-y-4">
                        {stats?.recentTransactions?.map((t) => (
                            <div key={t._id} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100">
                                <div className="flex items-center gap-4">
                                    <div className={`p-2 rounded-xl ${t.type === 'credit' ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'}`}>
                                        {t.type === 'credit' ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownLeft className="w-4 h-4" />}
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-slate-900">{t.note}</p>
                                        <p className="text-[10px] font-bold text-slate-400">{new Date(t.createdAt).toLocaleDateString()}</p>
                                    </div>
                                </div>
                                <div className={`text-sm font-black ${t.type === 'credit' ? 'text-red-600' : 'text-emerald-600'}`}>
                                    {t.type === 'credit' ? '+' : '-'} ₹{t.amount}
                                </div>
                            </div>
                        ))}
                        {(!stats?.recentTransactions || stats.recentTransactions.length === 0) && (
                            <div className="text-center py-8 text-slate-400 italic">No recent transactions</div>
                        )}
                    </div>
                </div>

                {/* Low Stock Alerts */}
                <div className="card">
                    <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-orange-500" /> Stock Alerts
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {stats?.lowStockProducts?.slice(0, 4).map((product) => (
                            <div key={product._id} className="p-4 rounded-2xl bg-orange-50 border border-orange-100 flex items-center gap-4">
                                <div className="bg-white p-2 rounded-xl shadow-sm">
                                    <ShoppingBag className="w-5 h-5 text-orange-600" />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-slate-900 truncate max-w-[120px]">{product.name}</p>
                                    <p className="text-xs font-black text-red-600">{product.stock} units left</p>
                                </div>
                            </div>
                        ))}
                        {(!stats?.lowStockProducts || stats.lowStockProducts.length === 0) && (
                            <div className="col-span-full text-center py-8 text-emerald-600 font-bold bg-emerald-50 rounded-2xl">
                                ✅ All products well stocked!
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
