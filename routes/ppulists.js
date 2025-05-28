router.get('/ppulists', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 10;
        const skip = (page - 1) * limit;

        let query = {};
        const search = req.query.search?.trim();
        if (search) {
            query = {
                $or: [
                    { title: { $regex: search, $options: 'i' } },
                    { description: { $regex: search, $options: 'i' } }
                ]
            };
        }

        const total = await Ppulist.countDocuments(query);
        const totalPages = Math.ceil(total / limit);

        const allPpulists = await Ppulist.find(query)
            .sort({ time: -1 })
            .skip(skip)
            .limit(limit);

        res.render('ppulists/index', {
            allPpulists,
            currentPage: page,
            totalPages,
            searchQuery: search 
        });
    } catch (err) {
        console.error('Error fetching PPU lists:', err);
        res.status(500).send("Server Error");
    }
});