const bodyParser = require('body-parser');
const express = require('express');
const path = require('path');
const { getLessonsCollection, getLessonsConnection} = require('./src/db');
//const {MongoClient} = require('mongodb');

const app = express();
const PORT= 8090;

app.use(bodyParser.json());

app.use('/cw', express.static(path.join(__dirname, 'public')));

const main = async () => {
  try {
    const _lessons = await getLessonsConnection();
    const allLessons = await _lessons.find().toArray();
    console.log(allLessons)
  } catch (err) {
    console.error("Error occured while trying to get lessons .", err);
  }
}

main();

app.listen(PORT, () => console.log(`Listening on ${PORT}`));

