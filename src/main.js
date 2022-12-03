import express from 'express';
import bodyParser from 'body-parser';
import mariadb from 'mariadb';
import startServices from '../services/index.js';

const pool = mariadb.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'twitterplus',
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