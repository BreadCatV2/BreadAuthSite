//import mariadb
import mariadb from 'mariadb';

import dotenv from 'dotenv';
dotenv.config();
const host = process.env.DB_HOST;
const port = process.env.DB_PORT;
const dbName = process.env.DB_NAME;
const user = process.env.DB_USER;
const password = process.env.DB_PASSWORD;

console.log('DB connection info: ', host, port, dbName, user, password);

if (!host || !port || !dbName || !user || !password) {
    throw new Error('DB connection info is not set in .env file');
}

//create connection pool
const pool = mariadb.createPool({
    host: host,
    port: parseInt(port),
    user: user,
    password: password,
    database: dbName,
    connectionLimit: 10
});

export default async function getConnection() {
    return await pool.getConnection();
}