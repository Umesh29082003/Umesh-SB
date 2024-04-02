//THIS FILE CONTAINS THE ROUTERS

const express=require('express')

const router=express.Router()
const auth=require("./User/auth-Controller")
const note = require("./Note/note-Controller")
const folder = require("./Folder/folder-Controller")
const trash=require("./Document Handler/trash-Controller")
const middleware = require("./middleware")

const signupSchema= require("./User/signup-Schema")
const validate=require("./User/validate-signup")

//To handle User
router.route('/signup').post(validate(signupSchema),auth.signup)  //route to signup page //Validation to be added
router.route('/login').post(auth.login)  //route to handle login page


//To handle Folder
router.route('/makefolder').post(middleware.authenticate,folder.createFolder) //route to create folder
router.route('/deletefolder').patch(middleware.authenticate,folder.deleteFolder) //route to delete folder
router.route('/viewfolder').get(middleware.authenticate,folder.viewFolder) //route to view folder
router.route('/archivefolder').post(middleware.authenticate,folder.archiveFolder)


//To handle Note
router.route('/makenote').post(middleware.authenticate,note.saveNote) //route to handle note creation
router.route('/deletenote').patch(middleware.authenticate,note.deleteNote) //route to handle note deletion
router.route('/viewnote').get(middleware.authenticate,note.viewNote) //route to view folder
router.route('/updatenote').post(middleware.authenticate,note.updateNote) //route to update note
//To handle Thrashbin
router.route("/managetrash").post(middleware.authenticate,trash.manageTashbin)


//To view user's documents
router.route("/viewdocuments").get(middleware.authenticate,trash.viewDocs)
router.route("/viewrecent").post(middleware.authenticate,trash.viewRecentNotes)
module.exports = router


