module.exports = (req, res, next) => {
    if (req.isAuthenticated()) {
        return next();
    }
    res.status(401).json({ error: "Unauthorized! Please log in." });
    // res.sendFile(__dirname + "../public/login.html");
};
