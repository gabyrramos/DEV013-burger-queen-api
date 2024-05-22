const users = require("../routes/users")
bycrypt = require('bcrypt');
const { connect } = require('../connect');
const { Collection, ObjectId, MongoUnexpectedServerResponseError } = require("mongodb");
const { adminEmail } = require("../config");



module.exports = {

  createAdminUser: async (adminUser) => {
   try {
    const db = await connect();
    const usersCollection = db.connect('users');
   
    const foundAdmin = await usersCollection.findOne({ role: 'admin'});

    if(!foundAdmin){
      //aqui tengo que insertar tambien la pw? 
      const hashedPassword = await bycrypt.hash(adminUser.password, 10);
      const adminUserToInsert = {
      ...adminUser,
      role: 'admin',
      password: hashedPassword,
      }

      const result = await usersCollection.insertOne(adminUserToInsert);
      res.status(200).send('User creado') 
  } else {
    return res.status(400).send('Ya existe este usuario');
  }
  }
  catch(error) {
    console.log('Error creando el admin user');
    return res.status(400).send('Ya existe el usuario');
   }
  },

  postUser: async (req, resp, next) => {
    try {
      const { email, password, role } = req.body;
      

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

      const creatingPassword = await bycrypt.hash(password, 10); //salt rounds 10
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
      const page = parseInt(req.query.page) || 0;
      const userPerPage = 10;
      const users = await db.collection('users')
      .find()
      .sort({ id: 1 })
      .skip(page * userPerPage)
      .limit(userPerPage)
      .toArray()

      resp.status(200).json(users);
      } catch(error) {
        console.log(error);
      resp.status(500).send('Algo salio mal');
    }
  },

  getUserById: async (req, res, next) =>{
    try{
      const db = await connect();
      const usersCollection = db.collection('users');
      const userID = req.params.id;
      //aqui validamos el id
      if(!ObjectId.isValid(userID)){
        return res.status(400).send('ID no es valido');
      }

      const user = await usersCollection.findOne({ _id: new ObjectId(userID)});   

       if (!user) {
        return res.status(404).send('Error no hay usuario con ese ID')
       } else {
        return res.status(200).json(user);
       }
   }catch (error) {
      console.error('Error obteniendo el usuario por ID:', error);
      return res.status(500).send('Error, algo paso, intente de nuevo');
    }
  },

  updateUser: (req, resp, next) => {  //AQUI MANEJAMOS EL CRUD
    // TODO: Implement the necessary function to fetch the `users` collection or table
      //acceder a la base datos
      //acceder a la collection
      // acceder a los parametros con los roles o IDS?
      //digamos que quiero actualizar el email de una usuaria, 
      //entonces accedo a ese correo
      //y despues inserto el cambio 
      //y lo guardo??

  },

  deleteUser: (req, resp, next) => {  //AQUI MANEJAMOS EL CRUD
    // TODO: Implement the necessary function to fetch the `users` collection or table

  },

}