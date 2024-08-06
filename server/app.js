const express = require('express')
const bodyParser = require('body-parser')
const cors = require('cors');
const path = require('path');

const app = express()
const port = 5000

app.use(bodyParser.urlencoded({ extended: true }))
app.use(cors());

// Routes
const questionRouter = require('./src/routes/questions')
app.use('/', questionRouter)

// Listen on port 5000
app.listen(process.env.PORT || port, () => console.log(`Listening on port ${port}`))