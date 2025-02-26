const Product = require('../models/product');
const fs = require('fs');
const path = require('path');
const Order = require('../models/order');
const mongoose = require('mongoose');


exports.getIndex = (req, res, next)=>{
    let message = req.flash('error');
    if(message.length >0) {
        message = message[0];
    } else {
        message = null;
    }
    //console.log(errorMessage);
    //process.exit(0);
    Product.find()
    .then((products) => {
        res.render('shop/product-list' , {
            prods:  products, 
            pageTitle: "Shop" , 
            path : '/product-list' , 
            errorMessage : message
        });
    })
    .catch(err => {
        const error = new Error(err);
        error.httpStatusCode = 500 ;
        return next(error);
    });
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
    .catch(err => {
        const error = new Error(err);
        error.httpStatusCode = 500 ;
        return next(error);
    });
};

exports.getProduct = (req, res, next) => {
    const prodId = req.params.productId;
    Product.findById(prodId)
        .then((product) => {
            res.render('shop/product-detail' , {
                pageTitle: product.title , 
                product : product ,
                path : '/products/' ,
            });
        })
        .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500 ;
            return next(error);
        });
};


exports.getCart = (req, res, next) => {
    
    if (!req.user) {
        return res.redirect('/login');
    }
    req.user
        .populate('cart.items.productId')
        .then(user => {
            const products = req.user.cart.items;
            res.render('shop/cart' , {
                pageTitle: 'Cart' , 
                path: '/cart' ,
                products : products ,
            })
        })
        .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500 ;
            return next(error);
        });
};

exports.postCart = (req, res, next) => {
    const productId = req.body.productId;
    Product.findById(productId)
        .then(product => {
            if (!product) {
                res.redirect('/cart');
            }
            return req.user.addToCart(product); 
        })
        .then((result) => {
            res.redirect('/cart');
        })
        .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500 ;
            return next(error);
        });
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
    Product.findById(productId)
        .then(product => {
            if (!product) {
                return res.redirect('/cart'); // Handle case where user is not found
            }
            return req.user.removeFromCart(productId); // ✅ Call method on the user document
        })
        .then(() => {
            res.redirect('/cart');
        })
        .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500 ;
            return next(error);
        });
};

exports.getOrders = (req, res, next) => {
    Order.find({ 'user.userId' : req.user._id})
        .then(orders => {
            res.render('shop/orders' , {
                pageTitle: 'Orders' ,
                path : '/orders' , 
                orders : orders ,
            });
        })
        .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500 ;
            return next(error);
        });
};

exports.postOrder = (req, res, next) => {
    req.user
    .populate('cart.items.productId')
    .then(user => {
        const products = req.user.cart.items.map(p => {
            return {  quantity : p.quantity , 
                product : { ...p.productId._doc } }
        });
        //console.log(products);
        const order = new Order({
            user : {
                email : req.user.email,
                userId : req.user
            } ,
            products : products
            });
        return order.save()
        .then(() => {
            user.cleanCart();
        })
    })
    .then(() => {
        res.redirect('/orders');
    })
    .catch(err => {
        const error = new Error(err);
        error.httpStatusCode = 500 ;
        return next(error);
    });
};

exports.getInvoice = (req , res , next) => {
    const orderId = req.params.orderId;
    
    if (!mongoose.Types.ObjectId.isValid(orderId)) {
        return next(new Error('Invalid order ID!'));
    }

    Order.findOne({'user.userId' : req.user._id , '_id' : orderId})
        .then(order => {
            if (!order) {
                return next(new Error('Access denied!'));
            }
            const invoiceName = 'invoice-'+ orderId + '.pdf';
            const invoicePath = path.join('data' , 'invoices' , invoiceName);
            fs.readFile(invoicePath , (err, data) => {
                if (err) {
                    return next(err);
                }
                res.setHeader('Content-Type','application/pdf');
                res.setHeader('Content-Disposition',
                    'inline; filename="' + invoiceName + '"');
                res.send(data);
            });
        })
        .catch(err => {
            next(err);
        });

};



