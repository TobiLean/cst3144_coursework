const bodyParser = require('body-parser');
const express = require('express');
const path = require('path');
const {MongoClient} = require('mongodb');

const app = express();
const PORT= 8090;

app.use(bodyParser.json());

app.use('cw', express.static(path.join(__dirname, 'public')))

