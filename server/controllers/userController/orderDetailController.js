const User=require('../../models/user/userModel')
const Product=require('../../models/admin/productModel')
const Order=require('../../models/user/orderMoel')

const orderList = async (req, res) => {
    try {
        const user = req.session.user;
        const userId = req.session.user?.id;

        if (!userId) {
            return res.status(400).json({ message: "User not logged in" });
        }

        const page = parseInt(req.query.page) || 1; 
        const limit = 5; 
        const skip = (page - 1) * limit; 

        const totalOrders = await Order.countDocuments({ userId });
        const orders = await Order.find({ userId })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const totalPages = Math.ceil(totalOrders / limit);

        res.render('user/orderList', { orders, user, currentPage: page, totalPages }); 
    } catch (error) {
        console.error("Error fetching orders:", error);
        res.status(500).send("Failed to fetch orders");
    }
};


const orderDetails=async (req,res) => {
    try {
        const user=req.session.user;
        const orderId=req.params.orderId
        const userId=req.session.user?.id

        if(!userId){
            return res.status(400).json({ message: "User not logged in" });
        }
        const order = await Order.findOne({_id:orderId,userId}).populate('productItems.productId')
        if (!order) {
            return res.status(404).send("Order not found");
        }
        res.render('user/orderDetails',{order,user})
    } catch (error) {
        console.error("Error fetching order details:", error);
        res.status(500).send("Failed to fetch order details");
    }
}

const cancelShowPage = async (req, res) => {
    try {
        const user=req.session.user
        const successMessage = req.query.success;
        const errorMessage = req.query.error;

        res.render('user/cancelPage', { successMessage, errorMessage ,user});
    } catch (error) {
        console.error('Error loading the cancelShowPage:', error);
        res.status(500).send('Server error occurred');
    }
};

const cancelOrder = async (req, res) => {
    try {
        const orderId = req.params.id;

        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(400).send("Order not found.");
        }

        if (order.status === 'Delivered' || order.status === 'Cancelled') {
            return res.status(400).send("Order cannot be canceled");
        }

        for (let item of order.productItems) {
            const product = await Product.findById(item.productId);
            if (product) {
                product.stock += item.quantity;
                await product.save();
            }
        }

        order.status = 'Cancelled';
        await order.save();

        return res.redirect(`/cancelPage?success=Order%20canceled%20successfully`);
    } catch (error) {
        console.error(error);
        return res.redirect(`/cancelPage?error=Server%20error%20occurred`);
    }
};

const updateStatus = async (req, res) => {
    const orderId = req.params.orderId;
    const { status } = req.body;
  
    if (['Pending', 'Shipped', 'Delivered'].includes(status)) {
      try {
        const updatedOrder = await Order.findByIdAndUpdate(orderId, { status: status }, { new: true });
  
        if (!updatedOrder) {
          return res.status(404).json({ success: false, message: 'Order not found' });
        }
  
        res.json({ success: true, order: updatedOrder });
      } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Failed to update order' });
      }
    } else {
      res.status(400).json({ success: false, message: 'Invalid status' });
    }
  };
  

module.exports={
    orderList,
    orderDetails,
    cancelShowPage,
    cancelOrder,
    updateStatus
}