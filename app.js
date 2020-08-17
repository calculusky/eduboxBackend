require('dotenv').config();
const path = require('path');
const mongoose = require('mongoose');
const express = require('express');
const app = express();

//import all routes
const studentRoutes = require('./routes/student');
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

//import routes
app.use('/api', studentRoutes);

//handle errors
app.use((error, req, res, next) => {
   const statusCode =  error.statusCode || 500;
   const errorMessage = error.message;
   const validationErrors = error.data || null;
   res.status(statusCode).json({errorMessage: errorMessage, statusCode: statusCode, validationErrors: validationErrors})
})

//connect the app to db
mongoose
  .connect('mongodb://localhost:27017/edubox', { useNewUrlParser: true, useUnifiedTopology: true })
  .then(conn => {
      const port = process.env.PORT || 8080;
      app.listen(port, () => `Server running on port ${port}`);
      console.log(`connection successful at port: ${port}`)
  })
  .catch(err => {
      console.log('database connection failed', err)
  })

