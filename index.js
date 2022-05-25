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
    // Get all sign up users
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