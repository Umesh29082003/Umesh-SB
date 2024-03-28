//THIS FILE CONTAINS THE FOLDER SCHEMA

const mongoose = require('mongoose');
const Schema=mongoose.Schema;

const folderSchema = new Schema({
  name: {
    type: String,
    required: true
  },
  created_by: {
    type: Schema.Types.ObjectId,
    ref: 'User', // Assuming you have a User model
    required: true
  },
  deleted: {
    type: Boolean,
    default: false
  },
  notes: [{
    type: Schema.Types.ObjectId,
    ref: 'Note' // Assuming you have a Note model
  }]
});

const Folder = mongoose.model('Folder', folderSchema);

module.exports = Folder;
