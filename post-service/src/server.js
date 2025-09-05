require('dotenv').config();
const express = require('express')
const mongoose = require('mongoose')
const helmet = require('helmet')
const Redis = require('ioredis')
const cors = require('cors')

const postRoutes = require('./routes/post-routes')
const errorHandler = require('./middleware/errorHandler')
const logger = require('./utils/logger');
const connectWithRetry = require('./database/db');
const { connectToRabbitMQ } = require('./utils/rabbitmq');

const app = express()

const PORT = process.env.PORT || 3002

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


//routes -> pass redisClient to routes
app.use('/api/posts', (req, res, next) => {
    req.redisClient = redisClient
    next();
}, postRoutes)


app.use(errorHandler)

async function startServer() {
    try {
        await connectToRabbitMQ()
        app.listen(PORT, () => {
            logger.info(`Post service running on port: ${PORT}`)
        })  
    } catch (error) {
        logger.error('Failed to connect to server!',error)
        process.exit(1);
    }
}

startServer();


//unhandled promise rejection
process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection at ', promise, ' reason: ', reason);
}) 