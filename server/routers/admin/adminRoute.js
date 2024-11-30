const express = require('express');
const router = express.Router();
const multer = require('multer');

const adminAuthentication = require('../../controllers/adminController/adminAuthController');
const middleware=require('../../middlewares/adminMiddleware')
const categoryController=require('../../controllers/adminController/categoryController')
const productController=require('../../controllers/adminController/productsController')
const ordersController=require('../../controllers/adminController/ordersController')
const upload = require("../../../config/multer");

// const upload = multer({ dest: 'uploads/' });

router.get('/adminLoginPage',middleware.ensureAuthenticated,adminAuthentication.adminLoginPage)
router.get('/dashboard',middleware.isAdminAuthenticated,adminAuthentication.admindashboard)
router.post('/adminLogin',middleware.ensureAuthenticated,adminAuthentication.adminHome);
router.get('/usersList', adminAuthentication.getUsersList);
router.get('/categories',categoryController.loadCategoty)
router.post('/addCategory',categoryController.addingCategory)
router.get('/editCategory/:id',categoryController.loadEditCategery)
router.post('/editCategories/:id',categoryController.editCategory)
router.get('/deleteCategory/:id',categoryController.deleteCategory)
router.post('/changeCategoryStatus', categoryController.changeCategoryStatus);
router.get('/products',productController.loadProduct)
router.get('/addProduct',productController.addProducts)
router.get('/loadEditProduct/:id',productController.loadEditProduct)
router.post('/editProduct/:id',upload.array('image',3),productController.editProduct)

router.post('/remove-image/:id',productController.removeImages)
router.get('/deleteProduct/:id', productController.deleteProduct);
router.post('/product-status',productController.changeProductStatus)
router.get('/logout', adminAuthentication.adminLogout);

router.post('/addProduct',upload.array('image',3), productController.uploadProducts)
router.put('/changeStatus/:userId',adminAuthentication.changeStatus)

router.get('/orders',ordersController.allOrders)
// router.put('/admin/orders/:orderId/status', updateOrderStatus);
router.get('/productDetilPage',ordersController.productDetailAdmin)



module.exports = router;
