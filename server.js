const bodyParser = require('body-parser');
const express = require('express');
const path = require('path');
const { getLessonsCollection, getLessonsConnection} = require('./src/db');
//const {MongoClient} = require('mongodb');

const app = express();
const PORT= 8090;

app.use(bodyParser.json());

app.use('/', express.static(path.join(__dirname, 'public')));

const getAllLessonsJson = async () => {
  try {
    let _lessons = await getLessonsConnection();
    const allLessons = await _lessons.find().toArray();
    return allLessons;
  } catch (err) {
    console.error("Error occured while trying to get lessons .", err);
  }
}

app.get("/lessons", async (req, res) => {
  let _lessonsArr = await getAllLessonsJson();
  return res.status(200).json(_lessonsArr);
})

app.listen(PORT, () => console.log(`Listening on ${PORT}`));

