import express from 'express';
import bodyParser from 'body-parser';
import mariadb from 'mariadb';
import startServices from './services/index.js';
import * as dotenv from 'dotenv'
dotenv.config()

const pool = mariadb.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    connectionLimit: 30
});

const app = express();
app.use(bodyParser.json());

app.use("/", express.static("public"));

app.get('/', (req, res) => {
    res.send('Hello World!');
});

await startServices(app, pool);

app.listen(3000, () => {
    console.log('Example app listening on port 3000!');
});