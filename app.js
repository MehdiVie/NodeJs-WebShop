const express = require('express');

const path = require('path');
const adminRoutes = require('./routes/admin');
const shopRoutes = require('./routes/shop');
const authRoutes = require('./routes/auth');
const errorController = require('./Controllers/error');
const User = require('./models/user');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoDBStore = require('connect-mongodb-session')(session);
const csrf = require('csurf');
const flash= require('connect-flash');
const multer = require('multer');


const MONGODB_URI = 'mongodb+srv://UserReadWrite:cel65GJNAnw0qXS6@cluster0.pdry4.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';


const app = express();
const store = new MongoDBStore({
  uri : MONGODB_URI , 
  collection : 'sessions'
});
const csrfProtection = csrf();

const fileStrorage = multer.diskStorage({
  destination : (req , file , cb) => {
      cb(null , 'images');
  } ,
  filename : (req , file , cb) => {
      cb(null , new Date().toISOString() + '-' + file.originalname);
  }
});

app.set('view engine' , 'ejs');
app.set('views', './views');


const bodyParser = require('body-parser');
const { console } = require('inspector/promises');

app.use(bodyParser.urlencoded({ extended : false }));
app.use(multer({storage : fileStrorage}).single('image'));
app.use(express.static(path.join(__dirname , 'public')));
app.use(
  session({
    secret : 'my secret', 
    resave : false, 
    saveUninitialized : false, 
    store : store
  })
);

app.use(csrfProtection);
app.use(flash());

app.use((req,res,next)=>{
  res.locals.isAuthenticated = req.session.isLoggedIn;
  res.locals.csrfToken = req.csrfToken();
  next();
});

app.use((req, res, next) => {
  //throw new Error('Dummay');
  if (!req.session.user) {
    return next();
  }
  User.findById(req.session.user._id)
  .then(user => {
    //throw new Error('Dummay');
    if (!user) {
      return next();
    }
    req.user = user;
    next();
  })
  .catch(err => {
    next(new Error(err));
  });
}); 



app.use('/admin', adminRoutes);
app.use(shopRoutes);
app.use(authRoutes);

app.get('/500' , errorController.get500);
app.use(errorController.get404);

app.use((error , req , res , next) => {
    
    res.status(500).render('500' , {
        pageTitle : 'Error' , 
        path : '/500' , 
        isAuthenticated :  req.session ? req.session.isLoggedIn : false ,
    });
});

mongoose
  .connect(
    MONGODB_URI
  )
  .then(result => {
    app.listen(3000);
    //app.listen(3001);
  })
  .catch(err => {
    console.log(err);
  });




  


  