// const mongoose = require('mongoose')
// const logger = require('../utils/logger')

// const connectToDB = async() =>{
//     await mongoose.connect(process.env.MONGODB_URI)
//     .then(()=> logger.info('Connected to mongodb successfully!'))
//     .catch((e)=>logger.error('Mongodb connection error!',e))
    
// }

// module.exports = connectToDB
const connectWithRetry = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 10000,
    });
    logger.info('MongoDB connected successfully!');
  } catch (err) {
    logger.error('MongoDB connection failed, retrying in 5s...', err);
    setTimeout(connectWithRetry, 5000);
  }
};

connectWithRetry();
