// eslint-disable-next-line no-unused-vars
const { MongoClient } = require('mongodb');
const config = require('./config');

const client = new MongoClient(config.dbUrl);
async function connect() {
  try {
    await client.connect();

    const db = client.db('BurgerQueenAPI'); // Reemplaza <NOMBRE_DB> por el nombre del db
    return db;
  } catch (error) {
    console.log('Error');
  }
}

module.exports = { connect };
