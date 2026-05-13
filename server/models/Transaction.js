const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
    amount: { type: Number, required: true },
    type: { type: String, enum: ['credit', 'payment'], required: true },
    note: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('Transaction', transactionSchema);
