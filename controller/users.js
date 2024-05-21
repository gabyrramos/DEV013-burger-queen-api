const users = require("../routes/users")
bycrypt = require('bcrypt');
const { connect } = require('../connect');
const { Collection } = require("mongodb");
const { adminEmail } = require("../config");



module.exports = {

  postUser: async (req, resp, next) => {
    try {
      const { email, password, role } = req.body
      

      if (!email || !password) {
        return resp.status(400).send('Espacios vacios, por favor escribir email y/o password validos');
      }

      const db = await connect();
      const roleCollection = db.collection('roles');
      const usersCollection = db.collection('users');

      const validRole = await roleCollection.findOne({ role });
      if (!validRole) {
        return resp.status(400).send('El rol no es valido');
      };

      const existingEmail = await usersCollection.findOne({ email });
      if (existingEmail) {
        return resp.status(400).send('El email ya existe')      
      };

      const creatingPassword = await bycrypt.hash(password, 10);
      const userCreated = await usersCollection.insertOne({
        email,
        password: creatingPassword,
        role,
      });

      const { insertedId } = userCreated;
      resp.json({
        _id: insertedId,
        email,
        role,
      });

    } catch (error) {
      console.error('Error:', error);
      return resp.status(500).send('Error, algo salio mal');
    }
  },

  getUser: async (req, resp, next) => {
      const db = await connect();
      const page = req.query.page || 0;
      const userPerPage = 10;
      let users = []
      db.collection('users')
      .find()
      .sort({ id: 1 })
      .skip(page * userPerPage)
      .limit(userPerPage)
      .forEach(user => users.push(user))
      .then(() =>{
        resp.status(200).json(users)
      })
      .catch(() => {
      resp.status(500).send('Algo salio mal');
    })
  },

  getUserAdmin: async (req, res, next) =>{
    try{
      const db = await connect();
      const usersCollection = db.collection('users');
      const users = await usersCollection.find();   
       if (!adminEmail) {
        return res.status()
       }
      
        }catch (error) {
      return resp.status(500).send("Error, algo paso, intente de nuevo");
    }
  }

  updateUser: (req, resp, next) => {  //AQUI MANEJAMOS EL CRUD
    // TODO: Implement the necessary function to fetch the `users` collection or table

  },

  deleteUser: (req, resp, next) => {  //AQUI MANEJAMOS EL CRUD
    // TODO: Implement the necessary function to fetch the `users` collection or table

  },

}