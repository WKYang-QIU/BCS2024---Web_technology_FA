const express = require('express')
const mysql = require('mysql2')
const db = require('./config/database');
require('dotenv').config()

const app = express()

app.use(express.json())
app.use(express.urlencoded({extended: true }))
app.use(express.static('public'))

app.get('/', (req, res) => {
    res.send("Server running")
})

app.listen(3000, () => {
    console.log("Server started at http://localhost:3000")
})

db.query('SELECT 1')
  .then(() => console.log("Database connected"))
  .catch(err => console.error(err));