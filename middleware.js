module.exports.isLoggedIn = (req, res, next) => {
    // console.log("req.path",req.path,"req.original url",req.originalUrl);
    if (!req.isAuthenticated()) {
        req.session.redirectUrl = req.originalUrl;
        req.flash("error", "you must be logged in on wonderlust");
        return res.redirect("/login");
    }
    next();
};