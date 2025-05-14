// In your routes file (e.g., routes/ppulists.js)
router.get('/', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10; // Default 10 posts per page
        
        // For first page, get all posts without pagination
        if (page === 1) {
            const ppulists = await Ppulist.find().sort({ time: -1 });
            return res.render('ppulists/index', {
                ppulists,
                currentPage: page,
                totalPages: 1, // Only show first page initially
                hasNextPage: ppulists.length >= limit,
                hasPrevPage: false
            });
        }
        
        // For subsequent pages, use normal pagination
        const skip = (page - 1) * limit;
        const totalPosts = await Ppulist.countDocuments();
        const ppulists = await Ppulist.find()
                                   .sort({ time: -1 })
                                   .skip(skip)
                                   .limit(limit);

        res.render('ppulists/index', {
            ppulists,
            currentPage: page,
            totalPages: Math.ceil(totalPosts / limit),
            hasNextPage: (limit * page) < totalPosts,
            hasPrevPage: page > 1
        });
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
});