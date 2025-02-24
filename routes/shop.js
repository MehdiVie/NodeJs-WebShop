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

router.get('/orders' ,isAuth, shopController.getOrders);

router.post('/create-order' ,isAuth, shopController.postOrder); 

module.exports=router;