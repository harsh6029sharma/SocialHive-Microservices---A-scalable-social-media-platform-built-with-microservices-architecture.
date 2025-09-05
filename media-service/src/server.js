require('dotenv').config();
const express = require('express')
const mongoose = require('mongoose')
const helmet = require('helmet')
const Redis = require('ioredis')
const cors = require('cors')
const mediaRoutes = require('./routes/media-routes')

const errorHandler = require('./middleware/errorHandler')
const logger = require('./utils/logger');
const connectWithRetry = require('./database/db');
const { connectToRabbitMQ, consumeEvent } = require('./utils/rabbitmq');
const { handlePostDeleted } = require('./eventHandlers.js/media-event-handlers');

const app = express()

const PORT = process.env.PORT || 3003;

connectWithRetry()

app.use(cors())
app.use(helmet())
app.use(express.json())


//logging middleware
app.use((req,res,next)=>{
    logger.info(`Received ${req.method} request to ${req.url}`)
    logger.info(`Request body, ${req.body}`)
    next();
})

//It is for future work -> implementing ip based rate limiting for sensitive endpoints like -> creatPost,getAllPosts

app.use('/api/media',mediaRoutes)

app.use(errorHandler)

async function startServer(){
     try {
        await connectToRabbitMQ()

        //consume all the events
        await consumeEvent('post.deleted', handlePostDeleted)

        app.listen(PORT, () => {
            logger.info(`Media service running on port: ${PORT}`)
        })  
    } catch (error) {
        logger.error('Failed to connect to server!',error)
        process.exit(1);
    }
}

startServer();

app.listen(PORT, ()=>{
    logger.info(`media service running on port: ${PORT}`)
})

//unhandled promise rejection
process.on('unhandledRejection', (reason, promise)=>{
    logger.error('Unhandled Rejection at ', promise,' reason: ',reason);
}) 


