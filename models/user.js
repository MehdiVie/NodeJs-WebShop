const mongoose = require('mongoose');
const Product = require('./product');

const Schema = mongoose.Schema;

const userSchema = new Schema({
    email : {
        type : String , 
        require : true
    },
    password : {
        type : String ,
        require : true
    },
    resetToken : String ,
    resetTokenExpiration : Date , 
    cart : {
        items: [
            {
                productId : { type : Schema.Types.ObjectId , ref : 'Product' , require:true } ,
                quantity : { type : Number , require:true }
            }
        ]
    }
});

userSchema.methods.addToCart = function(product) {
    const cartProductIndex = this.cart.items.findIndex(cp=> {
        return cp.productId.toString() === product._id.toString()
    });
    let newQuantity = 1;
    const updatedCartItems = [...this.cart.items];
    
    if (cartProductIndex > -1) {
        newQuantity = updatedCartItems[cartProductIndex].quantity+1;
        updatedCartItems[cartProductIndex].quantity=newQuantity; 
    } else {
        updatedCartItems.push({
            productId : product._id , 
            quantity : newQuantity });
    }

    const updatedCart = { items : updatedCartItems};
    this.cart = updatedCart;
    
    return this.save();
}

userSchema.methods.removeFromCart = function(productId) {
    const updatedCartItems = this.cart.items.filter(i => {
        return productId.toString() !== i.productId.toString();
    });
    this.cart.items = updatedCartItems;
    return this.save();
}

userSchema.methods.cleanCart = function() {
    this.cart =  { items : [] };
    return this.save();
}

module.exports = mongoose.model('User' , userSchema);

/* const getDb = require('../util/database').getDb;
const { ObjectId } = require('mongodb');
const { get } = require('../routes/admin');

class User {
    constructor(name, email, cart , id) {
        this.name = name , 
        this.email = email ,
        this.cart = cart ,
        this._id =id ? new ObjectId(String(id)) : null;
    }

    addToCart(product) {
        const cartProductIndex = this.cart.items.findIndex(cp=> {
            return cp.productId.toString() === product._id.toString()
        });
        let newQuantity = 1;
        const updatedCartItems = [...this.cart.items];
        
        if (cartProductIndex > -1) {
            newQuantity = updatedCartItems[cartProductIndex].quantity+1;
            updatedCartItems[cartProductIndex].quantity=newQuantity; 
        } else {
            updatedCartItems.push({
                productId : new ObjectId(String(product._id)) , 
                quantity : newQuantity });
        }

        const updatedCart = { items : updatedCartItems};
        const db = getDb();
        return db.collection('users').updateOne({ _id : this._id} , 
            { $set : { cart : updatedCart} });
    }

    getCart() {
        const db = getDb();
        const productIds = this.cart.items.map(i => {
            return i.productId;
        });

        return db
            .collection('products')
            .find( {_id : {$in : productIds }} )
            .toArray()
            .then(products => {
                return products.map(p => {

                    return {
                        ...p , 
                        quantity : this.cart.items.find(i => {
                        return (i.productId.toString() === p._id.toString());
                        }).quantity
                };
            });
        });
    }

    deleteCartItem(prodId) {
        const updatedCartItems = this.cart.items.filter(i => {
            return prodId.toString() !== i.productId.toString();
        });
        const db= getDb();
        return db.collection('users')
        .updateOne(
            { _id : this._id } , 
            {$set : { cart : { items : updatedCartItems}}}
        );
    } 

    getOrders() {
        const db= getDb();
        return db.collection('orders')
            .find({ 'user._id' : new ObjectId(String(this._id)) })
            .toArray();
    }

    addOrder() {
        const db = getDb();
        return this.getCart()
          .then(products => {
            const order = {
              items: products,
              user: {
                _id: new ObjectId(this._id),
                name: this.name
              }
            };
            return db.collection('orders').insertOne(order);
          })
          .then(result => {
            this.cart = { items: [] };
            return db
              .collection('users')
              .updateOne(
                { _id: new ObjectId(this._id) },
                { $set: { cart: { items: [] } } }
              );
          });
    }

    save() {
        const db= getDb();
        let dbOp=db;
        if (this._id) {
            dbOp = db.collection('users').updateOne(
                { _id : this._id}, { $set : this});

        } else {
            dbOp = db.collection('users').insertOne(this);
        }
        return dbOp
            .then(result => console.log(result))
            .catch(err=> console.log(err));
    }

    static findById(userId) {
        const db= getDb();
        return db
        .collection('users')
        .findOne({ _id : new ObjectId(String(userId)) })
        .then(user => {
            console.log(user);
            return user;
        })
        .catch(err => {
            console.log(err);
        });
        }
}

module.exports = User; */