const logger = require('../utils/logger')
const Media = require('../models/Media')
const {deleteMediaFromCloudinary} = require('../utils/cloudinary')

const handlePostDeleted = async(event) =>{
    console.log(event, 'eventeventevent');
    const {postId, mediaIds} = event;
    try{
        const mediaToDelete = await Media.find({_id:{$in: mediaIds}});

        for(const media of mediaToDelete){
            await deleteMediaFromCloudinary(media.publicId);  //delete media from cloudinary
            await Media.findByIdAndDelete(media._id)   //delete media from database

            logger.info(`Deleted media ${media._id} associated with this deleted post ${post}`)
        }

        logger.info(`processed deletion of media for post id ${postId}`)

    }catch(e){
        logger.error('Error occured while media deletion',e);
    }
}

module.exports = {handlePostDeleted}