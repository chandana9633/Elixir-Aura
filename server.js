require('dotenv').config();
const express=require("express")
const multer = require('multer');
const path=require("path")
const userRouter=require('./server/routers/user/userRoute')
const admminRouter=require('./server/routers/admin/adminRoute')
const concectDB=require('./config/dbConnection')
const passport = require('passport');
const session=require("express-session")
const {v4:uuidv4}=require("uuid")
const bodyParser = require('body-parser');
const MongoStore = require('connect-mongo')
const { log } = require('console');

const app=express()

app.use(express.json())

// app.use(session({
//     secret:uuidv4(),
//     resave:false,
//     saveUninitialized:false,
//     cookie:{secure:false,
//     maxAge: 5 * 60 * 1000}
// }))
app.use(session({
    secret: process.env.SESSION_SECRET || 'fallback-secret-key',
    resave: false,
    saveUninitialized: false, 
    store: MongoStore.create({ mongoUrl: process.env.DB_URI }), 
    cookie: { 
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      secure: false, // Use HTTPS in production
      httpOnly: true, // Helps prevent XSS attacks
      sameSite: 'strict' // Helps prevent CSRF attacks
    }
  }));
  
//-----------------set view engine-------------------
app.set("view engine","ejs")
console.log("osdhoihlkdsghpidshg");

require('./config/passport-setup');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.use((req, res, next) => {
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    next();
  });

const PORT=process.env.PORT || 5000

//MongoDB connection

concectDB()

app.use(express.static(path.join(__dirname,'public')))
app.use(express.static(path.join(__dirname,'public/userHome')));
app.use(express.static(path.join(__dirname,'public/adminHome')));


app.use('/',userRouter)
app.use('/admin/',admminRouter)



app.listen(PORT,()=>{
    console.log(`server is running at http://localhost:${PORT}`)
})



