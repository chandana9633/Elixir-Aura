const User=require('../../models/user/userModel')
const Order=require('../../models/user/orderMoel')
const mongoose = require('mongoose');

const WalletSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: User,
        required: true
    },
    balance: {
        type: Number,
        default: 0
    },
    transaction: [
        {
            amount: {
                type: Number,
                required: true
            },
            type: {
                type: String,
                enum: ['Credit', 'Debit'],
                required: true
            },
            description: {
                type: String,
                required: true,
            },
            orderId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: Order
            },
            date: {
                type: Date,
                default: Date.now
            }

        }
    ]

}, {
    timestamps: true
})

const Wallet = mongoose.model('Wallet', WalletSchema)

module.exports = Wallet