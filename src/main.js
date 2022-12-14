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

app.use(express.static("public"));

await startServices(app, pool);

const port = process.env.ALWAYSDATA_HTTPD_PORT ?? process.env.PORT ?? 3000;

app.listen(port, () => {
    console.log('Example app listening on port 3000!');
});