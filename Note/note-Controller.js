const Note = require('./noteModel')
const Folder = require('.././Folder/folderModel')

//Function to Create and Svae a Note
exports.saveNote = async (req, res) => {
    try {
        const { title, content, folder_id } = req.body;
        // Check if folder exists //can be managed in frontend
        const folder = await Folder.findById(folder_id)
        if (!folder) {
            res.status(404).json({ message: 'Folder not found, please create a folder first' })
        }
           
        const existingNote = await Note.findOne({ title, folder_id });
        // Check if a note with the same title already exists in the specified folder if yes then Update
        if (existingNote && !existingNote.deleted) {
            // If the note exists, update its content and updated_at attribute
            existingNote.content = content;
            existingNote.updated_at = new Date();
            await existingNote.save();
            res.status(200).json({ message: 'Note updated successfully' });
        }
        else {// If the note doesn't exist, create a new note
            
            const newNote = new Note({
                title,
                content,
                folder_id
            });
            await newNote.save(); // Save the note to the database
            folder.notes.push(newNote._id)  //Update Folder
            await folder.save();   //save folder
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


//Function to Delete a Note
exports.deleteNote = async (req, res) => {
  try {
    const { noteId } = req.body;

    // Find the note    //Basically put to thrashbin
    const note = await Note.findByIdAndUpdate(noteId, { deleted: true });
      res.status(200).json({
          message: 'Note deleted and added to Thrashbin successfully',
          note
      });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
}

