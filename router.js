//THIS FILE CONTAINS THE ROUTERS

const express=require('express')

const router=express.Router()
const auth=require("./User/auth-Controller")
const note = require("./Note/note-Controller")
const folder = require("./Folder/folder-Controller")



const signupSchema= require("./User/signup-Schema")
const validate=require("./User/validate-signup")

router.route('/signup').post(validate(signupSchema),auth.signup)  //route to signup page //Validation to be added
router.route('/login').post(auth.login)  //route to handle login page
router.route('/makenote').post(note.saveNote) //route to handle note creation
router.route('/makefolder').post(folder.createFolder) //route to create folder
module.exports = router


