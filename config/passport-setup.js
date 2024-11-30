
const GoogleStrategy = require('passport-google-oauth20').Strategy
const passport =require('passport');


passport.use(
    new GoogleStrategy({
        clientID:process.env.CLIENT_ID,
        clientSecret:process.env.CLIENT_SECRET,
        callbackURL:'http://localhost:4000/auth/google/callback',
        scope:['profile','email']
    },
    function (accessToken,refreshToken,profile,callback) {
        console.log('profile Data');
        console.log(process.env.CLIENT_ID),
        // console.log("wwwiii",profile);
        callback(null,profile)
    }
))

passport.serializeUser((user,done)=>{
    done(null,user)
})

passport.deserializeUser((user,done)=>{
    done(null,user)
})