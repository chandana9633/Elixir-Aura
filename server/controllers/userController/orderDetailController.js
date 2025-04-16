const User=require('../../models/user/userModel')
const Product=require('../../models/admin/productModel')
const Order=require('../../models/user/orderMoel')
const Razorpay = require('razorpay');
const uuid = require('uuid');
const Cart = require('../../models/user/cartModel');
const Wallet=require('../../models/user/walletModel')
require('dotenv').config(); 

async function initiatePaymentRetry(order) {
    try {
        console.log('initial payment',order);
        
        const options={
            amount:order.totalPrice*100,
            currency:'INR',
            receipt: uuid.v4(),
        }

        const razorpayInstance=new Razorpay({
            key_id:process.env.RAZORPAY_ID_KEY ,
            key_secret:process.env.RAZORPAY_SECRET_KEY ,
        })

        const paymentOrder=await razorpayInstance.orders.create(options)
        console.log('order id:',paymentOrder.id)
        if(paymentOrder){
            order.paymentOrderId=paymentOrder.id
            
            await order.save()

            return {
                success: true,
                paymentOrderId: paymentOrder.id,
                totalPrice: order.totalPrice,
            };
        }else{
            return false
        }
    } catch (error) {
        console.error('Error in initiatePaymentRetry',error)
        return false
    }
}

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
        const orders = await Order.find({ userId, paymentStatus: { $in: ['Paid', 'Pending'] }  })
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

        if (order.paymentMethod !== 'COD') {
            const refundAmount = order.totalPrice;

            let wallet = await Wallet.findOne({ userId: order.userId });
            if (!wallet) {
                wallet = new Wallet({
                    userId: order.userId,
                    balance: refundAmount,
                    transaction: [{
                        amount: refundAmount,
                        type: 'Credit',
                        description: `Refund for canceled order ${orderId}`,
                        orderId: orderId
                    }]
                });
            } else {
                wallet.balance += refundAmount;
                wallet.transaction.push({
                    amount: refundAmount,
                    type: 'Credit',
                    description: `Refund for canceled order ${orderId}`,
                    orderId: orderId
                });
            }

            await wallet.save();
        } else {
            console.log(`COD order ${orderId} canceled. Refund will be handled manually.`);
        }

        order.status = 'Cancelled';
        await order.save();

        return res.redirect(`/cancelPage?success=Order%20canceled%20successfully`);
    } catch (error) {
        console.error(error);
        return res.redirect(`/cancelPage?error=Server%20error%20occurred`);
    }
};


const cancelPerticularProduct = async (req, res) => {
    try {
        const { orderId, productId } = req.params; 
        const { newStatus } = req.body;

        if (!orderId || !productId || !newStatus) {
            return res.status(400).json({ success: false, message: 'Missing required fields' });
        }

        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        const productItemIndex = order.productItems.findIndex(item => item.productId.toString() === productId);
        if (productItemIndex === -1) {
            return res.status(404).json({ success: false, message: 'Product item not found in order' });
        }

        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        if (newStatus === 'Cancelled') {
            order.productItems[productItemIndex].status = newStatus;
            product.stock += order.productItems[productItemIndex].quantity;
            await product.save();

            const refundAmount = order.productItems[productItemIndex].offerPrice || order.productItems[productItemIndex].total;

            order.originalPrice -= refundAmount;
            order.totalPrice -= refundAmount;

            let wallet = await Wallet.findOne({ userId: order.userId });
            if (!wallet) {
                wallet = new Wallet({
                    userId: order.userId,
                    balance: refundAmount,
                    transaction: [{
                        amount: refundAmount,
                        type: 'Credit',
                        description: `Refund for canceled product ${product.name} from order ${orderId}`,
                        orderId: orderId
                    }]
                });
            } else {
                wallet.balance += refundAmount;
                wallet.transaction.push({
                    amount: refundAmount,
                    type: 'Credit',
                    description: `Refund for canceled product ${product.name} from order ${orderId}`,
                    orderId: orderId
                });
            }

            await wallet.save();
        } else {
            return res.status(400).json({ success: false, message: 'Invalid cancellation status or conditions not met' });
        }

        await order.save();
        res.status(200).json({ success: true, message: 'Product cancelled successfully' });
    } catch (error) {
        console.error('Error cancelling product:', error);
        res.status(500).json({ success: false, message: 'Server error' });
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


  const razorpay = new Razorpay({
    key_id: 'rzp_test_Z3o7W5xFJXsiZY',
    key_secret: 'zzmgWLbhO91IV3vZHv0XJdZ9',
});

  const RazorKey = async (req, res) => {
    try {
        console.log("Razorpay Key:", 'rzp_test_Z3o7W5xFJXsiZY');
        res.json({ key: 'rzp_test_Z3o7W5xFJXsiZY'});
    } catch (error) {
        console.error("Error fetching Razorpay key:", error);
        res.status(500).send("Internal Server Error");
    }
};


const RazorOrder = async (req, res) => {
    try {
        
        const { amount } = req.body;

        console.log("req.body", amount);

        if (amount > 1000000) {
            console.error("Amount exceeds Razorpay's maximum limit.");
            return res.status(400).json({
                error: "Amount exceeds Razorpay's maximum transaction limit of ₹10,00,000.",
            });
        }

        const options = {
            amount: amount * 100, 
            currency: 'INR',
            receipt: uuid.v4(), 
        };

        const order = await razorpay.orders.create(options);
        res.json({ order });
    } catch (error) {
        console.error("Error fetching Razorpay key:", error);
        res.status(500).send("Internal Server Error");
    }
};


const OrderInfo = async (req, res) => {
    try {
        const {
            addressId,
            paymentMethod,
            GrandTotal,
            razorpayPaymentId,
            razorpayOrderId,
            razorpaySignature,
            paymentStatus
        } = req.body;
        
        const userId = req.session.user?.id;
        const cart = await Cart.findOne({ userId: userId }).populate('items.productId');
        console.log(razorpayPaymentId, razorpayOrderId, razorpaySignature, paymentStatus, "1================================>");
        
        if ((!razorpaySignature || !razorpayPaymentId) && paymentStatus === "Paid" || !razorpayOrderId) {
            return res.status(400).json({ success: false, message: "Invalid payment details" });
        }
        
        let totalQuantity = 0;
        const productItems = cart.items.map(item => {
            if (!item.productId) {
                throw new Error('Product not found');
            }
            totalQuantity += item.quantity;
            return {
                productId: item.productId._id,
                productName: item.productId.name,
                quantity: item.quantity,
                total: item.total,
                offerPrice: item.productId.price,
                status: 'Pending'
            };
        });
        
        const user = await User.findById(userId);
        
        const billingAddress = user.address.find(addr => addr._id.toString() === addressId);
        
        const newOrder = new Order({
            userId: req.session.user?.id,
            userName: user.name,
            billingAddress: billingAddress,
            productItems,
            paymentMethod,
            totalQuantity,
            totalPrice: cart.totalAmount || cart.grandTotal,
            discount: cart.discount || 0,
            originalPrice: cart.grandTotal,
            razorpay: {
                paymentId: razorpayPaymentId,
                orderId: razorpayOrderId,
                signature: razorpaySignature,
            },
            paymentStatus: paymentStatus,
            status: "Pending",
            createdAt: new Date(),
        });

        await newOrder.save();

        for (const item of productItems) {
            const product = await Product.findById(item.productId);
            if (product) {
                product.stock -= item.quantity;
                
                if (product.stock < 0) {
                    product.stock = 0;
                }
                
                await product.save();
            }
        }

        await Cart.deleteOne({ userId: userId });

        res.json({ success: true, message: "Order placed successfully", orderId: newOrder._id });
    } catch (error) {
        console.error("Error processing Razorpay payment:", error);
        res.status(500).json({ success: false, message: "Failed to process payment" });
    }
};


const orderReturn = async (req, res) => {
    try {
        const orderId = req.params.id;
        res.render('user/returnPage', { orderId });
    } catch (error) {
        console.error('Error rendering return page:', error);
        res.status(500).send('Internal Server Error');
    }
};

const orderReturnPost = async (req, res) => {
    try {
        console.log('Received Request:', req.body);
        const orderId = req.params.id; 
        const { status, reason } = req.body;

        const order = await Order.findById(orderId); 
        if (!order) {
            return res.status(404).json({ error: 'Order not found' }); 
        }

            await Order.findByIdAndUpdate(orderId, {
                status: "Request for returned",
                returnReason: reason
            })


            return res.status(200).json({ message: 'Return request processed successfully' }); 
        

       
    } catch (error) {
        console.error('Error processing return request:', error); 
        res.status(500).json({ error: 'Internal Server Error' }); 
    }
};


const productReturn = async (req, res) => {
    try {
        const { orderId, productId } = req.params;

        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).send('Order not found');
        }

        const product = order.productItems.find(item => item.productId.toString() === productId);
        if (!product) {
            return res.status(404).send('Product not found in order');
        }

        res.render('user/individualReturnPage', { 
            orderId: order._id, 
            productId: product.productId._id, 
            productName: product.productId.name, 
            price: product.price 
        });
    } catch (error) {
        console.error('Error rendering return page:', error);
        res.status(500).send('Internal Server Error');
    }
};

const productReturnPost = async (req, res) => {
    try {
        const { orderId, productId } = req.params;
        const { reason, quantity } = req.body;

        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        const product = order.productItems.find(item => item.productId.toString() === productId);
        if (!product) {
            return res.status(404).json({ message: 'Product not found in order' });
        }

        const refundAmount = product.price * quantity;

        const user = await User.findById(order.userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        user.wallet = (user.wallet || 0) + refundAmount;

        product.returned = true;
        product.returnReason = reason;

        await order.save();
        await user.save();

        res.status(200).json({ 
            message: 'Product returned successfully and refund added to wallet', 
            refundAmount,
            walletBalance: user.wallet 
        });
    } catch (error) {
        console.error('Error processing product return:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};


const faildOrderPage = async (req, res) => {
    try {
        const failedOrders = await Order.find({ paymentStatus: 'Failed' }).populate('productItems.productId');
        res.render('user/failedPayment', { failedOrders }); 
    } catch (error) {
        console.error("Error fetching failed orders:", error);
        res.status(500).send("An error occurred while loading the failed orders.");
    }
};

const retryPayment=async (req,res) => {
    try {
        // console.log('amount in repayment');
        const orderId=req.params.orderId
        const order=await Order.findById(orderId)

        console.log('oooooooooooooorder:',order);
        
        if(!order || order.paymentStatus !=='Failed'){
            console.log('order failed');
            
            return res.status(400).json({success:false,message:'Invalid order or payment aleary processed.'})
        }
            const retrysucces=await initiatePaymentRetry(order);
            console.log("dfffsssssssssssretrysuccessssssss",retrysucces);
            

            // if(retrysucces){
            if(retrysucces.success){
                console.log("entr retrysucces ");
                
                order.paymentStatus='Paid'
                await order.save()
                console.log('order success')
                return res.json({success:true,message:'Payment retry successfull',order,key:process.env.RAZORPAY_ID_KEY,
                    paymentOrderId: retrysucces.paymentOrderId,
                    totalPrice: retrysucces.totalPrice,
                 })
            }else{
                console.log('order failed')
                return res.status(500).json({success:false,message:'Payment retry failed'})
            }
        
        
    } catch (error) {
        console.log('error in payment',error);
        return res.status(500).json({success:false,message:'Server error'})

    }
}

module.exports={
    orderList,
    orderDetails,
    cancelShowPage,
    cancelOrder,
    cancelPerticularProduct,
    orderReturn,
    productReturn,
    productReturnPost,
    orderReturnPost,
    updateStatus,
    RazorKey,
    RazorOrder,
    OrderInfo,
    faildOrderPage,
    retryPayment
}