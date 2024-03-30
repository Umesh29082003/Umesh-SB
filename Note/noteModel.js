//THIS FILE CONTAINS THE NOTE SCHEMA

const mongoose = require('mongoose')

const noteSchema = new mongoose.Schema({
    title:{
        type: 'String',
        required: [true,'A note must have a title']
    },
    content:{
        type: 'String',
        required: true
    },
    created_by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', 
        required: true
    },
    created_at:{
        type: Date,
        default: Date.now()
    },
    updated_at:{
        type: Date,
        default: Date.now()
    },
    folder_id:{
        type: Object,
    },
    shared_with:{
        type: Array //[name of collection whose object ]
    },
    deleted:{
        type: Boolean,
        default: false
    }
})

const Note = mongoose.model('Note', noteSchema)
module.exports = Note