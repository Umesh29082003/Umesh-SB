//THIS FILE CONTAINS THE ROUTERS

const express=require('express')

const router=express.Router()
const auth=require("./User/auth-Controller")
const note = require("./Note/note-Controller")
const folder = require("./Folder/folder-Controller")
const thrash=require("./Thrashbin/thrash-Controller")


const signupSchema= require("./User/signup-Schema")
const validate=require("./User/validate-signup")

//To handle User
router.route('/signup').post(validate(signupSchema),auth.signup)  //route to signup page //Validation to be added
router.route('/login').post(auth.login)  //route to handle login page



//To handle Folder
router.route('/makefolder').post(folder.createFolder) //route to create folder
router.route('/deletefolder').patch(folder.deleteFolder) //route to delete folder
router.route('/viewfolder').get(folder.viewFolder) //route to view folder

//To handle Note
router.route('/makenote').post(note.saveNote) //route to handle note creation
router.route('/deletenote').patch(note.deleteNote) //route to handle note deletion
router.route('/viewnote').get(note.viewNote) //route to view folder

//To handle Thrashbin
router.route("/managethrash").post(thrash.manageTrashbin)

//To view user's documents
router.route("/viewdocuments").get(thrash.viewDocs)

module.exports = router


