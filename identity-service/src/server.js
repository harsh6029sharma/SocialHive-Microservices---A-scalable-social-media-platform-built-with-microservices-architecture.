require('dotenv').config()
const mongoose = require('mongoose')
const express = require('express')
const connectWithRetry = require('./database/db')
const helmet = require('helmet')
const cors = require('cors')
const logger = require('./utils/logger')
const {RateLimiterRedis} = require('rate-limiter-flexible');
const Redis = require('ioredis')
const {rateLimit} = require('express-rate-limit')
const {RedisStore} = require('rate-limit-redis')
const routes = require('./routes/identity-service')
const errorHandler = require('./middleware/errorHandler')

const app = express();
const PORT = process.env.PORT||3001;

//connect to mongoDB
connectWithRetry()

const redisClient= new Redis(process.env.REDIS_URL)

//middlewares
app.use(helmet())
app.use(cors())
app.use(express.json())
app.set('trust proxy', 1); // 1 = first proxy (Railway, Heroku, etc.)

//logging middleware
app.use((req,res,next)=>{
    logger.info(`Received ${req.method} request to ${req.url}`)
    logger.info(`Request body, ${req.body}`)
    next();
})

//use rate-limiter-flexible for DDOS protection
const rateLimiter = new RateLimiterRedis({
    storeClient: redisClient,
    keyPrefix: 'middleware',
    points: 10, //max number of request your ip address user can make in a given period of time
    duration: 1
})


app.use((req,res,next)=>{
    rateLimiter.consume(req.ip)
    .then(()=> next())
    .catch(()=> {
        logger.warn(`Rate limit exceeded for IP: ${req.ip}`);
        res.status(429).json({success:false, message:'Too many requests'});
    })
})

//ip based rate limiting for sensitive endpoints 
const sensitiveEndpointsLimiter = rateLimit({
    windowMs : 15*60*1000,//15 minutes
    max : 50,
    standardHeaders : true,
    legacyHeaders: false,
    handler: (req,res)=>{
        logger.warn(`Sensitive endpoint rate limit exceeded for IP: ${req.ip}`);
        res.status(429).json({
            success:false,
            message:'Too many requests'
        })
    },
    store: new RedisStore({
        sendCommand: (...args) => redisClient.call(...args),
    }),
})


//apply this sensitiveEndpointsLimiter to our routes
app.use('/api/auth/register',sensitiveEndpointsLimiter);

//Routes 
app.use('/api/auth',routes)

//error handler 
app.use(errorHandler)

app.listen(PORT, ()=>{
    logger.info(`Identity service running on port: ${PORT}`)
})

//unhandled promise rejection
process.on('unhandledRejection', (reason, promise)=>{
    logger.error('Unhandled Rejection at ', promise,' reason: ',reason);
})