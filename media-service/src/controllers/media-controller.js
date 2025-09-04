const logger = require('../utils/logger')
const {uploadMediaToCloudinary} = require('../utils/cloudinary')
const Media = require('../models/Media'); 

const uploadMedia = async(req,res)=>{
    logger.info('Starting media upload')
    try{
        //if file is not present inside the request body then throw error
        console.log(req.file,'this is req.file');
        if(!req.file){
            logger.error('No file found.Please add a file and try again!')
            return res.status(404).json({
                success:false,
                message:'No file found.Please add a file and try again!'
            })
        }

        const {originalname, mimetype, buffer} = req.file;
        const userId = req.user.userId;  // we take it from authMiddleware -> req.user = {userId}

        logger.info(`File details: name=${originalname}, type=${mimetype}`)
        logger.info(`Uploading to cloudinary starting...`)

        const cloudinaryUploadResult = await uploadMediaToCloudinary(req.file)
        logger.info(`Cloudinary upload successfully. public Id: - ${cloudinaryUploadResult.public_id}`);

        const newlyCreatedMedia = new Media({
            publicId:cloudinaryUploadResult.public_id,
            originalName:originalname,
            mimeType:mimetype,
            url:cloudinaryUploadResult.secure_url,
            userId,
        })

        await newlyCreatedMedia.save()

        res.status(201).json({
            success:true,
            mediaIds:newlyCreatedMedia._id,
            url: cloudinaryUploadResult.url,
            message: 'Media upload is successfully!'
        })
 
    }catch(e){
        logger.error('Error while uploading media to cloudinary due to internal server error')
        return res.status(500).json({
            success:false,
            message:'Error while uploading media to cloudinary due to internal server error'
        })
    }
}

const getAllMedias = async(req,res)=>{
    try{

        const results = await Media.find({});
        res.json({results})

    }catch(e){

        logger.error('Error while fetching medias')
        res.status(500).json({
            success:false,
            message:'Error while fetching medias!'
        })
    }
}

module.exports = {uploadMedia, getAllMedias}