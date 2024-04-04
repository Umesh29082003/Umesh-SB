const Note = require('./noteModel')
const Folder = require('.././Folder/folderModel')
const User = require('.././User/userModel')
const Topic = require('.././Topic/topicModel')

//1     Function to Create and Svae a Note // Dont require folder id
exports.saveNote = async (req, res) => {
    try {
        const { title, content, folderId, topicId, userId } = req.body;
        const user = await User.findById(userId);
        const note = await Note.findOne({ title: title, created_by: userId });

        let topic_id = null;
        let folder_id = null;
        let folder;
        let topic;

        if (folderId && topicId) {
            return res.json({ message: "Provide either folderId or topicId, not both" });
        }

        if (note) {

            if (folderId) {    //wishing to create a note inside a folder
                folder = await Folder.findOne({ created_by: userId, _id: folderId });
                const noteInFolder = await Note.findOne({ created_by: userId, folder_id: folderId })
                if (noteInFolder) {
                    if (noteInFolder.deleted || noteInFolder.archived) {
                        return res.status(200).json({ message: 'Note with same name from this folder already exist, check trash or archives' });
                    }
                    else {
                        return res.status(200).json({ message: 'Note already exists in the folder' });
                    }
                }
                topic_id = folder.topic_id
                folder_id = folderId
            }
            else if (topicId) { //Wishing to create a note in a topic
                topic = await Topic.findOne({ created_by: userId, _id: topicId });
                const folderInTopic= (topic.folders).filter(item=>item.toString());
                const noteInTopic = await Note.findOne({
                    created_by: userId,
                    topic_id: topicId,
                    folder_id: { $nin: folderInTopic }
                })
                if (noteInTopic) {
                    if (noteInTopic.deleted || noteInTopic.archived) {
                        return res.status(200).json({ message: 'Note with same name from this topic already exist, check trash or archives' });
                    }
                    else {
                        return res.status(200).json({ message: 'Note already exists in the topic' });
                    }
                }
                topic_id = topicId
            }
            else {  //Wanna create a note outside
                const existingNote = await Note.findOne({created_by: userId, folder_id:null, topic_id:null, title: title })
                if (existingNote)
                {
                    if (existingNote.deleted || existingNote.archived) {
                        return res.status(200).json({ message: 'Note with same name already exist, check trash or archives' });
                    }
                    else {
                        return res.status(200).json({ message: 'Note already exists' });
                    }
                }
            }
        }
        else {
            if (folderId) { 
                folder_id = folderId
                folder = await Folder.findOne({ created_by: userId, _id: folderId });
            }
            else if (topicId) {
                topic_id = topicId
                topic = await Topic.findOne({ created_by: userId, _id: topicId });
            }
        }
        const newNote = new Note({
            title,
            content,
            folder_id,
            created_by: userId,
            topic_id
        });

        await newNote.save();
        user.notes.push(newNote._id);
        if (newNote.folder_id) {
            folder.notes.push(newNote._id);
            await folder.save();
        }
        if (newNote.topic_id) {
            const updateTopic = await Topic.findOne({ created_by: userId, _id: newNote.topic_id })
            updateTopic.notes.push(newNote._id);
            await updateTopic.save();
        }
        await user.save();
        res.status(200).json({ message: 'Note created successfully' });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};


//2.    Function to View Content of a Note
exports.viewNote = async (req, res) => {
    try {
        const { noteId, userId} = req.body;
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


//3.    Function to Update a Note
exports.updateNote = async (req, res) => { 
    try {
        const { noteId, content, userId } = req.body;
        const note = await Note.findById(noteId);
        if (!note) {
            res.status(404).json({ message: 'Note not found' });
        }
        else {
            note.content = content;
            note.updated_at = Date.now();
            await note.save();
            const user = await User.findById(note.created_by);
            user.notes.sort((a, b) => b.updated_at - a.updated_at);
            await user.save();
            res.status(200).json({message:'Note Updated Successfully',content:note.content});
        }
    }
    catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
}

//4.    Function to Delete a Note
exports.deleteNote = async (req, res) => {
    try {
        const { noteIds, userId } = req.body;

        // Find the folders
        const notes = await Note.find({ _id: { $in: noteIds } }); //array of folders

        for (const note of notes) { //loop over the array of folders
            if (!note) {
                console.log('Note not found');
                continue; //continue if invalid folderId
            }

            // Mark the folder as deleted
            note.deleted = true;
            note.deletedAt = new Date();  //update time of deletion
            await note.save();

            res.status(200).json({
                message: 'Note deleted and added to thrashbin',
            });
        }
    }
  catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

//5.    Function to Archive a Note
exports.archiveNote = async (req, res) => {
    try {
        const { noteIds, userId } = req.body;

        // Find the folders
        const notes = await Note.find({ _id: { $in: noteIds } }); //array of folders

        for (const note of notes) { //loop over the array of folders
            if (!note) {
                console.log('Note not found');
                continue; //continue if invalid folderId
            }

            // Mark the folder as deleted
            note.archived = true;
            await note.save();

            res.status(200).json({
                message: 'Note archived',
            });
        }
    }
  catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};


//6.    Function to Recover a Note
exports.recoverNote = async (req, res) => {
     try {
        const { noteIds, userId } = req.body;

        // Find the folders
        const notes = await Note.find({ _id: { $in: noteIds } }); //array of folders

        for (const note of notes) { //loop over the array of folders
            if (!note) {
                console.log('Note not found');
                continue; //continue if invalid folderId
            }

            // Mark the folder as deleted
            note.deleted = false;
            note.deletedAt =null
            await note.save();

            res.status(200).json({
                message: 'Note recovered',
            });
        }
    }
  catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

//7.    Function to Unarchive a Note
exports.unarchiveNote = async (req, res) => {
    try {
        const { noteIds, userId } = req.body;

        // Find the folders
        const notes = await Note.find({ _id: { $in: noteIds } }); //array of folders

        for (const note of notes) { //loop over the array of folders
            if (!note) {
                console.log('Note not found');
                continue; //continue if invalid folderId
            }

            // Mark the folder as deleted
            note.archived = false;
            await note.save();

            res.status(200).json({
                message: 'Note deleted and added to thrashbin',
            });
        }
    }
  catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

//Function to Add Note to a Topic //

