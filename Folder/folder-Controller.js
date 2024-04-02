//THIS FILE CONTAINS THE FUNCTION STO CREATE AND DELETE A FOLDER AND VIEW CONTENTS OF FOLDER

const Folder = require('./folderModel');
const User = require('.././User/userModel');
const Note = require('.././Note/noteModel');
const Topic = require('.././Topic/topicModel')

// Create a new folder  #Complete
exports.createFolder = async (req, res) => {
  try {
    const { name, userId, topicId} = req.body;
      //Check if the folder exists  
    const existingFolder = await Folder.findOne({ name, created_by : userId });
    const user = await User.findById(userId);
    let topics = []
    let topic
    if (topicId) {
      topic=await Topic.findById(topicId)
      if (!topic) {
        return res.status(400).json({ message: 'Topic Not Found' });
      }
      else {
        topics=[topicId]
      }
    }
      
    if (existingFolder) {
      if (!existingFolder.deleted && !existingFolder.archived) {
        return res.status(400).json({ message: 'Folder already exists' });
      }
      else if (!existingFolder.deleted)
      {
        return res.status(400).json({ message: 'Folder already ezists, Check your archives' });
      }
      else {
        return res.status(400).json({ message: 'Folder already exists in your thrashbin' });
      }
    }
      
    // Create a new folder instance
      const newFolder = new Folder({
        name,
        created_by: userId,
        topics
    });

    // Save the folder to the database
    await newFolder.save();
    user.folders.push(newFolder._id);
    await user.save();
    if (topic) {
      topic.folders.push(topic._id)
      await topic.save();
    }

    res.status(201).json({ message: 'Folder created successfully', folder: newFolder });
  }
  catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};



// Delete a folder  #Complete
exports.deleteFolder = async (req, res) => {
  try {
    const { folderIds, userId} = req.body;

    // Find and delete the folder
    const folders = await Folder.find({ _id: { $in: folderIds } });

    for (const folder of folders) {
      if (!folder) {
        console.log('Folder not found');
        continue;
      }

      // Mark the folder as deleted
      folder.deleted = true;
      await folder.save();

      // Mark the notes inside the folder as deleted
      for (const noteId of folder.notes) {
        const note = await Note.findById(noteId);
        if (note) {
          note.deleted = true;
          await note.save();
        }
      }
    }
    res.status(200).json({
      message: 'Folder deleted and added to thrashbin',
    });
  }
  catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};


//Archive a folder  #complete
exports.archiveFolder = async (req, res) => {
  try {
    const { folderIds, userId } = req.body;

    // Find and archive the folder
    const folders = await Folder.find({ _id: { $in: folderIds } });
    for (const folder of folders) {
      if (!folder) {
        console.log('Folder not found');
        continue;
      }

      // Mark the folder as deleted
      folder.archived = true;
      await folder.save();

      // Mark the notes inside the folder as deleted
      for (const noteId of folder.notes) {
        const note = await Note.findById(noteId);
        if (note) {
          note.archived = true;
          await note.save();
        }
      }
    }
    res.status(200).json({
      message: 'Folder archived successfully',
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};


//View Notes inside a folder  #Complete
exports.viewFolder = async (req, res) => {
  try {
    const { folderId, userId } = req.body;
    const folder = await Folder.findById(folderId);
    if (!folder) {
      return res.status(404).json({ message: 'Folder not found' });
    }


    const filteredNotes = await Note.find({ folder_id: folderId, deleted: false, archived: false });
    res.status(200).json(filteredNotes.map(note => note._id));
  }
  catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};


//Add folder to topic or remove from topic
exports.addToTopic = async (req, res) => { 
  try {

        const { folderIds, topicIds1, topicIds2, userId } = req.body;

        // Step 1: Update folders array in the topic collection
        await Topic.updateMany(
            { _id: { $in: topicIds1 } }, // Match topics in topicIds1
            { $addToSet: { folders: { $each: folderIds } } }, // Add folderIds to folders array
            { session }
        );

        await Topic.updateMany(
            { _id: { $in: topicIds2 } }, // Match topics in topicIds2
            { $pull: { folders: { $in: folderIds } } }, // Remove folderIds from folders array
            { session }
        );
        await Topic.save();
    
        // Step 2: Update topics array in the folder collection
        await Folder.updateMany(
            { _id: { $in: folderIds } }, // Match folders in folderIds
            { $addToSet: { topics: { $each: topicIds1 } } }, // Add topicIds1 to topics array
            { session }
        );

        await Folder.updateMany(
            { _id: { $in: folderIds } }, // Match folders in folderIds
            { $pull: { topics: { $in: topicIds2 } } }, // Remove topicIds2 from topics array
            { session }
        );
        await Folder.save();
        console.log('Topics and folders updated successfully');
    }
  catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
}
