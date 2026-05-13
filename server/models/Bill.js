const mongoose = require('mongoose');

const billSchema = new mongoose.Schema({
    customer: {
        id: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
        name: String,
        phone: String
    },
    items: [{
        productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
        name: String,
        quantity: Number,
        price: Number,
        subtotal: Number
    }],
    totalAmount: { type: Number, required: true },
    paymentStatus: { type: String, enum: ['paid', 'due'], default: 'paid' },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

module.exports = mongoose.model('Bill', billSchema);
