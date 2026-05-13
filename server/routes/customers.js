const express = require('express');
const router = express.Router();
const Customer = require('../models/Customer');
const Transaction = require('../models/Transaction');
const Bill = require('../models/Bill');
const auth = require('../middleware/auth');

// Get all customers
router.get('/', auth, async (req, res) => {
    try {
        const customers = await Customer.find({ userId: req.userId }).sort({ name: 1 });
        res.json(customers);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Add new customer
router.post('/', auth, async (req, res) => {
    try {
        const { name, phone } = req.body;
        const customer = new Customer({ name, phone, userId: req.userId });
        await customer.save();
        res.status(201).json(customer);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get customer transactions
router.get('/:id/transactions', auth, async (req, res) => {
    try {
        const transactions = await Transaction.find({ 
            userId: req.userId, 
            customerId: req.params.id 
        }).sort({ createdAt: -1 });
        res.json(transactions);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Record a payment (paying back due)
router.post('/:id/payments', auth, async (req, res) => {
    try {
        const { amount, note } = req.body;
        
        // 1. Create Transaction
        const transaction = new Transaction({
            userId: req.userId,
            customerId: req.params.id,
            amount,
            type: 'payment',
            note: note || 'Payment received'
        });
        await transaction.save();

        // 2. Reduce Customer Due
        const customer = await Customer.findByIdAndUpdate(req.params.id, {
            $inc: { totalDue: -amount }
        }, { new: true });

        // 3. Update Bill Statuses (FIFO logic)
        // We find all due bills and mark them paid if the total due is now less than the bill's threshold
        const dueBills = await Bill.find({ 
            'customer.id': req.params.id, 
            paymentStatus: 'due' 
        }).sort({ createdAt: 1 });

        let totalDebtFromBills = dueBills.reduce((acc, b) => acc + b.totalAmount, 0);
        let amountPaidTowardsDues = totalDebtFromBills - customer.totalDue;

        for (const bill of dueBills) {
            if (amountPaidTowardsDues >= bill.totalAmount) {
                bill.paymentStatus = 'paid';
                await bill.save();
                amountPaidTowardsDues -= bill.totalAmount;
            } else {
                break;
            }
        }

        res.status(201).json({ transaction, customer });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
