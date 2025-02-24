const express = require('express');
const router = express.Router();
const authController = require('../Controllers/auth');
const { check , body } = require('express-validator');
const User = require('../models/user');

router.get('/login' , authController.getLogin);
router.get('/signup', authController.getSignup);

router.post('/login' ,
    [
        body('email')
            .isEmail()
            .withMessage('Please enter an Email in valid format.')
            .normalizeEmail()
        ,
        body('password' , 'Password is not valid')
            .isLength({min : 5})
            .isAlphanumeric()
            .trim()
    ]
    , authController.postLogin);
    
router.post('/signup', 
    [
    check('email')
        .isEmail()
        .withMessage('Please enter a valid Email!')
        .normalizeEmail()
        .custom((value , {req}) => {
            //if (value === 'test@test.com') {
            //    throw new Error('This email address is forbiden!');
            //}
            //return true;
            return User.findOne({email : value})
                .then(userDoc => {
                    if (userDoc) {
                        return Promise.reject(
                            'Email already exists! Pick a different Email!'
                        );
                    }
                });
        }),
    body(
        "password",
        "Please enter a password with only numbers and text at least 5 characters!"
        )
        .isLength({min : 5})
        .isAlphanumeric()
        .trim()
        ,
    body('confirmPassword')
        .trim()
        .custom((value , {req}) => {
            if (value !== req.body.password) {
                throw new Error('Password ans confirm Password are not match.')
            }
            return true;
        })

    ]
    , 
    authController.postSignup);

router.post('/logout' , authController.postLogout);

router.get('/reset', authController.getReset);
router.post('/reset', authController.postReset);

router.get('/reset/:token', authController.getNewPassword);
router.post('/new-password', authController.postNewPassword);
module.exports=router;