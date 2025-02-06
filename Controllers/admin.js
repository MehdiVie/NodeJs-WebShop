const Product = require('../models/product');
const { ObjectId } = require('mongodb');

exports.getProducts = (req, res, next)=>{
    Product
        .find()
        //.select('title price -_id')
        //.populate('userId','name')
        .then((products) => {
            console.log(products);
            res.render('admin/products' , {
                prods:  products, 
                pageTitle: "Admin Products" , 
                path : '/admin/products' , 
            });
        })
        .catch(err => console.log(err));
};

exports.getAddProduct = (req, res, next)=>{
    res.render('admin/edit-product' , {
        pageTitle : 'Add Product' , 
        path : '/admin/add-product' ,
        edit : false 
    })
};

exports.postAddProduct = (req, res, next)=>{
    const title = req.body.title;
    const imageUrl = req.body.imageUrl;
    const price = req.body.price;
    const description = req.body.description;
    const product = new Product({
        title: title , 
        price: price , 
        imageUrl: imageUrl , 
        description: description , 
        userId : req.user
    }) 
    product
        .save()
        .then(result => {
            console.log('Created Product!');
            res.redirect('/admin/products');
        })
        .catch(err => {
            console.log(err);
        });
};

exports.getEditProduct = (req, res, next)=>{
    const edit = req.query.edit;
    if (!(edit)) {
        return res.redirect('/');
    }
    const productId = req.params.productId;
    Product
        .findById(productId)
        .then((product) => {
            if (!product) {
                return res.redirect('/');
            }
            res.render('admin/edit-product' , {
                pageTitle : 'Eidt Product' , 
                path : '/admin/edit-product' ,
                product : product ,
                edit : true
            })
        })
        .catch(err => console.log(err));
};

exports.postEditProduct = (req, res, next)=>{
    const prodId = req.body.editId;
    if (!ObjectId.isValid(prodId)) {
        console.log("Invalid ObjectId:", prodId);
        return res.status(400).send("Invalid Product ID");
    }
    const title = req.body.title;
    const imageUrl = req.body.imageUrl;
    const price = req.body.price;
    const description = req.body.description;
    
    Product.findById(prodId).then(product => {
        product.title=title;
        product.imageUrl=imageUrl;
        product.price=price;
        product.description=description;
        product
        .save()
    })
    .then(result => {
            console.log("UPDATED SUCCESSFULLY!");
            res.redirect('/admin/products');
        })
    .catch(err => console.log(err));
};

exports.getDeleteProduct = (req, res, next)=>{
    const deleteing = req.query.deleteing;
    if (!(deleteing)) {
        return res.redirect('/');
    }
    const productId = req.params.productId;
    Product
        .findById(productId)
        .then((product) => {
            if (!product) {
                return res.redirect('/');
            }
            res.render('admin/delete-product' , {
                pageTitle : 'Delete Product' , 
                path : '/admin/delete-product' ,
                product : product ,
                deleteing : true
            })
        })
        .catch(err => console.log(err));
};

exports.postDeleteProduct = (req, res, next)=>{
    const id = req.body.deleteId;
    Product.findByIdAndDelete(id)
        .then(() => {
            console.log("DELETED SUCCESSFULLY!");
            res.redirect("/admin/products");
        })
        .catch(err=>console.log(err)); 
};

