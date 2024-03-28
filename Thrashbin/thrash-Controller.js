//THIS FILE CONTAINS THE FUNCTION TO DELETE FOLDER/NOTE PERMANANTLY OR RECOVER IT AND FUNCTION TO VIEW USER FOLDER AND THRASHBIN


const Folder = require(".././Folder/folderModel")
const Note = require(".././Note/noteModel")


//To delete or recover from thrashbin
exports.manageTrashbin = async (req, res) => {
  try {
    const { id, type, action } = req.body;

    if (!id || !type || !action) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    let model;

    if (type === 'folder') {
      model = Folder;
    } else if (type === 'note') {
      model = Note;
    } else {
      return res.status(400).json({ message: 'Invalid type' });
    }

    let message;

    if (action === 'delete') {
        if (type === 'folder') {
            //?code to delete folder as well as all notes inside it from db and pull the folder id out of the user's attribute ('folders' array)
            return res.status(400).json({
                message: 'Folder Successfully Deleted',
                //?pass id to check in postman
            });
        }
        else if (type === 'note') { 
            //?code to delete note from db and pull the note id out of the folder's attribute ('notes' array)
            return res.status(400).json({
                message: 'Note Successfully Deleted',
                //?pass id to check in postman
            });

        }
        else {
            return res.status(400).json({ message: 'Invalid type' });
        }
    }
    else if (action === 'recover') {
      await model.findByIdAndUpdate(id, { deleted: false });
      message = `${type} recovered successfully`;
    }
    else {
      return res.status(400).json({ message: 'Invalid action' });
    }

    res.status(200).json({ message });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};


exports.viewDocs = async (req, res) => {
  try {
    const { userId } = req.body;

    // Find all non-deleted folders for the user
    const folders = await Folder.find({ created_by: userId, deleted: false });
    const folderIds = folders.map(folder => folder._id)

    // Find all deleted folders for the user
    const deletedFolders = await Folder.find({ created_by: userId, deleted: true });

    // Find all deleted notes for the user  // ?some problem here in fetching deletedNotes
      const deletedNotes = await Note.find({ folder_id: { $in: folderIds }, deleted: true});

    // Create a trashbin folder containing deleted folders and notes
    const trashbin = {
      deletedFolders: deletedFolders.map(folder => folder._id),
      deletedNotes: deletedNotes.map(note => note._id)
    };

    res.status(200).json({ folderIds, trashbin });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};


