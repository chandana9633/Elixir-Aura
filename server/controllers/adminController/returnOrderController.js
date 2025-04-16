const Product=require('../../models/admin/productModel');
const Order = require('../../models/user/orderMoel');
const Wallet=require('../../models/user/walletModel')

const returnRequestAdmin=async (req,res) => {
    try {
       
        const orderId=req.params.id
        const order = await Order.findById(orderId).populate('productItems.productId');


        res.render('admin/orderReturnPage',{order})
    } catch (error) {
        console.log(error);
        
    }
}
const returnRequestProcessing = async (req, res) => {
    try {
        const { orderId, returnReason } = req.body;

        if (!orderId || !returnReason) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const order = await Order.findOne({ _id: orderId });
        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }

        if (returnReason === 'Returned') {
            order.status = 'Returned';

            for (const item of order.productItems) {
                const product = await Product.findById(item.productId);
                if (product) {
                    product.stock += item.quantity;
                    await product.save();
                }
            }

            const returnAmount = order.totalPrice;
            const userId = order.userId;

            let wallet = await Wallet.findOne({ userId });

            if (!wallet) {
                wallet = new Wallet({
                    userId: userId,
                    balance: returnAmount,
                    transaction: [
                        {
                            amount: returnAmount,
                            type: 'Credit',
                            description: `Refund for returned order ${orderId} (Payment Method: ${order.paymentMethod})`,
                            orderId: orderId,
                        },
                    ],
                });
                await wallet.save(); 
            } else {
                wallet.balance += returnAmount;
                wallet.transaction.push({
                    amount: returnAmount,
                    type: 'Credit',
                    description: `Refund for returned order ${orderId} (Payment Method: ${order.paymentMethod})`,
                    orderId: orderId,
                });
                await wallet.save(); 
            }
        } else if (returnReason === 'Rejected') {
            order.status = 'Rejected';
        }

        await order.save();

        res.status(200).json({ success: true, message: 'Order status updated successfully.' });
    } catch (error) {
        console.error('Error updating return status:', error);
        res.status(500).json({ error: 'Server error' });
    }
};


module.exports={
    returnRequestAdmin,
    returnRequestProcessing
}