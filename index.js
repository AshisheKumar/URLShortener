const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const {connectToMongoDB} = require('./connect');
const {checkForAuthenctication, restrictTo} = require('./middlewares/auth'); 
const app = express();
const PORT=8001;

const urlRoute = require('./routes/url');
const staticRouter = require('./routes/staticRouter');
const URL = require('./models/url');
const userRoute = require('./routes/user');

connectToMongoDB("mongodb://localhost:27017/short-url")
.then(()=> console.log("MongoDB Connected"))
.catch( err => console.log(err));

app.set("view engine", "ejs");
app.set("views", path.resolve("./views"));

app.use(express.json());
app.use(express.urlencoded({extended : false}));
app.use(cookieParser());
app.use(checkForAuthenctication);

app.use("/url", restrictTo(["NORMAL","ADMIN"]), urlRoute);
app.use("/user",userRoute);
app.use("/",staticRouter);

app.get('/url/:shortId', async (req, res) => {
    const shortId = req.params.shortId;
    try {
        const entry = await URL.findOneAndUpdate(
            { shortId },
            {
                $push: {
                    visitHistory: {
                        timestamp: Date.now(),
                    },
                },
            },
            { new: true } 
        );

        if (!entry) {
            return res.status(404).send("Short URL not found.");
        }

        res.redirect(entry.redirectURL);
    } catch (error) {
        console.error(error);
        res.status(500).send("An error occurred.");
    }
});


app.listen(PORT, ()=> {console.log(`Serer running at port ${PORT}`)});