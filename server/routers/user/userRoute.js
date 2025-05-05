const express = require("express");
const route = express.Router();
const passport = require('passport');
const userController = require('../../controllers/userController/userAuthController');
const otpController = require('../../controllers/userController/otpController');
const googleAuthController = require('../../controllers/userController/googleAuthController');
const userProfileController=require('../../controllers/userController/userProfileController')
const userAddressController=require('../../controllers/userController/userAddressController')
const forgotPassController=require('../../controllers/userController/forgotPassController')
const cartController=require('../../controllers/userController/cartController')
const orderController=require('../../controllers/userController/orderDetailController')
const wishlistController=require('../../controllers/userController/wishlistController')
const walletController=require('../../controllers/userController/walletController')
const checkutController=require('../../controllers/userController/checkOutController')
const couponUserController=require('../../controllers/userController/couponUserController')
const downloadInvoiceController=require('../../controllers/userController/downloadInvoiceController')
const middleware = require('../../middlewares/userMiddleware');
require('../../../config/passport-setup')
const productDetailsController=require('../../controllers/userController/userProductController')

route.use(passport.initialize());
route.use(passport.session());

route.get('/auth/google',passport.authenticate('google',{scope:
    ['email','profile']
}))

route.get('/auth/google/callback',
    passport.authenticate('google',{
        successRedirect:'/success',
        failureRedirect:'/failure'
}))
    
route.get('/success',googleAuthController.succsessGoogleLogin)
route.get('/failure ',googleAuthController.failureGoogleLogin)

route.get('/', userController.renderHome);
route.get('/register', middleware.forwardAuthenticated, userController.userRegister);
route.post('/signUp', middleware.forwardAuthenticated, userController.signUpUser);
route.get('/userLogin', middleware.forwardAuthenticated, userController.userLogin);
route.get('/otpPage', middleware.forwardAuthenticated, userController.otpRender);
route.post('/verifyOTP', userController.verifyOTP);
route.post('/signIn', middleware.forwardAuthenticated, userController.signIn);
route.get('/logout', userController.logout);
route.post('/resendOtp', otpController.resendOtp);
route.get('/forgotPassword', forgotPassController.fotgotPassPage);
route.post('/forgot-Password', forgotPassController.fotgotPassemail);

route.get('/resetPassword/:email',forgotPassController.resetPasswordPage)
route.post('/resetPassword',forgotPassController.postResetPasswordPage)


route.get('/loadProductPage/:id',productDetailsController.loadProductPage)
route.get('/shopPage',middleware.authenticated,productDetailsController.loadShopPage)
route.post('/addToCart',middleware.authenticated,productDetailsController.addCart)
route.post('/addToWishlist',productDetailsController.addWishlist)


route.get('/profile',middleware.authenticated,userProfileController.userProfile)
route.post('/updateProfile',userProfileController.updateProfile)

route.get('/addressPage',userAddressController.addAddressPage)
route.post('/addAddress',userAddressController.addAddress)
route.get('/editAddressPage/:addressId',userAddressController.editAddressPage)
route.post('/updateAddress/:addressId', userAddressController.updateAddress);
route.get('/deleteAddress/:addressId', userAddressController.deleteAddress);

route.get('/cart',middleware.authenticated, cartController.cartRender)
// route.get('/cart', cartController.cartRender)
route.post('/addCart',middleware.authenticated,cartController.addToCart)
route.post('/removeFromCart',cartController.removeFromCart)
route.post('/updateCartQuantity/:id',cartController.updateCartQuantity)
route.delete('/clearCart',cartController.clearCart)

route.get('/checkOut',middleware.authenticated,checkutController.checkOutPage)
route.post('/addNewAddress',checkutController.addNewAddres)
route.put('/updateAddress/:addressId',checkutController.updateAddress)
route.delete('/removeAddress/:addressId',checkutController. removeAddress);
route.post('/order/place',checkutController.placeOrder)
route.get('/successOrder/:orderId',checkutController.successOrderPage)
route.get('/orders',orderController. orderList)
route.get('/orderDetails/:orderId',orderController. orderDetails)
route.post('/orders/cancel/:id',orderController.cancelOrder)
route.post('/orders/cancel-item/:orderId/:productId',orderController. cancelPerticularProduct);
route.post('/orders/updateStatus/:orderId',orderController.updateStatus)
route.get('/cancelPage',orderController.cancelShowPage) 

route.get('/SearchProduct',productDetailsController.SearchingProduct)



route.get('/wishlist',wishlistController.wishlistPage)
route.post('/addToWish',middleware.authenticated,wishlistController.addToWishlist)
route.post('/wishlist/remove',wishlistController.removeWishlist)
route.get('/razor-key',orderController.RazorKey)
route.post('/razor-order',orderController.RazorOrder)
route.post('/OrderInfo',orderController.OrderInfo)
route.get('/faildOrderPage',orderController.faildOrderPage) 
route.post('/retry-payment/:orderId',orderController.retryPayment) 


route.get('/orderReturn/:id',orderController.orderReturn)
route.post('/returnReason/:id',orderController.orderReturnPost)

route.get('/productReturn/:orderId/:productId', orderController.productReturn);
route.post('/returnReason/:orderId/:productId', orderController.productReturnPost);

route.get('/wallet',walletController.walletPage) 

route.get('/coupon',couponUserController.couponPage) 
route.post('/applyCoupon',couponUserController.applyCoupon) 
route.post('/remove-coupon',couponUserController.removeCoupon) 

route.get('/downloadInvoice/:orderId',downloadInvoiceController.downloadInvoice)





module.exports = route;
