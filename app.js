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


const MONGODB_URI = 'mongodb+srv://UserReadWrite:<MyPAss>@cluster0.pdry4.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';



const app = express();
const store = new MongoDBStore({
  uri : MONGODB_URI , 
  collection : 'sessions'
});
const csrfProtection = csrf();


const fs = require('fs');
const imageDir = path.join(__dirname, 'images');

const fileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = 'images';
    
    try {
      const existsBefore = fs.existsSync(uploadPath);
      // Ensure directory exists
      fs.mkdirSync(uploadPath, { recursive: true });
      const existsAfter = fs.existsSync(uploadPath);
      
      
      // Adding delay to ensure directory is settled
      setTimeout(() => {
        console.log('Proceeding with file save');
        cb(null, uploadPath);
      }, 100); // Delay to ensure folder is fully accessible

    } catch (err) {
      console.log('Folder creation failed:', err);
      cb(new Error('Upload path does not exist or could not be created.'));
    }
  },
  filename: (req, file, cb) => {
    const filename = new Date().toISOString().replace(/:/g, '-') + '-' + file.originalname;
    const filePath = path.join('images', filename);
    cb(null, filename);
  }
});


const fileFilter = (req , file , cb) => {
  if (file.mimetype === 'image/png' || 
      file.mimetype === 'image/jpg' ||
      file.mimetype === 'image/jpeg'
  ) {

    cb(null , true) ;

  } else {

    cb(null , false);

  }
}

app.set('view engine' , 'ejs');
app.set('views', './views');


const bodyParser = require('body-parser');


app.use(bodyParser.urlencoded({ extended : false }));
app.use(multer({storage : fileStorage , fileFilter : fileFilter}).single('image'));



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

app.use(express.static(path.join(__dirname, 'public')));
app.use('/images' , express.static(path.join(__dirname, 'images')));

app.use('/admin', adminRoutes);
app.use(shopRoutes);
app.use(authRoutes);

app.get('/test-error', (req, res, next) => {
  throw new Error('This is a test error'); // Should trigger error middleware
});

app.use(errorController.get404);
app.get('/500' , errorController.get500);


app.use((error, req, res, next) => {
  /*
  const logPath = path.join(__dirname, 'error.log');
  const errorMessage = `\n[${new Date().toISOString()}] Error: ${error.message}\nStack: ${error.stack}\n`;
  fs.appendFileSync(logPath, errorMessage);
  */ // Write error to file
  
  console.error('Error middleware reached:', error); // Ensure logging
  res.status(error.httpStatusCode || 500).render('500', {
    pageTitle: 'Error',
    path: '/500',
    isAuthenticated: req.session ? req.session.isLoggedIn : false,
  });
});


mongoose
  .connect(
    MONGODB_URI
  )
  .then(result => {
    //app.listen(3000);
    app.listen(3000);
  })
  .catch(err => {
    console.log(err);
  });




  


  
