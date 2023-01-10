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

//a list of reasons why a connection might be needed and how many of these are still open
const reasons:any = {
}

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
    connectionLimit: 50,
    //force release a pool connection after 30 seconds
    socketTimeout: 30000,
});

export default async function getConnection(reas?:string) {
    let reason = reas || "No reason given";
    console.log("Getting Connection from pool: " + reason);
    console.log(`Idle connections: ${pool.idleConnections()} | Active connections: ${pool.activeConnections()} | Total connections: ${pool.totalConnections()}`)
    return await pool.getConnection()
}