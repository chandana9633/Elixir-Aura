const Order=require('../../models/user/orderMoel')

const allOrders = async (req, res) => {
    try {
        const orders = await Order.find();
        res.render('admin/allOrders', { orders });
    } catch (error) {
        console.error(error);
        res.status(500).send("Server error");
    }
};

// const updateOrderStatus = async (req, res) => {
//     const { orderId } = req.params;
//     const { status } = req.body;

//     try {
//         const order = await Order.findByIdAndUpdate(orderId, { status }, { new: true });
//         res.json({ success: true, message: 'Order status updated.', order });
//     } catch (error) {
//         console.error(error);
//         res.status(500).json({ success: false, message: 'Failed to update order status.' });
//     }
// };


const productDetailAdmin=async (req,res) => {
    try {
        res,render('admin/')
    } catch (error) {
        
    }
}


module.exports={
    allOrders,
    productDetailAdmin
    // updateOrderStatus
}