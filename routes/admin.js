const express = require('express');
const router = express.Router();
const adminController = require('../Controllers/admin');

router.get('/products', adminController.getProducts);

router.get('/add-product', adminController.getAddProduct);
  
router.post('/add-product', adminController.postAddProduct);

router.get('/edit-product/:productId' , adminController.getEditProduct);

router.post('/edit-product', adminController.postEditProduct);

router.get('/delete-product/:productId',adminController.getDeleteProduct);

router.post('/delete-product', adminController.postDeleteProduct);


module.exports=router;
 