const express = require('express');
const router = express.Router();
const Bill = require('../models/Bill');
const Product = require('../models/Product');
const Customer = require('../models/Customer');
const Transaction = require('../models/Transaction');
const auth = require('../middleware/auth');
const mongoose = require('mongoose');

router.get('/stats', auth, async (req, res) => {
    try {
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        const userId = new mongoose.Types.ObjectId(req.userId);

        const [
            todayBills, 
            totalRevenueData, 
            totalCustomers, 
            lowStockProducts,
            allProducts,
            recentTransactions
        ] = await Promise.all([
            Bill.find({ userId: req.userId, createdAt: { $gte: startOfDay } }),
            Bill.aggregate([
                { $match: { userId: userId } },
                { $group: { _id: null, total: { $sum: "$totalAmount" } } }
            ]),
            Customer.countDocuments({ userId: req.userId }),
            Product.find({ userId: req.userId, stock: { $lt: 10 } }),
            Product.find({ userId: req.userId }),
            Transaction.find({ userId: req.userId }).sort({ createdAt: -1 }).limit(5)
        ]);

        const todaySales = todayBills.reduce((acc, bill) => acc + bill.totalAmount, 0);
        const totalRevenue = totalRevenueData.length > 0 ? totalRevenueData[0].total : 0;
        
        // Calculate Total Stock Value
        const totalStockValue = allProducts.reduce((acc, p) => acc + (p.price * p.stock), 0);

        // Calculate Top Selling Products (Aggregation)
        const topProducts = await Bill.aggregate([
            { $match: { userId: userId } },
            { $unwind: "$items" },
            { $group: { 
                _id: "$items.productId", 
                name: { $first: "$items.name" }, 
                totalQty: { $sum: "$items.quantity" },
                revenue: { $sum: "$items.subtotal" }
            }},
            { $sort: { totalQty: -1 } },
            { $limit: 5 }
        ]);

        // Calculate Last 7 Days Sales for Chart
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        
        const weeklySalesData = await Bill.aggregate([
            { $match: { userId: userId, createdAt: { $gte: sevenDaysAgo } } },
            { $group: {
                _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                total: { $sum: "$totalAmount" }
            }},
            { $sort: { _id: 1 } }
        ]);

        // Fill in missing days with 0
        const weeklySales = [];
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            const dayData = weeklySalesData.find(d => d._id === dateStr);
            weeklySales.push({
                name: date.toLocaleDateString('en-US', { weekday: 'short' }),
                total: dayData ? dayData.total : 0
            });
        }

        res.json({
            todaySales,
            totalRevenue,
            totalCustomers,
            totalStockValue,
            lowStockCount: lowStockProducts.length,
            lowStockProducts,
            topProducts,
            recentTransactions,
            weeklySales
        });
    } catch (err) {
        console.error('Stats Error:', err);
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
