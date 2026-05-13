const express = require('express');
const router = express.Router();
const Bill = require('../models/Bill');
const Product = require('../models/Product');
const Customer = require('../models/Customer');
const Transaction = require('../models/Transaction');
const auth = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
    try {
        const bills = await Bill.find({ userId: req.userId }).sort({ createdAt: -1 });
        res.json(bills);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.post('/', auth, async (req, res) => {
    try {
        const { customer, items, totalAmount, paymentStatus } = req.body;

        // 1. Create Bill
        const bill = new Bill({
            customer,
            items,
            totalAmount,
            paymentStatus,
            userId: req.userId
        });
        await bill.save();

        // 2. Reduce Stock
        for (const item of items) {
            await Product.findByIdAndUpdate(item.productId, {
                $inc: { stock: -item.quantity }
            });
        }

        // 3. Update Customer Due and Log Transaction if applicable
        if (paymentStatus === 'due' && customer.id) {
            await Customer.findByIdAndUpdate(customer.id, {
                $inc: { totalDue: totalAmount }
            });

            const transaction = new Transaction({
                userId: req.userId,
                customerId: customer.id,
                amount: totalAmount,
                type: 'credit',
                note: `Bill #${bill._id.toString().slice(-6).toUpperCase()}`
            });
            await transaction.save();
        }

        res.status(201).json(bill);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
