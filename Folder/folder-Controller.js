//THIS FILE CONTAINS THE FUNCTION STO CREATE AND DELETE A FOLDER AND VIEW CONTENTS OF FOLDER

const Folder = require('./folderModel');
const User = require('.././User/userModel');
const Note = require('.././Note/noteModel');


// Create a new folder
exports.createFolder = async (req, res) => {
  try {
    const { name, created_by } = req.body;

      //Check if the folder exists  
    const existingFolder = await Folder.findOne({ name, created_by });
    const user = await User.findById(created_by);
      
    if (existingFolder && user && !existingFolder.deleted) {
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



// Delete a folder
exports.deleteFolder = async (req, res) => {
  try {
    const { folderId } = req.body;

    // Find and delete the folder
    await Folder.findByIdAndUpdate(folderId, { deleted: true });

    res.status(200).json({
      message: 'Folder deleted and added to thrashbin',
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};



//View Notes inside a folder
exports.viewFolder = async (req, res) => {
  try {
    const { folderId } = req.body;
    const folder = await Folder.findById(folderId);
    if (!folder) {
      return res.status(404).json({ message: 'Folder not found' });
    }


    const filteredNotes = await Note.find({ folder_id: folderId, deleted: false });
    res.status(200).json(filteredNotes.map(note => note._id));
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};
