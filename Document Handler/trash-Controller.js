//THIS FILE CONTAINS THE FUNCTION TO DELETE FOLDER/NOTE PERMANANTLY OR RECOVER IT AND FUNCTION TO VIEW USER FOLDER AND THRASHBIN

const Folder = require("../Folder/folderModel")
const Note = require("../Note/noteModel")
const User = require("../User/userModel")

//To delete or recover from thrashbin
exports.manageTashbin = async (req, res) => {
  try {
    const { id, type, action } = req.body;

    if (!id || !type || !action) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    let model;
    if (type === 'Folder') {
      model = Folder;
    } else if (type === 'Note') {
      model = Note;
    } else {
      return res.status(400).json({ message: 'Invalid type' });
    }

    if (action === 'delete') {
      if (type === 'Folder') {

          const folder = await Folder.findById(id);
          const user = await User.findById(folder.created_by);
          const notes = folder.notes
          await Note.deleteMany({_id:{$in: notes}})
          user.notes = await user.notes.filter(item => !notes.includes(item));
          user.notes.sort((a, b) => b.updated_at - a.updated_at);
          await user.save()
          await Folder.deleteOne({_id:folder._id})
            return res.status(400).json({
                message: 'Folder Successfully Deleted',
                //?pass id to check in postman
            });
        }
        else if (type === 'Note') { 
          const note = await Note.findById(id);
          const user = await User.findById(note.created_by)
          const folder = await Folder.findById(note.folder_id)
          await user.notes.pull(note)
          await note.deleteOne(note)
          await user.save()
          await folder.notes.pull(note)
          await folder.save()
          await Note.deleteOne({_id:note._id})
        
          return res.status(400).json({
            message: 'Note Successfully Deleted',
          });
        }
        else {
            return res.status(400).json({ message: 'Invalid type' });
        }
    }
    else if (action === 'recover') {
      await model.findByIdAndUpdate(id, { deleted: false });
      message = `${type} recovered successfully`;
      res.status(200).json({ message });
    }
    else {
      return res.status(400).json({ message: 'Invalid action' });
    }
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
    const deletedNotes = await Note.find({ created_by: userId, deleted: true});

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


exports.viewRecentNotes = async (req, res) => {
  try { 
      const {userId} = req.body
      const notes = await Note.find({ created_by: userId }).sort({ updated_at: -1 })
      res.status(200).json(notes.map(note => note._id).slice(0, 6));
  }
  catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
}

