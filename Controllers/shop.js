const Product = require('../models/product');
const { response } = require('express');
const Order = require('../models/order');


exports.getIndex = (req, res, next)=>{
    Product.find()
    .then((products) => {
        res.render('shop/product-list' , {
            prods:  products, 
            pageTitle: "Shop" , 
            path : '/product-list' , 
        });
    })
    .catch(err => console.log(err));
};

exports.getProducts = (req, res, next)=>{
    Product.find()
    .then((products) => {
        res.render('shop/product-list' , {
            prods:  products, 
            pageTitle: "Shop" , 
            path : '/product-list' , 
        });
    })
    .catch(err => console.log(err));
};

exports.getProduct = (req, res, next) => {
    const prodId = req.params.productId;
    Product.findById(prodId)
        .then((product) => {
            res.render('shop/product-detail' , {
                pageTitle: product.title , 
                product : product ,
                path : '/products/' 
            });
        })
        .catch(err => console.log(err));
};


exports.getCart = (req, res, next) => {
    

    if (!req.user) {
        return res.redirect('/login');
    }
    req.user
        .populate('cart.items.productId')
        .then(user => {
            const products = user.cart.items;
            res.render('shop/cart' , {
                pageTitle: 'Cart' , 
                path: '/cart' ,
                products : products
            })
        })
        .catch(err => console.log(err)); 
};

exports.postCart = (req, res, next) => {
    const productId = req.body.productId;
    Product.findById(productId)
        .then(product => {
            return req.user.addToCart(product);
        })
        .then(() => {
            res.redirect('/cart');
        })
        .catch(err => console.log(err)); 
    /* let fetchedCart;
    let newQuantity = 1;
    req.user
        .getCart()
        .then(cart => {
            fetchedCart = cart;
            return cart.getProducts({ where : { id : productId } })
        })
        .then(products => {
            let product;
            if (products.length >0) {
                product = products[0];
            }
            
            if (product) {
                const oldQuantity = product.cartItem.quantity;
                newQuantity = oldQuantity + 1;
                return product;
            }
            return Product.findByPk(productId)     
        })
        .then((product)=>{
            return fetchedCart.addProduct(product , 
                { through : { quantity : newQuantity }
            })
        })
        .then(()=>{
            res.redirect('/cart');
        })
        .catch(err => console.log(err)); */
};

exports.postCartDeleteItem = (req,res,next) => {
    const productId = req.body.productId;
    req.user
        .removeFromCart(productId)
        .then((result) => {
            res.redirect('/cart');
        })
        .catch(err => console.log(err));
};

exports.getOrders = (req, res, next) => {
    Order.find({ 'user.userId' : req.user._id})
        .then(orders => {
            res.render('shop/orders' , {
                pageTitle: 'Orders' ,
                path : '/orders' , 
                orders : orders
            });
        })
        .catch(err => console.log(err));
};

exports.postOrder = (req, res, next) => {
    req.user
    .populate('cart.items.productId')
    .then(user => {
        const products = user.cart.items.map(p => {
            return {  quantity : p.quantity , 
                product : { ...p.productId._doc } }
        });
        //console.log(products);
        const order = new Order({
            user : {
                name : req.user.name,
                userId : req.user
            } ,
            products : products
            });
        return order.save();
    })
    .then(() => {
        req.user.cleanCart();
    })
    .then(() => {
        res.redirect('/orders');
    })
    .catch(err => console.log(err));
};



