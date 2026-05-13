import { useState, useEffect, useRef } from 'react';
import api from '../api/axios';
import { 
    ShoppingCart,
    ShoppingBag,
    Search, 
    Trash2, 
    Plus, 
    Minus, 
    Printer, 
    User, 
    CreditCard, 
    Wallet,
    CheckCircle2,
    Store,
    Mic,
    MicOff,
    Loader2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Billing = () => {
    const { user } = useAuth();
    const [products, setProducts] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [cart, setCart] = useState([]);
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [paymentStatus, setPaymentStatus] = useState('paid');
    const [lastBill, setLastBill] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    
    // Voice State
    const [isListening, setIsListening] = useState(false);
    const [voiceFeedback, setVoiceFeedback] = useState('');
    const recognitionRef = useRef(null);
    const productsRef = useRef([]); // Use ref to avoid stale closure

    useEffect(() => {
        productsRef.current = products;
    }, [products]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [prodRes, custRes] = await Promise.all([
                    api.get('/products'),
                    api.get('/customers')
                ]);
                setProducts(prodRes.data);
                setCustomers(custRes.data);
            } catch (err) {
                console.error(err);
            }
        };
        fetchData();

        // Initialize Speech Recognition
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRecognition) {
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = false;
            recognitionRef.current.interimResults = false;
            recognitionRef.current.lang = 'en-IN';

            recognitionRef.current.onresult = (event) => {
                const transcript = event.results[0][0].transcript.toLowerCase();
                setVoiceFeedback(`Heard: "${transcript}"`);
                processVoiceCommand(transcript);
                setIsListening(false);
            };

            recognitionRef.current.onerror = (event) => {
                console.error('Speech recognition error:', event.error);
                setIsListening(false);
                setVoiceFeedback('Error hearing you. Try again.');
            };

            recognitionRef.current.onend = () => {
                setIsListening(false);
            };
        }
    }, []);

    const processVoiceCommand = (command) => {
        const transcript = command.toLowerCase().replace(/[.,!?;:]/g, "").trim();
        console.log('Voice Input:', transcript);
        
        const currentProducts = productsRef.current; // Get latest products from ref
        if (currentProducts.length === 0) {
            console.warn('Products not loaded yet');
            return;
        }

        const numMatch = transcript.match(/(\d+(\.\d+)?)/);
        let quantity = numMatch ? parseFloat(numMatch[0]) : 1;
        
        if (transcript.includes('half') || transcript.includes('aadha')) quantity = 0.5;
        if (transcript.includes('quarter') || transcript.includes('pav')) quantity = 0.25;

        let productNameInput = transcript
            .replace(/^add\s+/, '') 
            .replace(/(\d+(\.\d+)?)/, '')
            .replace(/\b(half|quarter|aadha|pav|kilo|kg|kgs|gram|grams|gm|g|ltr|litre|litres|ml|piece|pieces|pc|pcs|packet|packets|pkt|pkts|box|boxes|unit|units)\b/g, '')
            .replace(/\s+/g, ' ')
            .trim();

        if (!productNameInput) return;

        // Smart Matching Algorithm
        const match = currentProducts.find(p => {
            const dbName = p.name.toLowerCase();
            const inputWords = productNameInput.split(' ');
            
            // Check if every word in input is present in DB name (or vice versa)
            const inputMatchesDB = inputWords.every(word => dbName.includes(word));
            const dbMatchesInput = dbName.split(' ').some(word => productNameInput.includes(word));
            
            return dbName === productNameInput || inputMatchesDB || dbMatchesInput;
        });

        if (match) {
            // Use word boundaries to check for units to avoid matching 'g' in 'sugar'
            const hasGram = /\b(gram|grams|gm|g)\b/.test(transcript);
            const hasML = /\b(ml|milli)\b/.test(transcript);

            if (match.unit === 'kg' && hasGram && quantity >= 1) {
                quantity = quantity / 1000;
            }
            if (match.unit === 'ltr' && hasML && quantity >= 1) {
                quantity = quantity / 1000;
            }

            addToCart(match, quantity);
            setVoiceFeedback(`Added ${quantity}${match.unit} ${match.name}`);
        } else {
            console.log('Not found:', productNameInput, 'in:', currentProducts.map(p => p.name));
            setVoiceFeedback(`Not found: "${productNameInput}"`);
        }

        setTimeout(() => setVoiceFeedback(''), 4000);
    };

    const toggleListening = () => {
        if (isListening) {
            recognitionRef.current.stop();
        } else {
            if (!recognitionRef.current) return alert('Speech recognition not supported in this browser');
            setVoiceFeedback('Listening...');
            recognitionRef.current.start();
            setIsListening(true);
        }
    };

    const addToCart = (product, qtyToAdd = 1) => {
        setCart(prevCart => {
            const existing = prevCart.find(item => item.productId === product._id);
            if (existing) {
                if (existing.quantity + qtyToAdd > product.stock) {
                    alert('Not enough stock');
                    return prevCart;
                }
                return prevCart.map(item => 
                    item.productId === product._id 
                    ? { ...item, quantity: item.quantity + qtyToAdd, subtotal: Number(((item.quantity + qtyToAdd) * item.price).toFixed(2)) } 
                    : item
                );
            } else {
                if (product.stock < qtyToAdd) {
                    alert('Not enough stock');
                    return prevCart;
                }
                return [...prevCart, { 
                    productId: product._id, 
                    name: product.name, 
                    price: product.price, 
                    quantity: qtyToAdd, 
                    unit: product.unit || 'pcs',
                    subtotal: Number((product.price * qtyToAdd).toFixed(2))
                }];
            }
        });
    };

    const updateQuantity = (id, delta) => {
        setCart(prevCart => prevCart.map(item => {
            if (item.productId === id) {
                const newQty = Math.max(0.001, item.quantity + delta);
                const product = products.find(p => p._id === id);
                if (delta > 0 && newQty > product.stock) return item;
                return { ...item, quantity: newQty, subtotal: Number((newQty * item.price).toFixed(2)) };
            }
            return item;
        }));
    };

    const handleManualUpdate = (id, field, value) => {
        setCart(prevCart => prevCart.map(item => {
            if (item.productId === id) {
                let newQty = item.quantity;
                let newSubtotal = item.subtotal;

                if (field === 'weight') {
                    newQty = Number(value);
                    newSubtotal = Number((newQty * item.price).toFixed(2));
                } else if (field === 'price') {
                    newSubtotal = Number(value);
                    newQty = Number((newSubtotal / item.price).toFixed(3));
                }

                return { ...item, quantity: newQty, subtotal: newSubtotal };
            }
            return item;
        }));
    };

    const removeFromCart = (id) => {
        setCart(cart.filter(item => item.productId !== id));
    };

    const totalAmount = cart.reduce((acc, item) => acc + item.subtotal, 0);

    const handleSubmit = async () => {
        if (cart.length === 0) return alert('Cart is empty');
        setIsProcessing(true);
        try {
            const billData = {
                customer: selectedCustomer ? {
                    id: selectedCustomer._id,
                    name: selectedCustomer.name,
                    phone: selectedCustomer.phone
                } : null,
                items: cart,
                totalAmount,
                paymentStatus
            };
            const res = await api.post('/bills', billData);
            setLastBill(res.data);
            setCart([]);
            setSelectedCustomer(null);
            setPaymentStatus('paid');
            alert('Bill generated successfully!');
        } catch (err) {
            console.error(err);
            alert('Error generating bill');
        } finally {
            setIsProcessing(false);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    const filteredProducts = products.filter(p => 
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) && p.stock > 0
    );

    return (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 h-[calc(100vh-120px)]">
            {/* POS Left: Product Selection */}
            <div className="xl:col-span-8 flex flex-col no-print">
                <div className="mb-6 flex gap-4 items-center">
                    <div className="relative flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 z-10" />
                        <input 
                            type="text" 
                            placeholder="Search products..." 
                            className="input input-with-icon"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    
                    {/* Voice Assistant Button */}
                    <div className="relative">
                        <button 
                            onClick={toggleListening}
                            className={`p-3.5 rounded-xl transition-all duration-300 flex items-center gap-2 font-bold shadow-lg ${isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-white text-primary-600 border border-slate-200 hover:border-primary-300'}`}
                        >
                            {isListening ? <Loader2 className="w-5 h-5 animate-spin" /> : <Mic className="w-5 h-5" />}
                            <span className="hidden md:inline">{isListening ? 'Listening...' : 'Voice Add'}</span>
                        </button>
                        {voiceFeedback && (
                            <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] px-3 py-1.5 rounded-full whitespace-nowrap z-50 shadow-xl animate-in slide-in-from-top-2">
                                {voiceFeedback}
                            </div>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 overflow-y-auto pr-2">
                    {filteredProducts.map(product => (
                        <button 
                            key={product._id}
                            onClick={() => addToCart(product)}
                            className="card !p-4 hover:border-primary-500 hover:shadow-md transition-all text-left flex flex-col justify-between group"
                        >
                            <div>
                                <h4 className="font-bold text-slate-900 group-hover:text-primary-600 truncate">{product.name}</h4>
                                <p className="text-xs text-slate-500">{product.category}</p>
                            </div>
                            <div className="mt-4 flex justify-between items-end">
                                <span className="text-lg font-black text-slate-900">₹{product.price}</span>
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${product.stock < 10 ? 'bg-orange-50 text-orange-600' : 'bg-slate-100 text-slate-600'}`}>
                                    Qty: {product.stock}
                                </span>
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {/* POS Right: Cart & Summary */}
            <div className="xl:col-span-4 no-print">
                <div className="card h-full flex flex-col !p-0 overflow-hidden border-2 border-slate-100">
                    <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                        <h3 className="font-bold text-slate-900 flex items-center gap-2">
                            <ShoppingCart className="w-5 h-5 text-primary-600" /> Current Bill
                        </h3>
                        <span className="bg-primary-600 text-white text-xs font-bold px-2 py-1 rounded-full">{cart.length} Items</span>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        {cart.map(item => (
                            <div key={item.productId} className="p-3 bg-white border border-slate-100 rounded-xl space-y-3">
                                <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                        <h5 className="text-sm font-bold text-slate-900">{item.name}</h5>
                                        <p className="text-xs text-slate-500">₹{item.price} per {item.unit}</p>
                                    </div>
                                    <button onClick={() => removeFromCart(item.productId)} className="text-red-400 hover:text-red-600 p-1"><Trash2 className="w-4 h-4" /></button>
                                </div>
                                
                                <div className="flex gap-3 items-center">
                                    {/* Weight/Qty Input */}
                                    <div className="flex-1">
                                        <label className="text-[10px] font-black uppercase text-slate-400 mb-1 block">Quantity ({item.unit})</label>
                                        <div className="flex items-center bg-slate-100 rounded-lg p-1">
                                            <button onClick={() => updateQuantity(item.productId, item.unit === 'pcs' ? -1 : -0.1)} className="p-1 hover:bg-white rounded transition-colors"><Minus className="w-3 h-3" /></button>
                                            <input 
                                                type="number" 
                                                className="w-full bg-transparent text-center text-xs font-bold focus:outline-none" 
                                                value={item.quantity}
                                                onChange={(e) => handleManualUpdate(item.productId, 'weight', e.target.value)}
                                                step={item.unit === 'pcs' ? "1" : "0.01"}
                                            />
                                            <button onClick={() => updateQuantity(item.productId, item.unit === 'pcs' ? 1 : 0.1)} className="p-1 hover:bg-white rounded transition-colors"><Plus className="w-3 h-3" /></button>
                                        </div>
                                    </div>

                                    {/* Price/Subtotal Input */}
                                    <div className="flex-1">
                                        <label className="text-[10px] font-black uppercase text-slate-400 mb-1 block">Price (₹)</label>
                                        <input 
                                            type="number" 
                                            className="w-full bg-slate-100 rounded-lg p-2 text-center text-xs font-bold focus:ring-2 focus:ring-primary-500 outline-none" 
                                            value={item.subtotal}
                                            onChange={(e) => handleManualUpdate(item.productId, 'price', e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                        {cart.length === 0 && (
                            <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-2 opacity-50">
                                <ShoppingBag className="w-12 h-12" />
                                <p className="text-sm font-medium">Cart is empty</p>
                            </div>
                        )}
                    </div>

                    <div className="p-4 border-t border-slate-100 bg-slate-50 space-y-4">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Customer Information</label>
                            <select 
                                className="input text-sm"
                                onChange={(e) => setSelectedCustomer(customers.find(c => c._id === e.target.value))}
                                value={selectedCustomer?._id || ''}
                            >
                                <option value="">Walking Customer</option>
                                {customers.map(c => <option key={c._id} value={c._id}>{c.name} ({c.phone})</option>)}
                            </select>
                        </div>

                        <div className="flex gap-2">
                            <button 
                                onClick={() => setPaymentStatus('paid')}
                                className={`flex-1 py-2 rounded-xl text-sm font-bold border-2 transition-all flex items-center justify-center gap-2 ${paymentStatus === 'paid' ? 'bg-emerald-600 border-emerald-600 text-white shadow-md' : 'bg-white border-slate-200 text-slate-500 hover:border-emerald-200'}`}
                            >
                                <Wallet className="w-4 h-4" /> Paid
                            </button>
                            <button 
                                onClick={() => setPaymentStatus('due')}
                                className={`flex-1 py-2 rounded-xl text-sm font-bold border-2 transition-all flex items-center justify-center gap-2 ${paymentStatus === 'due' ? 'bg-orange-600 border-orange-600 text-white shadow-md' : 'bg-white border-slate-200 text-slate-500 hover:border-orange-200'}`}
                            >
                                <CreditCard className="w-4 h-4" /> Due
                            </button>
                        </div>

                        <div className="pt-2 border-t border-slate-200">
                            <div className="flex justify-between items-center mb-4">
                                <span className="text-slate-500 font-medium">Total Amount</span>
                                <span className="text-2xl font-black text-slate-900">₹{totalAmount}</span>
                            </div>
                            <button 
                                onClick={handleSubmit}
                                disabled={cart.length === 0 || isProcessing}
                                className={`w-full py-4 rounded-2xl font-bold text-lg shadow-lg flex items-center justify-center gap-2 transition-all ${cart.length === 0 ? 'bg-slate-300 text-slate-100 cursor-not-allowed' : 'bg-primary-600 text-white hover:bg-primary-700 active:scale-95'}`}
                            >
                                {isProcessing ? 'Processing...' : (
                                    <>
                                        <CheckCircle2 className="w-6 h-6" /> Complete Order
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Print Modal / Invoice View */}
            {lastBill && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 no-print">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
                        <div className="p-4 border-b border-slate-100 flex justify-between items-center">
                            <h2 className="font-bold text-slate-900">Invoice Generated</h2>
                            <button onClick={() => setLastBill(null)} className="text-slate-400 hover:text-slate-600">&times;</button>
                        </div>
                        <div className="p-8" id="printable-area">
                            <div className="flex justify-between items-start mb-8">
                                <div>
                                    <div className="flex items-center gap-2 text-primary-600 mb-1">
                                        <Store className="w-6 h-6" />
                                        <h1 className="text-2xl font-black uppercase tracking-tighter">{user?.shopName}</h1>
                                    </div>
                                    <p className="text-sm text-slate-500 italic">Official Sales Receipt</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-bold text-slate-900">Invoice #{lastBill._id.slice(-6).toUpperCase()}</p>
                                    <p className="text-xs text-slate-500">{new Date(lastBill.createdAt).toLocaleDateString()}</p>
                                </div>
                            </div>

                            <div className="mb-8 p-4 bg-slate-50 rounded-xl border border-slate-100">
                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Billed To</h4>
                                {lastBill.customer ? (
                                    <>
                                        <p className="text-sm font-bold text-slate-900">{lastBill.customer.name}</p>
                                        <p className="text-sm text-slate-500">{lastBill.customer.phone}</p>
                                    </>
                                ) : (
                                    <p className="text-sm font-bold text-slate-900">Walking Customer</p>
                                )}
                            </div>

                            <table className="w-full text-sm mb-8">
                                <thead className="border-b-2 border-slate-100 text-slate-400 uppercase text-[10px] font-black">
                                    <tr>
                                        <th className="text-left py-2">Item</th>
                                        <th className="text-center py-2">Qty</th>
                                        <th className="text-right py-2">Price</th>
                                        <th className="text-right py-2">Total</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {lastBill.items.map((item, i) => (
                                        <tr key={i}>
                                            <td className="py-3 font-semibold text-slate-900">{item.name}</td>
                                            <td className="py-3 text-center text-slate-500">{item.quantity}</td>
                                            <td className="py-3 text-right text-slate-500">₹{item.price}</td>
                                            <td className="py-3 text-right font-bold text-slate-900">₹{item.subtotal}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            <div className="flex justify-between items-center pt-4 border-t-2 border-slate-100">
                                <div className="flex gap-2">
                                    <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-md ${lastBill.paymentStatus === 'paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-orange-100 text-orange-700'}`}>
                                        {lastBill.paymentStatus}
                                    </span>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Grand Total</p>
                                    <h2 className="text-3xl font-black text-slate-900">₹{lastBill.totalAmount}</h2>
                                </div>
                            </div>
                        </div>
                        <div className="p-4 bg-slate-50 border-t border-slate-100 flex gap-3">
                            <button onClick={() => setLastBill(null)} className="flex-1 btn-secondary">Close</button>
                            <button onClick={handlePrint} className="flex-1 btn-primary flex items-center justify-center gap-2">
                                <Printer className="w-5 h-5" /> Print Invoice
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Hidden Print Content for window.print() */}
            <div className="print-only fixed inset-0 bg-white p-10 z-[100]">
                {lastBill && (
                     <div className="w-full">
                        <div className="flex justify-between items-start mb-8">
                            <div>
                                <h1 className="text-3xl font-black text-primary-600">{user?.shopName}</h1>
                                <p className="text-slate-500">Invoice Receipt</p>
                            </div>
                            <div className="text-right">
                                <p className="font-bold">Invoice #{lastBill._id.slice(-6).toUpperCase()}</p>
                                <p className="text-slate-500">{new Date(lastBill.createdAt).toLocaleString()}</p>
                            </div>
                        </div>
                        <hr className="my-6" />
                        <div className="grid grid-cols-2 gap-8 mb-8">
                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase">Customer</p>
                                <p className="text-lg font-bold">{lastBill.customer?.name || 'Walking Customer'}</p>
                                <p>{lastBill.customer?.phone || '-'}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-xs font-bold text-slate-400 uppercase">Payment Status</p>
                                <p className="text-lg font-bold uppercase">{lastBill.paymentStatus}</p>
                            </div>
                        </div>
                        <table className="w-full mb-8">
                            <thead className="border-b border-black">
                                <tr>
                                    <th className="text-left py-2">Product</th>
                                    <th className="text-right py-2">Qty</th>
                                    <th className="text-right py-2">Price</th>
                                    <th className="text-right py-2">Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {lastBill.items.map((item, i) => (
                                    <tr key={i} className="border-b border-slate-100">
                                        <td className="py-2">{item.name}</td>
                                        <td className="text-right py-2">{item.quantity}</td>
                                        <td className="text-right py-2">₹{item.price}</td>
                                        <td className="text-right py-2">₹{item.subtotal}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <div className="text-right">
                            <p className="text-sm font-bold text-slate-500">Grand Total</p>
                            <h2 className="text-4xl font-black">₹{lastBill.totalAmount}</h2>
                        </div>
                        <div className="mt-12 text-center text-slate-400 italic">
                            Thank you for shopping with us!
                        </div>
                     </div>
                )}
            </div>
        </div>
    );
};

export default Billing;
