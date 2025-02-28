const Product = require('../models/product');
const fs = require('fs');
const path = require('path');
const Order = require('../models/order');
const mongoose = require('mongoose');
const PDFDocument = require('pdfkit');
const ITEMS_PER_PAGE=2;

exports.getIndex = (req, res, next)=>{
    const page= +req.query.page || 1;
    let totalItems;
    let message = req.flash('error');
    if(message.length >0) {
        message = message[0];
    } else {
        message = null;
    }
    //console.log(errorMessage);
    //process.exit(0);
    Product.find().countDocuments()
        .then(productNum => {
            totalItems=productNum;
            return Product.find()
                .skip((page-1)*ITEMS_PER_PAGE)
                .limit(ITEMS_PER_PAGE)
        })
        .then((products) => {
            res.render('shop/index' , {
                prods:  products, 
                pageTitle: "Shop" , 
                path : '/index' , 
                errorMessage : message ,
                totalProducts : totalItems ,
                currentPage : page ,
                hasNextPage : (page * ITEMS_PER_PAGE) < totalItems ,
                hasPreviousPage : (page > 1)?page:0 ,
                nextPage : page + 1 ,
                previousPage : page - 1 ,
                firstPage : 1 ,
                lastPage : Math.ceil(totalItems / ITEMS_PER_PAGE) ,
                
            });
        })
        .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500 ;
            return next(error);
        });
    };

exports.getProducts = (req, res, next)=>{
    const page= +req.query.page || 1;
    let totalItems;
    
    Product.find().countDocuments()
    .then(productNum => {
        totalItems=productNum;
        return Product.find()
            .skip((page-1)*ITEMS_PER_PAGE)
            .limit(ITEMS_PER_PAGE)
    })
    .then((products) => {
        res.render('shop/product-list' , {
            prods:  products, 
            pageTitle: "Products" , 
            path : '/product-list' , 
            totalProducts : totalItems ,
            currentPage : page ,
            hasNextPage : (page * ITEMS_PER_PAGE) < totalItems ,
            hasPreviousPage : (page > 1)?page:0 ,
            nextPage : page + 1 ,
            previousPage : page - 1 ,
            firstPage : 1 ,
            lastPage : Math.ceil(totalItems / ITEMS_PER_PAGE)
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

            const pdfDoc = new PDFDocument();

            res.setHeader('Content-Type','application/pdf');
            res.setHeader(
                'Content-Disposition',
                'inline; filename="' + invoiceName + '"');

            pdfDoc.pipe(fs.createWriteStream(invoicePath));
            pdfDoc.pipe(res);

            pdfDoc.fontSize(22).text('Invoice' , {
                underline : true
            });
            pdfDoc.text('----------------');
            let count= 0 ;
            let totalPrice = 0;
            order.products.forEach(prod => {
                count += 1;
                pdfDoc.fontSize(16).text(
                    count + ' - ' +
                    prod.product.title + ' - ' +
                    prod.quantity + 'X - ' +
                    prod.product.price + '$ =' +
                    prod.quantity*prod.product.price + '$' +
                    '\n'
                );
                totalPrice += prod.quantity*prod.product.price;
            })

            pdfDoc.text('---------');
            pdfDoc.fontSize(19).text(
                'Total : ' + 
                totalPrice + '$'
            );


            pdfDoc.end();

            /*fs.readFile(invoicePath , (err, data) => {
                if (err) {
                    return next(err);
                }
                res.setHeader('Content-Type','application/pdf');
                res.setHeader('Content-Disposition',
                    'inline; filename="' + invoiceName + '"');
                res.send(data);
            });
            const file = fs.createReadStream(invoicePath);
            
            file.pipe(res);*/
        })
        .catch(err => {
            next(err);
        });

};



