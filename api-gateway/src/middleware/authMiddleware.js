const logger = require("../utils/logger");
const jwt = require('jsonwebtoken')

const validateToken = (req,res,next)=>{
    const authHeader = req.headers['authorization']; //we are extracting bearer token from the headers of request
    const token = authHeader && authHeader.split(" ")[1];   // why we split token? because token has two parts: [bearer <token>] and token is the second element on index 1
    
    if(!token){
        logger.warn('Access attempt without valid token')
        return res.status(401).json({
            message:'Authentication required! Please login to continue',
            success:false
        })
    }

    jwt.verify(token, process.env.JWT_SECRET, (err,user)=>{
        if(err){
            logger.warn('Invalid token!');
            return res.status(401).json({
                message:'Invalid token!',
                success:false
            })
        }
        req.user = user;
        next()
    })
}

module.exports = {validateToken}