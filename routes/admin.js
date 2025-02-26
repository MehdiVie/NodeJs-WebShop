const express = require('express');
const router = express.Router();
const adminController = require('../Controllers/admin');
const isAuth = require('../Middleware/is-Auth');
const { body } = require('express-validator');

router.get('/products',isAuth, adminController.getProducts);

router.get('/add-product',isAuth, adminController.getAddProduct);
  
router.post('/add-product',isAuth,
    [
        body('title')
            .isLength({min : 3})
            .isString()
            .trim()
        ,
        body('price')
            .isFloat()
        ,
        body('description')
            .isLength({min : 5 , max : 400})
            .trim()
    ]
    ,adminController.postAddProduct);

router.get('/edit-product/:productId' ,isAuth, adminController.getEditProduct);

router.post('/edit-product',isAuth, 
    [
        body('title')
            .isLength({min : 3})
            .isString()
            .trim()
        ,
        body('price')
            .isFloat()
        ,
        body('description')
            .isLength({min : 5 , max : 400})
            .trim()
    ]
    ,
    adminController.postEditProduct);

router.get('/delete-product/:productId',isAuth,adminController.getDeleteProduct);

router.post('/delete-product',isAuth, adminController.postDeleteProduct);


module.exports=router;
 