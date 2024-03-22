const express=require('express')

const router=express.Router()
const auth=require("./auth-Controller")

router.route('/signup').post(auth.signup)
router.route('/login').post(auth.login)

module.exports=router