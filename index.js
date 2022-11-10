const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const app = express();
const port = process.env.PORT || 5000;
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');


// middle wares
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.0tydy0p.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

function verifyJWT(req, res, next){
    const authHeader = req.headers.authorization;
    if(!authHeader){
        res.status(401).send({message: 'unauthorized access'})
    }
    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function(err, decoded){
        if(err){
            res.status(401).send({message: 'Unauthorized access'})
        }
        req.decoded = decoded;
        next()
    })
    
}


async function run() {
    try {
        // service collection
        const serviceCollection = client.db('serviceReview').collection('services');

        // Review collection
        const reviewCollection = client.db('serviceReview').collection('reviews');


        app.get('/services', async (req, res) => {
            const query = {};
            const cursor = serviceCollection.find(query).sort({"_id": -01});
            const services = await cursor.limit(3).toArray();
            res.send(services);
        });
        app.get('/services/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const service = await serviceCollection.findOne(query);
            res.send(service);
        });
        app.get('/AllServices', async (req, res) => {
            const query = {};
            const cursor = serviceCollection.find(query).sort({"_id": -01});
            const services = await cursor.toArray();
            res.send(services);
        });

        app.get('/serviceDetails/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const service = await serviceCollection.findOne(query);
            res.send(service);
        });

        app.post('/services', async (req, res) => {
            const service = req.body;
            const result = await serviceCollection.insertOne(service);
            res.send(result);
        });



        // reviews api
        app.post('/reviews', async (req, res) =>{
            const review = req.body;
            const result = await reviewCollection.insertOne(review);
            res.send(result);
        })
        app.get('/reviews', verifyJWT, async(req, res) => {
            let query = {};
            if(req.query.email){
                query = {
                    email: req.query.email
                }
            }
            const cursor = reviewCollection.find(query);
            const review = await cursor.toArray();
            res.send(review);
        });
       
        app.get('/reviews/:id', async (req, res) =>{
            const id = req.params.id
            const cursor = await reviewCollection.find({service: id});
            const reviews = await cursor.toArray();
            res.send(reviews);
        })
        app.delete('/reviews/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id)};
            const result = await reviewCollection.deleteOne(query);
            res.send(result);
        });
        app.patch('/reviews/:id', async (req, res) => {
            const id = req.params.id;
            const status = req.body.status;
            const query = { _id: ObjectId(id)}
            const edit = {
                $set:{
                    status: status
                }
            }
            const result = await reviewCollection.updateOne(query, edit);
            res.send(result);
        });
        // jwt
        app.post('/jwt', (req, res) => {
            const user = req.body;
            const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {expiresIn: '10d'});
            res.send({token})
        })
    }
    finally {

    }
}
run().catch(error => console.error(error));



app.get('/', (req, res) => {
    res.send('Travel advisor server is running')
})

app.listen(port, () => {
    console.log(`Travel advisor server running on ${port}`);
})