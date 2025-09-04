const logger = require("../utils/logger")
const Search = require('../models/Search')

const searchPostController = async(req,res)=>{
    logger.info('Search endpoint hit')
    try{
        const {query} = req.query;
        const results = await Search.find(
            {
                $text:{$search: query}
            },
            {
                score: {$meta: 'textScore'}
            }
        ).sort({ score: {$meta: 'textScore'}}).limit(10);

        res.json(results);
    }catch (e) {
        logger.error('Error while searhcing posts', e)
        res.status(500).json({
            success: false,
            message: 'Error while searching posts'
        })
    }
}

module.exports = {searchPostController}