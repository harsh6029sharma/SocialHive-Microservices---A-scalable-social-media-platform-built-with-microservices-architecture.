const Post = require('../models/post')
const logger = require('../utils/logger');
const { publishEvent } = require('../utils/rabbitmq');
const { validateCreatePost } = require('../utils/validation');
const mongoose = require('mongoose')


async function invalidatePostCache(req, input) {

    const cachedKey = `post:${input}`; // this input is the id passing from parameter
    await req.redisClient.del(cachedKey);

    const keys = await req.redisClient.keys('posts:*');
    if (keys.length > 0) {
        await req.redisClient.del(keys);
    }
}

//create posts
const createPost = async (req, res) => {
    logger.info('Create post endpoint hit...')
    try {
        //validate the schema 
        const { error } = validateCreatePost(req.body);

        if (error) {
            logger.warn('Validation error', error.details[0].message)
            return res.status(400).json({
                success: false,
                message: error.details[0].message
            })
        }

        //creating the post
        const { content, mediaIds } = req.body
        const newlyCreatedPost = await Post({
            user: req.user.userId,
            content,
            mediaIds: mediaIds || []
        })

        await newlyCreatedPost.save();

        //publishing the event when the post created using rabbit mq
        //but this event is consumed by search-service using rabbit mq to show the post
        await publishEvent('post.created', {
            postId: newlyCreatedPost._id.toString(),
            userId: newlyCreatedPost.user.toString(),
            content: newlyCreatedPost.content,
            createdAt: newlyCreatedPost.createdAt
        })


        await invalidatePostCache(req, newlyCreatedPost._id.toString())

        logger.info('Post created successfully', newlyCreatedPost)
        res.status(201).json({
            success: true,
            message: 'Post created successfully'
        })

    } catch (e) {
        logger.error('Error while creating post', e)
        res.status(500).json({
            success: false,
            message: 'Error while creating post'
        })
    }
}

//fetching all created posts
const getAllPosts = async (req, res) => {
    try {
        //doing pagination
        const page = parseInt(req.query.page) || 1; //checking if page no. is passing or by default is 1
        const limit = parseInt(req.query.limit) || 10;
        const startIndex = (page - 1) * limit;

        const cacheKey = `posts:${page}:${limit}`;
        const cachedPosts = await req.redisClient.get(cacheKey);

        if (cachedPosts) {
            return res.json(JSON.parse(cachedPosts))
        }

        const posts = await Post.find({})
            .sort({ createdAt: -1 })
            .skip(startIndex)
            .limit(limit);

        const totalNoOfPosts = await Post.countDocuments();

        const result = {
            posts,
            currentPage: page,
            totalPages: Math.ceil(totalNoOfPosts / limit),
            totalPosts: totalNoOfPosts
        }

        //we need to save our posts in our redis cache 
        await req.redisClient.setex(cacheKey, 300, JSON.stringify(result));

        res.json(result);

    } catch (e) {
        logger.error('Error while fetching all posts', e)
        res.status(500).json({
            success: false,
            message: 'Error while fetching all posts'
        })
    }
}


//get or fetching a single post 
const getPost = async (req, res) => {
    try {

        const postId = req.params.id;
        const cacheKey = `post:${postId}`;
        const cachedPosts = await req.redisClient.get(cacheKey);

        if (cachedPosts) {
            return res.json(JSON.parse(cachedPosts))
        }

        const singlePostDetailsById = await Post.findById(postId);

        if (!singlePostDetailsById) {
            return res.status(404).json({
                message: 'Post not found',
                success: false
            })
        }

        await req.redisClient.setex(cacheKey, 3600, JSON.stringify(singlePostDetailsById));
        return res.json(singlePostDetailsById);

    } catch (e) {
        logger.error('Error while fetching a post', e)
        res.status(500).json({
            success: false,
            message: 'Error while fetching a post'
        })
    }
}


//deleting post
const deletePost = async (req, res) => {
    try {
        const postId = req.params.id;

        console.log('postid:',postId);
        
        const post = await Post.findOneAndDelete({
            _id: req.params.id.toString(),
            user: req.user.userId
        })

        if (!post) {
            return res.status(404).json({
                message: 'Post not found',
                success: false,
            })
        }

        //publish post delete method
        await publishEvent('post.deleted', {
            postId: post._id.toString(),
            userId: req.user.userId,
            mediaIds: post.mediaIds
        })

        await invalidatePostCache(req, req.params.id);

        return res.json({
            message: 'Post deleted successfully!'
        })

    } catch (e) {
        logger.error('Error while deleting post', e);
        res.status(500).json({
            success: false,
            message: 'Error while deleting post'
        })
    }
}

module.exports = { createPost, getAllPosts, getPost, deletePost }