require('dotenv').config();
const path = require('path');
const mongoose = require('mongoose');
const passport = require('passport');
const cors = require('cors');
const express = require('express');
const app = express();

//import all routes
const authRoutes = require('./routes/auth');

//import files
const { googlePassportConfig } = require('./controllers/passport');


// **********  INITIALIZE MIDDLEWARES  *************//
app.set('view engine', 'ejs');
app.set('views', 'views');
app.use(cors());


//passport middlewares
app.use(passport.initialize());
app.use(passport.session());

//parse bodies
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// ***********************************************

//passport config
googlePassportConfig(passport);

//*************** ROUTES  **********************/
app.use('/auth', authRoutes);

//***************************************************/

//************ testing passport********* */
app.get('/login', (req, res) => {
    res.render('login')
})
app.get('/', (req, res) => {
        res.render('dashboard')
    })
    //************************************* */

//handle errors
app.use((error, req, res, next) => {
    const statusCode = error.statusCode || 500;
    const errorMessage = error.message;
    const validationErrors = error.data || null;
    res.status(statusCode).json({ errorMessage: errorMessage, statusCode: statusCode, validationErrors: validationErrors })
})

//connect the app to db
mongoose
    .connect(process.env.MONGO_DB_CONNECTION, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(conn => {
        const port = process.env.PORT || 8080;
        app.listen(port, () => `Server running on port ${port}`);
        console.log(`connection successful at port: ${port}`)
    })
    .catch(err => {
        console.log('database connection failed', err)
    })
