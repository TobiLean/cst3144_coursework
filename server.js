const bodyParser = require('body-parser');
const express = require('express');
const path = require('path');
const { connectToMongo, getLessonsConnection} = require('./src/db');
const crypto = require('crypto');
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
    console.error("Error occurred while trying to get lessons .", err);
  }
}

app.get("/lessons", async (req, res) => {
  let _lessonsArr = await getAllLessonsJson();
  return res.status(200).json(_lessonsArr);
})

app.post("/order", async (req, res) => {
  let receivedOrder = req.body;
  let randomId = crypto.randomBytes(16).toString('hex');

  let orderObj = {}

  let customer = {
    "order_id": randomId,
    "customer_email": receivedOrder.user_email,
    "customer_name": receivedOrder.user_name,
    "customer_phone": receivedOrder.user_phone,
  }

  for (let i = 0; i < receivedOrder.cartItems.length; i++) {
    orderObj.order_id = randomId;
    orderObj.customer_email = receivedOrder.user_email
    orderObj.id = receivedOrder.cartItems[i].id
    orderObj.subject = receivedOrder.cartItems[i].subject
    orderObj.location = receivedOrder.cartItems[i].location
    orderObj.rating = receivedOrder.cartItems[i].rating
    orderObj.price = receivedOrder.cartItems[i].price
    orderObj.spaces = receivedOrder.cartItems[i].spaces
    orderObj.image = receivedOrder.cartItems[i].image
    orderObj.promo_code = receivedOrder.promo_code
  }

  let db = await connectToMongo();
  await db.collection('orders').insertOne(orderObj);
  await db.collection('customers').insertOne(customer);

  console.log("Server received order:", receivedOrder);
  return res.status(200).json(receivedOrder);
})

app.listen(PORT, () => console.log(`Listening on ${PORT}`));
