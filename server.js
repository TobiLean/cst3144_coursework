const bodyParser = require('body-parser');
const express = require('express');
const path = require('path');
const {connectToMongo, getLessonsConnection} = require('./src/db');
const crypto = require('crypto');
const fs = require('fs')
const cors = require('cors')
//const {MongoClient} = require('mongodb');

const corsOptions = {
  origin: 'https://tobilean.github.io/'
}

//Logger middleware
function logger(req, res, next) {
  console.log(`${req.method} ${req.url}`);
  next();
}

const app = express();
const PORT = 8090;

const imageDirectory = path.join(__dirname, 'images');

app.use(bodyParser.json());

app.use('/', express.static(path.join(__dirname, 'public')));

app.use(cors(corsOptions));

app.use(logger);

app.use('/images', express.static(imageDirectory));

app.use('/images/:imageTitle', (req, res, next) => {
  const imageTitle = req.params.imageTitle
  const imagePath = path.join(imageDirectory, imageTitle)

  fs.access(imagePath, fs.constants.F_OK, (err) => {
    if (err) {
      res.status(404).send('Could not find image file!');
    } else {
      res.sendFile(imagePath)
    }
  })
})

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
  console.log("Received order body:", receivedOrder);

  let randomId = crypto.randomBytes(16).toString('hex');

  let orderItems = []

  let customerEmail = receivedOrder.user_email;
  customerEmail = customerEmail.trim();

  let customerName = receivedOrder.user_name;
  customerName = customerName.trim();

  let customerPhone = receivedOrder.user_phone;
  customerPhone = customerPhone.trim();

  let customer = {
    "order_id": randomId,
    "customer_email": customerEmail,
    "customer_name": customerName,
    "customer_phone": customerPhone,
  }

  for (let i = 0; i < receivedOrder.cartItems.length; i++) {
    let orderObj = {
      order_id: randomId,
      customer_email: receivedOrder.user_email,
      id: receivedOrder.cartItems[i].id,
      subject: receivedOrder.cartItems[i].subject,
      location: receivedOrder.cartItems[i].location,
      rating: receivedOrder.cartItems[i].rating,
      price: receivedOrder.cartItems[i].price,
      spaces: receivedOrder.cartItems[i].spaces,
      bookedSpaces: receivedOrder.cartItems[i].bookedSpaces,
      image: receivedOrder.cartItems[i].image,
      promo_code: receivedOrder.promo_code
    }

    orderItems.push(orderObj);
  }

  let db = await connectToMongo();
  await db.collection('orders').insertMany(orderItems);
  await db.collection('customers').insertOne(customer);

  console.log("Server received order:", receivedOrder);
  return res.status(200).json(receivedOrder);
})

app.put("/update", async (req, res) => {
  let receivedLesson = req.body;
  console.log("Received lesson space(s): ", receivedLesson.spaces);

  let filter = {
    subject: receivedLesson.subject,
  }

  let update = {
    $set: {spaces: `${receivedLesson.spaces}`}
  }

  let db = await connectToMongo();
  const result = await db.collection('lessons').updateOne(filter, update)
  console.log(`${result.matchedCount} document(s) matched the filter, updated ${result.modifiedCount} document(s)`);
  res.status(200).json(result)
})

app.get("/search", async (req, res) => {

  let textSearchQuery = [{
    $search: {
      "index": "lesson_index",
      "text": {
        "query": req.query.q,
        "path": {
          "wildcard": "*"
        }
      }
    }
  }]

  let searchAsYouTypeQuery = [
    {
      $search: {
        index: "lesson_index",
        compound: {
          should: [
            {
              autocomplete: {
                query: req.query.q,
                path: "location"
              }
            },
            {
              autocomplete: {
                query: req.query.q,
                path: "subject"
              }
            },
            {
              autocomplete: {
                query: req.query.q,
                path: "price"
              }
            },
            {
              autocomplete: {
                query: req.query.q,
                path: "spaces",
              }
            }
          ]
        }
      }
    }
  ]

  let _lessons = await getLessonsConnection();

  try {
    const result = await _lessons.aggregate(searchAsYouTypeQuery).toArray();
    console.log("Search results: ", result);
    res.status(200).json(result);
  } catch (err) {

    console.log(err, " error occurred while searching")
  }


})

app.listen(PORT, () => console.log(`Listening on ${PORT}`));
