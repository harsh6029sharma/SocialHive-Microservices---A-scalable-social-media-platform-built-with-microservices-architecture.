require('dotenv').config();
const express = require('express')
const mongoose = require('mongoose')
const helmet = require('helmet')
const Redis = require('ioredis')
const cors = require('cors')
const errorHandler = require('./middleware/errorHandler')
const logger = require('./utils/logger');
const connectWithRetry = require('./database/db');
const { connectToRabbitMQ, consumeEvent } = require('./utils/rabbitmq');
const searchRoutes = require('./routes/search-routes');
const { handlePostCreated } = require('./eventHandlers/search-event-handler');
const { handlePostDeleted } = require('./eventHandlers/search-event-handler');

const app = express()

const PORT = process.env.PORT || 3004

//connect to database mongodb
connectWithRetry()

const redisClient = new Redis(process.env.REDIS_URL)

//middlewares
app.use(helmet())
app.use(cors())
app.use(express.json())

//logging middleware
app.use((req, res, next) => {
    logger.info(`Received ${req.method} request to ${req.url}`)
    logger.info(`Request body, ${req.body}`)
    next();
})

//It is for future work -> implementing ip based rate limiting for sensitive endpoints like -> creatPost,getAllPosts

// future work -> pass redis client as part of our req and then implement redis caching  

app.use('/api/search', searchRoutes)

app.use(errorHandler)

async function startServer(){
    try{

        await connectToRabbitMQ();

        //consume the events / subscribe to the events 
        await consumeEvent('post.created', handlePostCreated)
        await consumeEvent('post.deleted', handlePostDeleted)

         app.listen(PORT, () => {
            logger.info(`Search service running on port: ${PORT}`)
        })  
        
    }catch(e){
        logger.error('Failed to start search service');
        process.exit(1);
    }
}

startServer()

