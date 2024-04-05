const cron = require('node-cron');

const Folder = require('../../Folder/folderModel')
const User = require('../../User/userModel')
const Note = require('../../Note/noteModel')
const Topic = require('../../Topic/topicModel')

//1.    An helper function to deleted dependencies of a folder before deleting it permanently
const deleteFolderDependencies = async function (folder) {
    try {
        const topic = folder.topic_id  //array of topic in whcih the folder was 
        await User.updateMany(
            { _id: folder.created_by }, //find the creator
            {
                $pull: { folders: folder._id } //remove the folder id from the folder's array of creator
            }
        );
        await Topic.updateOne(
          { _id: topic },  //find the topics which had the folder
          { $pull: { folders: folder._id } }  //remove the topicId from the folders array of the topic
      );
    } catch (error) {
        throw new Error('Error processing folder deletion: ' + error);
    }
};



//2.    An helper function to delete Notes in a folder
const deleteNotesInFolder = async function (folder) { 
    try {
        for (const noteId of folder.notes) {
            const note = await Note.findById(noteId);
            if (note) {
                await deleteNoteDependencies(note);
                await note.save();
            }
        }
        await Note.deleteMany({ _id: { $in: folder.notes } });  //delete all the notes in the folder
    }
    catch (error) {
        throw new Error('Error processing folder deletion: ' + error);
    }
}



//3.    An helper function to deleted dependencies of a note before deleting it permanently
const deleteNoteDependencies = async function(note) {
    try {
        const topicToBeUpdated = await Topic.findById(note.topic_id);
        const folderToBeUpdated = await Folder.findById(note.folder_id);
        if (topicToBeUpdated) {
            topicToBeUpdated.notes.pull(note._id);
            await topicToBeUpdated.save();
        }
        if (folderToBeUpdated) {
            folderToBeUpdated.notes.pull(note._id);
            await folderToBeUpdated.save();
        }
        const user = await User.findById(note.created_by);
        user.notes.pull(note._id);
        await user.save();
    }
    catch (error) {
        throw new Error('Error processing folder deletion: ' + error);
    }
};



//4.  Function to Delete a folder automatically after desired time
cron.schedule('*/20 * * * * *', async () => {
    try {
        const twentySecAgo = new Date();
        twentySecAgo.setSeconds(twentySecAgo.getSeconds() - 20);

        const folders = await Folder.find({ deleted: true, deletedAt: { $lt: twentySecAgo } });
        for (const folder of folders) {
          await deleteFolderDependencies(folder);
          await Folder.deleteOne({ _id: folder._id });
          console.log("Deleted folder from trash bin: " + folder._id);  //Notify If needed
        }

        const notes = await Note.find({ deleted: true, deletedAt: { $lt: twentySecAgo } })
        for (const note of notes) {
            await deleteNoteDependencies(note);
            await Note.deleteOne({ _id: note._id });
            console.log("Deleted note from trash bin: " + note._id);  //Notify If needed
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

        const notes = await Note.find({ deleted: true, deletedAt: { $lt: fifteenDaysAgo } })
        for (const note of notes) {
            await deleteNoteDependencies(note);
            await Note.deleteOne({ _id: note._id });
            console.log("Deleted note from trash bin: " + note._id);  //Notify If needed
        }
    } catch (error) {
        console.error('Error deleting folders from trash bin:', error);
    }
});
*/


//5.    Function to view Archives
const viewArchive = async function () {
    try {
        const { userId } = req.body
        const folders = await Folder.find({ deleted: false, archived: true, created_by: userId });
        const notes = await Note.find({ deleted: false, archived: true, created_by: userId })
        return res.status(200).json({ folders: folders, notes: notes })
    }
    catch (error) {
        return res.status(404).json({message:"server error"})
    }
}


//6.    Function to view Trashbin
const viewTrash = async function () {
    try {
        const { userId } = req.body
        const folders = await Folder.find({ deleted: true, created_by: userId});
        const notes = await Note.find({ deleted: true, created_by: userId })
        return res.status(200).json({folders:folders, notes:notes})
    }
    catch (error) {
        return res.status(404).json({message:"server error"})
    }
}


//7.    Function to view all documents
const viewAllDocs = async function () {
    try {
        const { userId } = req.body
        const folders = await Folder.find({ deleted: false, archived: false, topic_id:null, created_by: userId});
        const notes = await Note.find({ deleted: false, archived:false,topic_id:null, created_by: userId }).slice(6)
        return res.status(200).json({folders:folders, notes:notes})
    }
    catch (error) {
        return res.status(404).json({message:"server error"})
    }
}

//8     Function to view all documents in a topic
const viewAllDocsinTopic = async function () {
    try {
        const { userId, topicId } = req.body
        const folders = await Folder.find({ deleted: false, archived: false, topic_id:topicId, created_by: userId});
        const notes = await Note.find({ deleted: false, archived:false,topic_id:topicId, folder_is:null, created_by: userId }).slice(6)
        return res.status(200).json({folders:folders, notes:notes})
    }
    catch (error) {
        return res.status(404).json({message:"server error"})
    }
}

//9. Create


module.exports = { deleteFolderDependencies, deleteNoteDependencies, deleteNotesInFolder }




