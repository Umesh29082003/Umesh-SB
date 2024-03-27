const Folder = require('./folderModel');
const User= require('.././User/userModel');
// Create a new folder
exports.createFolder = async (req, res) => {
  try {
    const { name, created_by } = req.body;

      //Check if the folder exists  
    const existingFolder = await Folder.findOne({ name, created_by });
      const user = await User.findById(created_by);
      
    if (existingFolder && user) {
      return res.status(400).json({ message: 'Folder already exists' });
      }
      
    // Create a new folder instance
    const newFolder = new Folder({
      name,
      created_by
    });

    // Save the folder to the database
    await newFolder.save();

    if (user) {
      user.folders.push(newFolder._id);
      await user.save();
    }
      
    res.status(201).json({ message: 'Folder created successfully', folder: newFolder });
  }
  catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};
/*
// Delete a folder
exports.deleteFolder = async (req, res) => {
  try {
    const { folderId } = req.params;

    // Find and delete the folder
    await Folder.findByIdAndDelete(folderId);

    res.status(200).json({ message: 'Folder deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};
*/
/*
// Add a note to a folder
exports.addNoteToFolder = async (req, res) => {
    try {
        const {folderId, noteId}=req.body
      /*
    const { folderId} = req.params;
    const { noteId } = req.body;*/
/*
    // Find the folder
    const folder = await Folder.findById(folderId);

    if (!folder) {
      return res.status(404).json({ message: 'Folder not found' });
    }

    // Add the note to the folder's notes array
    folder.notes.push(noteId);
    await folder.save();

    res.status(200).json({ message: 'Note added to folder successfully', folder });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};*/