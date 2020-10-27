require('dotenv').config()
const express = require("express");
const flash = require("connect-flash");
const app = express();
const axios = require("axios");
const path = require("path");

app.use(flash());
app.use(require("express-session")({
    secret:"I'm the best",
    resave:false,
    saveUninitialized:false
}));

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "/views"));
app.use(express.static(path.join(__dirname, '/public')));
app.use(express.urlencoded({extended:true}));
app.use(express.json());

app.use(function(req,res,next){
    res.locals.error=req.flash("error");
    next();
})

class AppError extends Error {
    constructor(message, status) {
        super();
        this.message = message;
        this.status = status;
    }
}

app.get('/', (req, res) => {
    res.render("index", {searched:false});
});

app.get('/show', async (req, res, next) => {
    const location = req.query.location;
    if(!location) {
        return next(new AppError("Enter the location!!", 400));
    }
    try {
        const locationURL = `https://api.mapbox.com/geocoding/v5/mapbox.places/${location}.json?access_token=${process.env.MAPBOX_APIKEY}&limit=1`;
        const mapboxRes = await axios.get(locationURL);
        const longitude =  await mapboxRes.data.features[0].center[0].toFixed(3);
        const latitude = await mapboxRes.data.features[0].center[1].toFixed(3);
        const weatherstackURL = `http://api.weatherstack.com/current?access_key=${process.env.WEATHERSTACK_APIKEY}&query=${latitude},${longitude}`;
        const weatherData = await axios.get(weatherstackURL);
        if(weatherData.data.sucess && weatherData.data.success === false) {
            return next(new AppError("Request Failed", 400));
        }
        const data = weatherData.data;
        const dateAndTime = data.location.localtime.split(" ");
    
        res.render("index", {searched: true, data, time:dateAndTime[1], location});
    }catch(e) {
        return next(new AppError("There may be some problem on the server side or your connectivity might be poor!", 500));
    }
})

app.all('*', (req, res) => {
    res.render("404page");
})

app.use((err, req, res, next) => {
    req.flash("error", err.message);
    res.redirect('/');
    next();
})

app.listen(process.env.PORT || 3000, () => {
    console.log("server started at port 3000");
})