
// const GoogleStrategy = require('passport-google-oauth20').Strategy
// const passport =require('passport');


// passport.use(
//     new GoogleStrategy({
//         clientID:process.env.CLIENT_ID,
//         clientSecret:process.env.CLIENT_SECRET,
//         callbackURL:'http://localhost:4000/auth/google/callback',
//         scope:['profile','email']
//     },
//     function (accessToken,refreshToken,profile,callback) {
//         console.log('profile Data');
//         console.log(process.env.CLIENT_ID),
//         // console.log("wwwiii",profile);
//         callback(null,profile)
//     }
// ))

// passport.serializeUser((user,done)=>{
//     done(null,user)
// })

// passport.deserializeUser((user,done)=>{
//     done(null,user)
// })



const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;

passport.use(
    new GoogleStrategy(
        {
            clientID: process.env.CLIENT_ID,
            clientSecret: process.env.CLIENT_SECRET,
            // callbackURL: 'http://localhost:5000/auth/google/callback' 
            callbackURL: 'https://www.elixir-aura.shop/auth/google/callback' 
        },
        function (accessToken, refreshToken, profile, done) {
            console.log('Google Profile:', profile);
            done(null, profile); // This makes `req.user = profile`
        }
    )
);

// Serialize user to session
passport.serializeUser((user, done) => {
    done(null, user);
});

// Deserialize user from session
passport.deserializeUser((user, done) => {
    done(null, user);
});
