const express = require('express')
const cors = require('cors');
require('dotenv').config();
const app = express()
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const jwt = require('jsonwebtoken');

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.hcmia.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
// JWT Token
function verifyJWT(req, res, next) {
  const authHeader = req.headers.authorization;
  if(!authHeader) {
    return res.status(401).send({message: '401 Unauthorized access'});
  }
  const token = authHeader.split(' ')[1];
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function(err, decoded) {
    if(err) {
      return res.status(403).send({message: '403 Forbidden access'});
    }
    req.decoded = decoded;
    next();
  });
}

async function run() {
  try {
    await client.connect();
    // Data collections
    const toolsCollection = client.db('cordlessTools').collection('tools');
    const userCollection = client.db('cordlessTools').collection('users');
    const orderCollection = client.db('cordlessTools').collection('orders');
    const reviewCollection = client.db('cordlessTools').collection('reviews');

    // Verify Admin role
    const verifyAdmin = async (req, res, next) => {
      const requester = req.decoded.email;
      const requesterAccount = await userCollection.findOne({ email: requester });
      if (requesterAccount.role === 'admin') {
        next();
      }
      else{
        res.status(403).send({message: 'forbidden'});
      }
    }

    // Store all tools
    app.get('/tool', async (req, res) => {
      const query = {};
      const tools = (await toolsCollection.find(query).toArray()).reverse();
      res.send(tools);
    });
    // Get tool by ID
    app.get('/purchase/:id', async (req, res) => {
      const id = req.params.id;
      const query = {_id: ObjectId(id)};
      const purchase = await toolsCollection.findOne(query);
      res.send(purchase);
    });
    // Update tool
    app.put('/tool/:id', verifyJWT, async(req, res) => {
      const id = req.params.id;
      const filter = {_id: ObjectId(id)};
      const updateTool = req.body;
      const options = {upsert: true};
      const updateDoc = {$set: updateTool};
      const result = await toolsCollection.updateOne(filter, updateDoc, options);
      res.send(result);
    });
    // Add new Tool
		app.post('/tool', verifyJWT, verifyAdmin, async (req, res) => {
			const addTool = req.body;
			const result = await toolsCollection.insertOne(addTool);
      res.send(result);
		});
    // Delete tool 
    app.delete('/tool/:id', verifyJWT, async (req, res) => {
      const id = req.params.id;
      const filter = {_id: ObjectId(id)};
      const result = await toolsCollection.deleteOne(filter);
      res.send(result);
    })
    // Post all users from signup form
    app.post('/user/:email', async (req, res) => {
      const email = req.params.email;
      const user = req.body;
      const filter = {email: email};
      const options = {upsert: true};
      const updateDoc = {$set: user};
      const result = await userCollection.updateOne(filter, updateDoc, options);
      const token = jwt.sign({email: email}, process.env.ACCESS_TOKEN_SECRET, {expiresIn: '5h'})
      res.send({result, token});
    });
    // Update user profile
    app.put('/user/:email', verifyJWT, async (req, res) => {
      const email = req.params.email;
      const user = req.body;
      const filter = {email: email};
      const options = {upsert: true};
      const updateDoc = {$set: user};
      const result = await userCollection.updateOne(filter, updateDoc, options);
      const token = jwt.sign({email: email}, process.env.ACCESS_TOKEN_SECRET, {expiresIn: '5h'})
      res.send({result, token});
    });
    // Get users
    app.get('/user/:email', verifyJWT, async (req, res) => {
      const email = req.params.email;
      const query = {email: email}
      const users = await userCollection.findOne(query);
      res.send(users); 
    });
    // Post order
    app.post('/order', verifyJWT, async (req, res) => {
      const order = req.body;
      const result = await orderCollection.insertOne(order);
      res.send(result);
    });
    // Get all orders
    app.get('/order', verifyJWT, async (req, res) => {
      const orders = (await orderCollection.find().toArray()).reverse();
      res.send(orders);
    });
    // Get order data by user
    app.get('/user-order', verifyJWT, async (req, res) => {
      const user = req.query.user;
      const decodedEmail = req.decoded.email;
      if(user === decodedEmail) {
        const query = {orderedEmail: user};
        const orders = (await orderCollection.find(query).toArray()).reverse();
        return res.send(orders);
      }
      else {
        return res.status(403).send({message: '403 Forbidden access'});
      }
    });
    // Delete order
    app.delete('/order/:email', verifyJWT, async(req, res) => {
      const email = req.params.email;
      const filter = {email: email}
      const result = await orderCollection.deleteOne(filter);
      res.send(result);
    });
    // Post review
    app.post('/review', verifyJWT, async (req, res) => {
      const reviews = req.body;
      const result = await reviewCollection.insertOne(reviews);
      res.send(result);
    });
    // Get all reviews
    app.get('/review', async (req, res) => {
      const reviews = (await reviewCollection.find().toArray()).reverse();
      res.send(reviews);
    });
    // Make admin
    app.put('/user/admin/:email', verifyJWT, verifyAdmin, async (req, res) => {
      const email = req.params.email;
      const filter = { email: email };
      const updateDoc = {
        $set: { role: 'admin' },
      };
      const result = await userCollection.updateOne(filter, updateDoc);
      res.send(result);
    });
    // Get admin 
    app.get('/admin/:email', verifyJWT, async (req, res) => {
      const email = req.params.email;
      const users = await userCollection.findOne({email: email});
      const isAdmin = users?.role === 'admin';
      res.send({admin: isAdmin});
    });

  }
  finally {

  }
}

run().catch(console.dir);

app.get('/', (req, res) => {
  res.send('Hello Cordless Tools Terminal Server!')
})

app.listen(port, () => {
  console.log(`Cordless Tools Terminal listening on port: ${port}`)
})