// In your route handler
router.get('/ppulists', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 10; // Number of items per page
        const skip = (page - 1) * limit;
        
        // Build query for search if needed
        let query = {};
        if (req.query.search) {
            query = {
                $or: [
                    { title: { $regex: req.query.search, $options: 'i' } },
                    { description: { $regex: req.query.search, $options: 'i' } }
                ]
            };
        }
        
        // Get total count for pagination
        const total = await Ppulist.countDocuments(query);
        const totalPages = Math.ceil(total / limit);
        
        // Get paginated results
        const allPpulists = await Ppulist.find(query)
            .sort({ time: -1 })
            .skip(skip)
            .limit(limit);
        
        res.render('ppulists/index', {
            allPpulists,
            currentPage: page,
            totalPages,
            searchQuery: req.query.search
        });
    } catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
    }
});