const User = require('../models/user');

exports.getLogin = (req, res, next) => {
    //const isLoggedIn = req
    //    .get('Cookie')
    //    .split('=')[1];
    //console.log(req.session.isLoggedIn);
    res.render('auth/login' , {
        pageTitle: 'Login' ,
        path : '/logn' , 
        isAuthenticated : false ,
    });

};

exports.postLogin = (req, res, next) => {
    User.findById('67a00ec136db9a6e10a9318b')
        .then(user => {
            req.session.isLoggedIn=true;
            req.session.user = user;
            res.redirect('/');
        })
        .catch(err => console.log(err));
};

exports.postLogout = (req, res, next) => {
    req.session.destroy((err) => {
        console.log(err);
        res.redirect('/');
    });
};

