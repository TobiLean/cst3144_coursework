require('dotenv').config();
const {MongoClient} = require('mongodb');

const uri = `mongodb+srv://tobilobatsl:${process.env.MONGODB_ATLAS_PASSWORD}@cluster0.dxbm5ek.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`

const connectToMongo = async () => {
  try {
    const client = new MongoClient(uri);
    await client.connect();
    const _db = client.db('cst3144_cw');
    // _lessons = _db.collection('lessons');
    console.log("connected to mongo successfully");
    return _db;
  } catch (err) {
    console.error(err);
  }
}

const getLessonsConnection = async () => {
  let db = await connectToMongo();
  return db.collection('lessons');
}

module.exports = {getLessonsConnection, connectToMongo};