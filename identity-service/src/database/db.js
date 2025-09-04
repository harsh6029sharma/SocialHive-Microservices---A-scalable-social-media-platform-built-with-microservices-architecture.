const mongoose = require('mongoose')
const logger = require('../utils/logger')

const connectToDB = async() =>{
    await mongoose.connect(process.env.MONGODB_URI)
    .then(()=> logger.info('Connected to mongodb successfully!'))
    .catch((e)=>logger.error('Mongodb connection error!',e))
    
}

module.exports = connectToDB