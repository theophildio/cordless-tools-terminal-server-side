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

async function run() {
  try {
    await client.connect();
    // Data collections
    const toolsCollection = client.db('cordlessTools').collection('tools');
    const purchaseCollection = client.db('cordlessTools').collection('purchase');

    // Store all tools
    app.get('/tool', async (req, res) => {
      const query = {};
      const tools = await toolsCollection.find(query).toArray();
      res.send(tools);
    });
    // Get tool by ID
    app.get('/purchase/:id', async (req, res) => {
      const id = req.params.id;
      const query = {_id: ObjectId(id)};
      const purchase = await toolsCollection.findOne(query);
      res.send(purchase);
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