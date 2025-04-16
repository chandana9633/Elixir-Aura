const Order=require('../../models/user/orderMoel')

const allOrders = async (req, res) => {
    try {
        const orders = await Order.find().sort({ createdAt: -1 })
        res.render('admin/allOrders', { orders });
    } catch (error) {
        console.error(error);
        res.status(500).send("Server error");
    }
};

const productDetailAdminShow = async (req, res) => {
    try {
        const orderId = req.params.id;
        const order = await Order.findById(orderId).populate('productItems.productId', 'name image price');

        if (!order) {
            return res.status(404).send("Order not found.");
        }



        res.render('admin/orderDetail', { order });
    } catch (error) {
        console.error("Error fetching order details:", error);
        res.status(500).send("Internal Server Error");
    }
};






module.exports={
    allOrders,
    productDetailAdminShow,
}