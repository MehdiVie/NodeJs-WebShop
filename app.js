const express = require('express');

const path = require('path');
const adminRoutes = require('./routes/admin');
const shopRoutes = require('./routes/shop');
const authRoutes = require('./routes/auth');
const errorController = require('./Controllers/error');
const User = require('./models/user');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoDBStore = require('connect-mongodb-session')(session)

const MONGODB_URI = 'mongodb+srv://UserReadWrite:bM0T1rs4jMhQFgfn@cluster0.pdry4.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

const app = express();
const store = new MongoDBStore({
  uri : MONGODB_URI , 
  collection : 'sessions'
});

app.set('view engine' , 'ejs');
app.set('views', './views');


const bodyParser = require('body-parser');
const { console } = require('inspector/promises');

app.use(bodyParser.urlencoded({ extended : false }));
app.use(express.static(path.join(__dirname , 'public')));
app.use(
  session({secret : 'my secret', resave : false, saveUninitialized : false, store : store})
);

app.use((req, res, next) => {
  User
  .findById('67a00ec136db9a6e10a9318b')
  .then(user => {
    req.user = user;
    next();
  })
  .catch(err => console.log(err));
}); 

app.use('/admin', adminRoutes);
app.use(shopRoutes);
app.use(authRoutes);

app.use(errorController.get404);

mongoose
  .connect(
    MONGODB_URI
  )
  .then(result => {
    User.findOne().then(user => {
      if (!user) {
        const user = new User ({
          name : 'Mehdi' , 
          email : 'Mehdi@gmail.com' , 
          cart : {
            items:[]
          }
        });
        user.save();
      }
    })
    app.listen(3000);
  })
  .catch(err => {
    console.log(err);
  });



  


  