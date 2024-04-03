//THIS FILE CONTAINS THE FUNCTION STO CREATE AND DELETE A FOLDER AND VIEW CONTENTS OF FOLDER
const cron = require('node-cron');


const Folder = require('./folderModel');
const User = require('.././User/userModel');
const Note = require('.././Note/noteModel');
const Topic = require('.././Topic/topicModel')

//1.  Create a new folder  
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
      topic.folders.push(newFolder._id)
      await topic.save();
    }

    res.status(201).json({ message: 'Folder created successfully', folder: newFolder });
  }
  catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};



//2.   Delete a folder and Move to Trash  
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
      folder.deletedAt=new Date();
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


//3.  Archive a folder  
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


//4.  Function to Unarchive folders
exports.unarchiveFolder = async (req, res) => {
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
      folder.archived = false;
      await folder.save();

      // Mark the notes inside the folder as deleted
      for (const noteId of folder.notes) {
        const note = await Note.findById(noteId);
        if (note) {
          note.archived = false;
          await note.save();
        }
      }
    }
    res.status(200).json({
      message: 'Folder unarchived successfully',
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};


//5.  View Notes inside a folder  
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

//6.  Add/Remove single folder to topic 
exports.addToTopic = async (req, res) => { 
  try {
        const { folderIds, addto, userId } = req.body;

        const user = await User.findById(userId);
        const alltopics = user.topics
        const removeFrom = alltopics.filter(item => !addto.includes(item.toString()))
        // Step 1: Update folders array in the topic collection
        await Topic.updateMany(
            { _id: { $in: addto } }, // Match topics in topicIds1
            { $addToSet: { folders: { $each: folderIds } } }, // Add folderIds to folders array
        );

        await Topic.updateMany(
            { _id: { $in: removeFrom } }, // Match topics in topicIds2
            { $pull: { folders: { $in: folderIds } } }, // Remove folderIds from folders array
        );
    
        // Step 2: Update topics array in the folder collection
        await Folder.updateMany(
            { _id: { $in: folderIds } }, // Match folders in folderIds
            { $addToSet: { topics: { $each: addto } } }, // Add topicIds1 to topics array
        );

        await Folder.updateMany(
            { _id: { $in: folderIds } }, // Match folders in folderIds
            { $pull: { topics: { $in: removeFrom } } }, // Remove topicIds2 from topics array
        );
    res.status(200).json({ message: 'Topics and folders updated successfully' });
    }
  catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
}

const deleteFolderDependencies = async function(folder) {
    try {
      const notesToBeDeleted = folder.notes;
      const topicsToBeUpdated = folder.topics;
        // Update related arrays in the users collection
        await User.updateMany(
            { _id: folder.created_by },
            {
                $pull: { folders: folder._id } // Remove the deleted folder from the folders array
            }
        );
      await Note.deleteMany({ _id: { $in: notesToBeDeleted } });
      await Topic.updateMany(
          { _id: { $in: topicsToBeUpdated } },
          { $pull: { folders: folder._id } }
      );
    } catch (error) {
        throw new Error('Error processing folder deletion: ' + error);
    }
};

//7.  Function to delete premanently from trashbin
exports.deleteFolderPermanently = async (req, res) => {
  try {
    const { folderIds, userId } = req.body;

    // Find and archive the folder
    const folders = await Folder.find({ _id: { $in: folderIds } });
    for (const folder of folders) {
      if (!folder) {
        console.log('Folder not found');
        continue;
      }
      await deleteFolderDependencies(folder)
      await Folder.deleteOne({ _id: folder._id });
    }
    res.status(200).json({
      message: 'Folder deleted Permanently',
    });
  }
  catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

//8.  Function to Delete a folder automatically after desired time
cron.schedule('* * * * *', async () => {
    try {
        const twentySecAgo = new Date();
        twentySecAgo.setSeconds(twentySecAgo.getSeconds() - 20);
        const folders = await Folder.find({ deleted: true, deletedAt: { $lt: twentySecAgo } });
        for (const folder of folders) {
          await deleteFolderDependencies(folder);
          await Folder.deleteOne({ _id: folder._id });
          console.log("Deleted folder from trash bin: " + folder._id);  //Notify If needed
        }
    } catch (error) {
        console.error('Error deleting folders from trash bin:', error);
    }
});

//
// Run every 15 days at midnight (00:00)
//cron.schedule('0 0 */15 * *', async () => {
/*    try {
        const fifteenDaysAgo = new Date();
        fifteenDaysAgo.setDate(fifteenDaysAgo.getDate() - 15);
        const folders = await Folder.find({ deleted: true, deletedAt: { $lt: fifteenDaysAgo } });
        for (const folder of folders) {
            await deleteFolderDependencies(folder);
            await Folder.deleteOne({ _id: folder._id });
            console.log("Deleted folder from trash bin: " + folder._id);  //Notify If needed
        }
    } catch (error) {
        console.error('Error deleting folders from trash bin:', error);
    }
});
*/


//9.  Function to recover folders from trash bin
exports.recoverFolder = async (req, res) => {
  try {
    const { folderIds, userId } = req.body;

    const folders = await Folder.find({ _id: { $in: folderIds } });
    for (const folder of folders) {
      if (!folder) {
        console.log('Folder not found');
        continue;
      }

      // Mark the folder as undeleted
      folder.deleted = false;
      folder.deletedAt=null
      await folder.save();

      // Mark the notes inside the folder as undeleted
      for (const noteId of folder.notes) {
        const note = await Note.findById(noteId);
        if (note) {
          note.deleted = false;
          await note.save();
        }
      }
    }
    res.status(200).json({
      message: 'Folder recovered successfully',
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};