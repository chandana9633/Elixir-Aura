const express = require("express");
const route = express.Router();
const passport = require('passport');
const userController = require('../../controllers/userController/userAuthController');
const otpController = require('../../controllers/userController/otpController');
// const forgotPasswordController = require('../../controllers/userController/forgotPasswordController');
const googleAuthController = require('../../controllers/userController/googleAuthController');
const userProfileController=require('../../controllers/userController/userProfileController')
const userAddressController=require('../../controllers/userController/userAddressController')
const forgotPassController=require('../../controllers/userController/forgotPassController')
const cartController=require('../../controllers/userController/cartController')
// const checkOut=require('../../controllers/userController/checkOutController')
const orderController=require('../../controllers/userController/orderDetailController')
const checkutController=require('../../controllers/userController/checkOutController')
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

route.get('/loadProductPage/:id',productDetailsController.loadProductPage)
route.get('/shopPage',productDetailsController.loadShopPage)


route.get('/profile',userProfileController.userProfile)
route.post('/updateProfile',userProfileController.updateProfile)

route.get('/addressPage',userAddressController.addAddressPage)
route.post('/addAddress',userAddressController.addAddress)
route.get('/editAddressPage/:addressId',userAddressController.editAddressPage)
route.post('/updateAddress/:addressId', userAddressController.updateAddress);
route.get('/deleteAddress/:addressId', userAddressController.deleteAddress);

route.get('/cart',cartController.cartRender)
route.post('/addCart',cartController.addToCart)
route.post('/removeFromCart',cartController.removeFromCart)
route.post('/updateCartQuantity/:id',cartController.updateCartQuantity)

route.get('/checkOut',checkutController.checkOutPage)
route.post('/addNewAddress',checkutController.addNewAddres)
route.put('/updateAddress/:addressId',checkutController.updateAddress)
route.post('/order/place',checkutController.placeOrder)
route.get('/successOrder/:orderId',checkutController.successOrderPage)
route.get('/orders',orderController. orderList)
route.get('/orderDetails/:orderId',orderController. orderDetails)
route.post('/orders/cancel/:id',orderController.cancelOrder)
route.post('/orders/updateStatus/:orderId',orderController.updateStatus)
route.get('/cancelPage',orderController.cancelShowPage)


module.exports = route;
