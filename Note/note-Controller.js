const Note = require('./noteModel')
const Folder = require('.././Folder/folderModel')
const User = require('.././User/userModel')
const Topic = require('.././Topic/topicModel')

//1 Function to Create and Svae a Note // Dont require folder id
exports.saveNote = async (req, res) => {
    try {
        const { title, content, folder_id} = req.body;
        // Check if folder exists //can be managed in frontend
        const folder = await Folder.findById(folder_id)
        
        if (!folder || folder.deleted) {
            return res.status(404).json({ message: 'Folder not found, please create a folder first' })
        }
        const user = await User.findById(folder.created_by) 
        const existingNote = await Note.findOne({ title, folder_id});
        // Check if a note with the same title already exists in the specified folder if yes then Update
        if (existingNote) {
            if (!existingNote.deleted) { 
                res.status(200).json({ message: 'Note already exists' })
            }
            else {
                res.status(200).json({message:'Notw with same name from this folder already exist in your thrashbib'})
            }
        }
        else {// If the note doesn't exist, create a new note
            const newNote = new Note({
                title,
                content,
                folder_id,
                created_by:folder.created_by
            });
            await newNote.save(); // Save the note to the database

            folder.notes.push(newNote._id)  //Update Folder
            user.notes.push(newNote._id)
            user.notes.sort((a, b) => b.updated_at - a.updated_at);
            await user.save();   //save folder
            await folder.save();

            res.status(201).json({ message: 'Note created successfully' });
        }
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
}

//Function to View Content of a Note
exports.viewNote = async (req, res) => {
    try {
        const { noteId } = req.body;
        const note = await Note.findById(noteId);
        if (!note) {
            res.status(404).json({ message: 'Note not found' });
        }
        else {
            res.status(200).json(note.content);
        }
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
}


//Function to Update a Note
exports.updateNote = async (req, res) => { 
    try {
        const { noteId, content } = req.body;
        const note = await Note.findById(noteId);
        if (!note) {
            res.status(404).json({ message: 'Note not found' });
        }
        else {
            note.content = content;
            note.updated_at = Date.now();
            await note.save();
            const user = await User.findById(note.created_by);
            user.notes.sort((a, b) => b.updated_at - a.updated_at);
            await user.save();
            res.status(200).json({message:'Note Updated Successfully',content:note.content});
        }
    }
    catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
}

//Function to Delete a Note
exports.deleteNote = async (req, res) => {
  try {
    const { noteId } = req.body;

    // Find the note    //Basically put to thrashbin
    await Note.findByIdAndUpdate(noteId, { deleted: true });

    res.status(200).json({
          message: 'Note deleted and added to Thrashbin successfully',
    });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
}

//Function to Add Note to a Topic //

