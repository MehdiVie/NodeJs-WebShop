const express = require('express');
const router = express.Router();
const shopController = require('../Controllers/shop');
const isAuth = require('../Middleware/is-Auth');

router.get('/', shopController.getIndex);

router.get('/products', shopController.getProducts);

router.get('/products/:productId', shopController.getProduct);

router.get('/cart' ,isAuth, shopController.getCart);
router.post('/cart',isAuth, shopController.postCart);

router.post('/cart-delete-item' ,isAuth,shopController.postCartDeleteItem);

router.get('/checkout' , isAuth , shopController.getCheckout);

router.get('/checkout/success' , isAuth , shopController.getCheckoutSuccess);

router.get('/checkout/cancel' , isAuth ,  shopController.getCheckout);

router.get('/orders' ,isAuth, shopController.getOrders);

//router.post('/create-order' ,isAuth, shopController.postOrder); 

router.get('/orders/:orderId' , isAuth , shopController.getInvoice);

module.exports=router;