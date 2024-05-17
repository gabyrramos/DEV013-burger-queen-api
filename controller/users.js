const users = require("../routes/users")
bycrypt = require('bcrypt');
const { connect } = require('../connect');
const { Collection } = require("mongodb");



// ✅1- AQUI VAMOS A ACCEDER PRIMERO A LA BASE DE DATOS 
// ✅2- LUEGO VAMOS A ACCERDER CON UN TRY AND CATCH - TRY A LOS DIFFERENTES VERIFICACIONES Y LUEGO CATCH PARA EL ERROR
// dentro de try:
// ✅2.1 lo que queremos es ver que primero el req que se hace es para crear un admin 
// ✅2.2 entonces revisamos el rol
//✅ 2.3 si no coincide entonces creamos un usuario 
//✅2.4 ahi vamos a darle un formato para crear un id, email, password, role
// 3. despues de hacer esto, podemos revisar otros detalles como por ejm
//3.1 para crear un usuario debe cumplir ciertas caracteristicas
//3.2 que el email sea valido
//3.3 sino es un error
//✅3.4 que la contrasena sea mas de 4 caracteres
//✅3.5 sino es un error
//✅3.6 que el email no se haya usado antes
//✅3.7 sino es un error 
// 4 despues hacemos un error por si nada funciona
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
    try {
      const db = await connect();
      const usersCollection = db.collection('users');
      const users = await usersCollection.find().toArray();
      resp.json(users);
    } catch (error) {
      console.error('Error:', error);
      return resp.status(500).send('Error al obtener usuarios');
    }
  },

  updateUser: (req, resp, next) => {  //AQUI MANEJAMOS EL CRUD
    // TODO: Implement the necessary function to fetch the `users` collection or table

  },

  deleteUser: (req, resp, next) => {  //AQUI MANEJAMOS EL CRUD
    // TODO: Implement the necessary function to fetch the `users` collection or table

  },

}