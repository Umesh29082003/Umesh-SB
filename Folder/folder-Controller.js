//THIS FILE CONTAINS THE FUNCTION STO CREATE AND DELETE A FOLDER AND VIEW CONTENTS OF FOLDER
const cron = require('node-cron');


const Folder = require('./folderModel');
const User = require('.././User/userModel');
const Note = require('.././Note/noteModel');
const Topic = require('.././Topic/topicModel')

//1.  Create a new folder  
exports.createFolder = async (req, res) => {
  try {
    const { name, userId, topicId } = req.body;
      
    const existingFolder = await Folder.findOne({ name, created_by: userId });
    const user = await User.findById(userId);
    let topic_id = null;

    if (topicId) {
        const topic = await Topic.findById(topicId);
        if (!topic) {
            return res.status(404).json({ message: 'Topic not found' });
        }

        topic_id = topicId;
        const existingFolderInTopic = await Folder.findOne({ name, created_by: userId, topic_id });

        if (existingFolderInTopic) {
          if (!existingFolderInTopic.deleted && !existingFolderInTopic.archived) {
            return res.status(400).json({ message: 'Folder with the same name already exists in this topic' });
          }
          if (existingFolderInTopic.deleted || existingFolderInTopic.archived) {
            return res.status(400).json({ message: 'Folder with the same name already exists in your thrashbin or archives' });
          }
        }
    }

    else if (existingFolder && existingFolder.topic_id==null) {
        if (!existingFolder.deleted && !existingFolder.archived) {
            return res.status(400).json({ message: 'Folder with the same name already exists' });
        }
        else
        {
            return res.status(400).json({ message: 'Folder with the same name already exists in your thrashbin or archives' });
        }
    }  
    // Create a new folder instance
    const newFolder = new Folder({
        name,
        created_by: userId,
        topic_id
    });

    // Save the folder to the database
    await newFolder.save();
    user.folders.push(newFolder._id); //update user's folders list
    await user.save();
    
    if (topic_id) {
        const topic = await Topic.findById(topic_id);
        if (topic) {
            topic.folders.push(newFolder._id) //update topic's folders list
            await topic.save();
        } else {
            return res.status(404).json({ message: 'Topic not found' });
        }
    }

    res.status(201).json({ message: 'Folder created successfully', folder: newFolder });
  }
  catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};





//2.   Delete a folder and Move to Trash  
exports.deleteFolder = async (req, res) => {
  try {
    const { folderIds, userId} = req.body;

    // Find the folders
    const folders = await Folder.find({ _id: { $in: folderIds } }); //array of folders

    for (const folder of folders) { //loop over the array of folders
      if (!folder) {
        console.log('Folder not found');
        continue; //continue if invalid folderId
      }

      // Mark the folder as deleted
      folder.deleted = true; 
      folder.deletedAt=new Date();  //update time of deletion
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

    // Find the folders
    const folders = await Folder.find({ _id: { $in: folderIds } }); //array of folders
    for (const folder of folders) {
      if (!folder) {
        console.log('Folder not found');
        continue;   //continue if invalid folderId
      }

      // Mark the folder as archived
      folder.archived = true;
      await folder.save();

      // Mark the notes inside the folder as archived
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

    // Find the folders
    const folders = await Folder.find({ _id: { $in: folderIds } }); //array of folders
    for (const folder of folders) { //loop over the array of folders
      if (!folder) {
        console.log('Folder not found');
        continue;
      }

      // Mark the folder as unarchived
      folder.archived = false;
      await folder.save();

      // Mark the notes inside the folder as unarchived
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
    const folder = await Folder.findById(folderId);   //find the folder
    if (!folder) {
      return res.status(404).json({ message: 'Folder not found' });
    }

    //get notes which are not archived and not deleted
    const filteredNotes = await Note.find({ folder_id: folderId, deleted: false, archived: false });  
    res.status(200).json(filteredNotes.map(note => note._id));  //return their ids
  }
  catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

//6.  Add/Remove single folder to topic 
exports.addToTopic = async (req, res) => { 
  try {
    const { folderId, addto, userId } = req.body;

    // Find the user
    const user = await User.findById(userId);

    // Get all topics of the user
    const alltopics = user.topics;

    // Remove the target topic from the list of topics
    const removeFrom = alltopics.filter(item => !addto.includes(item));
    
    // Check if the title of the folder being added is the same as any other folder in the target topic
    const existingFolder = await Folder.findOne({ _id: folderId });
    const topic = await Topic.findById(addto);

    if (topic && existingFolder) {
      const existingFolderInTopic = await Folder.findOne({ topic_id: addto, name: existingFolder.name });
      if (existingFolderInTopic) {
        return res.status(400).json({ message: 'Folder with the same name already exists in the target topic' });
      }
    }

    // Update folders array in the target topic
    await Topic.updateOne(
      { _id: addto },
      { $addToSet: { folders: folderId } }
    );

    // Remove the folder from other topics
    await Topic.updateMany(
      { _id: { $in: removeFrom } },
      { $pull: { folders: folderId } }
    );
    
    // Update topic_id of the folder
    await Folder.updateOne(
      { _id: folderId },
      { topic_id: addto.length > 0 ? addto : null } // Assign null if addto is an empty array
    );

    res.status(200).json({ message: 'Topics and folders updated successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
}




//An helper function to deleted dependencies of a folder before deleting it permanently
const deleteFolderDependencies = async function(folder) {
    try {
      const notesToBeDeleted = folder.notes;  //array of notes in the folder
      const topic = folder.topic_id  //array of topic in whcih the folder was 
        await User.updateMany(
            { _id: folder.created_by }, //find the creator
            {
                $pull: { folders: folder._id } //remove the folder id from the folder's array of creator
            }
        );
      await Note.deleteMany({ _id: { $in: notesToBeDeleted } });  //delete all the notes in the folder
      await Topic.updateOne(
          { _id: topic },  //find the topics which had the folder
          { $pull: { folders: folder._id } }  //remove the topicId from the folders array of the topic
      );
    } catch (error) {
        throw new Error('Error processing folder deletion: ' + error);
    }
};

//7.  Function to delete premanently from trashbin
exports.deleteFolderPermanently = async (req, res) => {
  try {
    const { folderIds, userId } = req.body;

    const folders = await Folder.find({ _id: { $in: folderIds } }); //array of folders to be deleted
    for (const folder of folders) { //loop over the array of folders
      if (!folder) {
        console.log('Folder not found');
        continue;
      }
      await deleteFolderDependencies(folder)  //remove dependencies of the folders
      await Folder.deleteOne({ _id: folder._id });  //delete the folder from DB
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
//cron.schedule('0 0 */15 * *', async () => { //run the below every 15 days at midnight
/*    try {
        const fifteenDaysAgo = new Date();  //store todays date
        fifteenDaysAgo.setDate(fifteenDaysAgo.getDate() - 15);  //set the date to 15 days earlier
        const folders = await Folder.find({ deleted: true, deletedAt: { $lt: fifteenDaysAgo } }); // array of folders whose deletedAt has a date less than 15 day earlier's date
        for (const folder of folders) {   //loop over the array of folders
            await deleteFolderDependencies(folder);   //delete the folder dependencies
            await Folder.deleteOne({ _id: folder._id });  //delete the folder from DB
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

    const folders = await Folder.find({ _id: { $in: folderIds } }); //array of folders to be recovered
    for (const folder of folders) {   //loop over the array of folders
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

//10. To Rename a Folder
exports.renameFolder = async (req, res) => {
  try {
    const { folderId, newname,userId } = req.body;

    const folder = await Folder.findById(folderId);
    folder.name = newname;
    await folder.save();

    res.status(200).json({
      message: 'Folder renamed successfully',
    });
  }
  catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};