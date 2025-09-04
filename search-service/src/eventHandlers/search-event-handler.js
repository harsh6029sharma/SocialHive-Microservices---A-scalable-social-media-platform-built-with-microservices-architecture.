const Search = require('../models/Search')
const logger = require('../utils/logger')

async function handlePostCreated(event) {
    try {

        const newSearchPost = new Search({
            postId: event.postId,
            userId: event.userId,
            content: event.content,
            createdAt: event.createdAt
        })

        await newSearchPost.save()
        logger.info(`Search post created: ${event.postId}, ${newSearchPost._id.toString()}`)

    } catch (e) {
        logger.error('Error handling post creation event', e)
    }
}

//delete 
async function handlePostDeleted(event){
    try{

        await Search.findOneAndDelete({postId: event.postId})
        logger.info(`Search post created: ${event.postId}`)

    }catch(e){
        logger.error('Error handling post creation event', e)
    }
}

module.exports = {handlePostCreated, handlePostDeleted}