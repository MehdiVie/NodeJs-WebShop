const User = require('../models/user');
const bcrypt = require('bcryptjs');
require('dotenv').config();
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);
const crypto = require('crypto');
const { error } = require('console');
const { buffer } = require('stream/consumers');
const { validationResult } = require('express-validator');


exports.getLogin = (req, res, next) => {
    //const isLoggedIn = req
    //    .get('Cookie')
    //    .split('=')[1];
    //console.log(req.session.isLoggedIn);
    let message=req.flash('error');
    if(message.length >0) {
        message = message[0];
    } else {
        message=null;
    }
    res.render('auth/login' , {
        pageTitle: 'Login' ,
        path : '/login' , 
        errorMessage : message ,
        oldInput : {
            email : '',
            password : '',
        } , 
        validationErrors : []
    });

};

exports.postLogin = (req, res, next) => {
    const email = req.body.email;
    const password = req.body.password;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).render('auth/login' , {
            path : '/login' , 
            pageTitle : 'Login' , 
            errorMessage : errors.array()[0].msg ,
            oldInput : {
                email : email,
                password : password,
            } , 
            validationErrors : errors.array()
        });
    }
    User.findOne({email : email})
        .then(user => {
            if (!user) {
                return res.status(422).render('auth/login' , {
                    path : '/login' , 
                    pageTitle : 'Login' , 
                    errorMessage : 'Invalid email or password!' ,
                    oldInput : {
                        email : email,
                        password : password,
                    } , 
                    validationErrors : []
                });
            }
            return bcrypt
                .compare(password , user.password)
                .then((doMatch)=> {
                    if (doMatch) {
                        req.session.isLoggedIn = true;
                        req.session.user = user;
                        
                        return req.session.save(err => {
                            if (err) {
                                console.log(err);
                                return res.redirect('/login');
                            }
                            res.redirect('/');
                        });
                        
                    }
                    return res.status(422).render('auth/login' , {
                        path : '/login' , 
                        pageTitle : 'Login' , 
                        errorMessage : 'Invalid email or password!' ,
                        oldInput : {
                            email : email,
                            password : password,
                        } , 
                        validationErrors : []
                    });
                    
                }) 
                .catch(err => {
                    const error = new Error(err);
                    error.httpStatusCode = 500 ;
                    return next(error);
                });    
        })
        .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500 ;
            return next(error);
        });
};

exports.postLogout = (req, res, next) => {
    req.session.destroy((err) => {
        console.log(err);
        res.redirect('/');
    });
};

exports.getSignup = (req, res, next) => {
    let message=req.flash('error');
    if(message.length >0) {
        message = message[0];
    } else {
        message=null;
    }
    res.render('auth/signup' , {
        pageTitle: 'Signup' ,
        path : '/signup' , 
        errorMessage : message ,
        oldInput : {
            email : '',
            password : '',
            confirmPassword:''
        } , 
        validationErrors : []
    });

};

exports.postSignup = (req, res, next) => {
    const email = req.body.email;
    const password = req.body.password;
    const confirmPassword= req.body.confirmPassword;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        
        return res.status(422).render('auth/signup' , {
            pageTitle: 'Signup' ,
            path : '/signup' , 
            errorMessage : errors.array()[0].msg ,
            oldInput : {
                email : email,
                password : password,
                confirmPassword: confirmPassword
            },
            validationErrors : errors.array()
        });
    }
    
    bcrypt
        .hash(password,12) 
        .then(hashedPassword =>{
                const user = new User({
                    email : email , 
                    password : hashedPassword , 
                    cart : { 
                    items : [] 
                } ,
            });
            return user.save();
        })
        .then((result) => {
            const msg = {
                to: email, // Empfänger
                from: 'salimimehdibeti00@gmail.com', // Deine verifizierte SendGrid-E-Mail
                subject: 'Signup in WebShop',
                html: '<strong>Hallo!</strong> Das ist eine <em>Signup E-Mail</em> von Nodejs Webshop.',
            };
            return sgMail.send(msg)
        })
        .then(()=>{
            req.flash('success' , 'Email sent successfully!');
            res.redirect('/login');
        })
        .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500 ;
            return next(error);
        });
};

exports.getReset = (req,res,next)=> {
    let message=req.flash('error');
    if(message.length >0) {
        message = message[0];
    } else {
        message=null;
    }
    let smessage=req.flash('success');
    if(smessage.length >0) {
        smessage = smessage[0];
    } else {
        smessage=null;
    }
    res.render('auth/reset' , {
        pageTitle: 'Reset Password' ,
        path : '/reset' , 
        errorMessage : message ,
        successMessage : smessage
    });
};

exports.postReset = (req,res,next)=> {
    crypto.randomBytes(32 , (err,buffer) => {
        if (err) {
            req.flash('error' , err);
            return res.redirect('/reset');
        }
        const token=buffer.toString('hex');

        User.findOne({email : req.body.email})
            .then(user => {
                if(!user) {
                    req.flash('error' , 'Email does not exist!');
                    return res.redirect('/reset');
                }
                //console.log(token);
                //process.exit(0);
                user.resetToken = token;
                user.resetTokenExpiration =Date.now() + 3600000;
                return user.save();
            })
            .then((result) => {
                if (result) {
                    const msg = {
                        to: req.body.email, // Empfänger
                        from: 'salimimehdibeti00@gmail.com', // Deine verifizierte SendGrid-E-Mail
                        subject: 'Reset Password for WebShop',
                        html: `
                            <p>You requested to reset Password!</p>
                            <p>
                            Click this <a href="http://localhost:3000/reset/${token}">link</a> to set a new password.</p>
                        `,
                    };
                    sgMail.send(msg);
                    req.flash('success' , 'Reset password email sent to your email.');
                    res.redirect('/reset');
                }
            })
            .catch(err => {
                const error = new Error(err);
                error.httpStatusCode = 500 ;
                return next(error);
            });
    });
};

exports.getNewPassword = (req,res,next) => {
    const token= req.params.token;
    
    User.findOne(
        {
        resetToken: token , 
        resetTokenExpiration : {$gt: Date.now()}
        }
    )
        .then(user => {
            let message = req.flash('error');
            if(message.length >0) {
                message = message[0];
            } else {
                message = null;
            }
            let smessage = req.flash('success');
            if(smessage.length >0) {
                smessage = smessage[0];
            } else {
                smessage=null;
            }
            res.render('auth/new-password' , {
                pageTitle: 'New Password' ,
                path : '/new-password' , 
                errorMessage : message ,
                successMessage : smessage , 
                userId : user._id.toString() ,
                passwordToken : token ,
            });

        })
        .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500 ;
            return next(error);
        });
};

exports.postNewPassword = (req,res,next) => {
    const newPassword = req.body.newPassword;
    const passwordToken = req.body.passwordToken;
    const userId = req.body.userId;
    let myUser;
    
    User.findOne({
        resetToken : passwordToken , 
        resetTokenExpiration : {$gt : Date.now()} ,
        _id : userId 
    })
        .then (user => {
            if (!user) {
                req.flash('error', 'Invalid or expired token!');
                return res.redirect('/reset');
            }
            myUser=user;
            return bcrypt.hash(newPassword,12);
        })
        .then (hashedPassword => {
            myUser.password = hashedPassword
            myUser.resetToken = undefined ; 
            myUser.resetTokenExpiration = undefined ; 
            return myUser.save(); 
        })
        .then(result => {
            req.flash('success' , 'Password changed successfully!');
            res.redirect('/login');
        })
        .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500 ;
            return next(error);
        });
};

