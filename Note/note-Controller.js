const Note = require('./noteModel')
const Folder=require('.././Folder/folderModel')
exports.saveNote = async (req, res) => {
    try {
        const { title, content, folder_id } = req.body;
        // Check if a note with the same title already exists in the specified folder
        const folder = await Folder.findById(folder_id)
        if (!folder) {
            res.status(404).json({ message: 'Folders not found, please create a folder first' })
        }
            
        const existingNote = await Note.findOne({ title, folder_id });

        if (existingNote) {
            // If the note exists, update its content and updated_at attribute
            existingNote.content = content;
            existingNote.updated_at = new Date();
            await existingNote.save();
            res.status(200).json({ message: 'Note updated successfully' });
        }
        else {
            // If the note doesn't exist, create a new note
            const newNote = new Note({
                title,
                content,
                folder_id
            });
            await newNote.save();
            folder.notes.push(newNote._id)
            await folder.save();
            res.status(201).json({ message: 'Note created successfully' });
            
            // Save the note to the database
            
        }
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
}
