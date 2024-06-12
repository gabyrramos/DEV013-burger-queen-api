const bcrypt = require('bcrypt');
const { connect } = require('../connect');
const { ObjectId } = require("mongodb");
const jwt = require('jsonwebtoken');
const { isAdmin } = require('../middleware/auth');

module.exports = {

  createAdminUser: async (adminUser, res) => {
    try {
      const db = await connect();
      const usersCollection = db.collection('users');

      const foundAdmin = await usersCollection.findOne({ role: 'admin' });

      if (!foundAdmin) {
        const hashedPassword = await bcrypt.hash(adminUser.password, 10);
        const adminUserToInsert = {
          ...adminUser,
          role: 'admin',
          password: hashedPassword,
        }

        await usersCollection.insertOne(adminUserToInsert);
        res.status(200).json('Admin user created successfully');
      } else {
        return res.status(400).json('Admin user already exists');
      }
    } catch (error) {
      console.error('Error creating admin user:', error);
      return res.status(500).json('Internal server error');
    }
  },

  postUser: async (req, res) => {
    try {

      const { email, password, role } = req.body;
      const db = await connect();
      const usersCollection = db.collection('users');

      if (!email || !password) {
        return res.status(400).json('Email o password son invalidos');
      }


      const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (!regex.test(email)) {
        return res.status(400).json('Correo electronico no es valido');
      }
      if (password.length < 6) {
        return res.status(400).json('La contraseña debe tener al menos 6 caracteres');
      }



      // const validRole = await roleCollection.findOne({ role });
      // if (!validRole) {
      //   return res.status(400).json('Invalid role');
      // }


      const hashedPassword = await bcrypt.hash(password, 10);
      const existingEmail = await usersCollection.findOne({ email });
      if (existingEmail) {
        return res.status(403).json('Email already exists');
      }

      const userCreated = await usersCollection.insertOne({
        email,
        password: hashedPassword,
        role,
      });
      console.log(userCreated.insertedId);
      res.status(200).json({
        _id: userCreated.insertedId,
        email,
        role,
      });
    } catch (error) {
      console.error('Error creando usario:', error);
      return res.status(500).json('Algo salio mal');
    }
  },

  getUser: async (req, res) => {
    try {
      const db = await connect();
      const page = parseInt(req.query.page) || 0;
      const usersPerPage = parseInt(req.query._limit) || 10;
      const users = await db.collection('users')
        .find()
        .sort({ _id: 1 })
        .skip(page * usersPerPage)
        .limit(usersPerPage)
        .toArray();

      res.status(200).json(users);
    } catch (error) {
      console.error('Error buscando usuarios:', error);
      res.status(500).json('Algo salio mal');
    }
  },

  getUserById: async (req, res) => {
    console.log('Get user by id');
    try {
      const { uid } = req.params;
      const db = await connect();
      const usersCollection = db.collection('users');

      console.log('Get user by ID:', uid);
      let filterUser;
      console.log(req.user.role);
      if (req.user.role !== "admin") {
        if (uid !== req.user.id && uid !== req.user.email) {
          return res.status(403).json('Usuario no tiene permisos para ver informacion');
        }
      }

      if (ObjectId.isValid(uid)) {
        filterUser = await usersCollection.findOne({ _id: new ObjectId(uid) })
      }
      else {
        filterUser = await usersCollection.findOne({ email: uid });
      }


      // if(!req.user){
      //   console.error('Autenticacion requerida');
      //   return res.status(403).json('No autenticado');
      // }

      // if (!ObjectId.isValid(userID)) {
      //   console.error('Usuario invalido:', userID);
      //   return res.status(403).json('User ID invalido');
      // }

      if (!filterUser) {

        return res.status(404).json('User no encontrado');
      } else {
        return res.status(200).json(filterUser);
      }


      // //const requestUserId = toObjectId(req.user._id);

      // if (req.user._id !== userID || req.user.role !== 'admin'){
      //   console.error('Permiso denegado:', req.user._id);
      //   return res.status(403).json('No tienes permiso para acceder');
      // }

    } catch (error) {
      console.error('Error buscando usuario por ID:', error);
      return res.status(500).json('Algo salio mal');
    }
  },

  updateUser: async (req, res) => {
    try {
      const { email, password, role } = req.body;
      const { uid } = req.params;
      const db = await connect();
      const usersCollection = db.collection('users');

      let filterUser;
      console.log(req.user.role);
      if (req.user.role !== "admin") {
        if (uid !== req.user.id && uid !== req.user.email) {
          return res.status(403).json('Usuario no tiene permisos para ver informacion');
        }
      }

      if (ObjectId.isValid(uid)) {
        filterUser = await usersCollection.findOne({ _id: new ObjectId(uid) })
      }
      else {
        filterUser = await usersCollection.findOne({ email: uid });
      }

      if (!filterUser) {
        return res.status(404).json('User no encontrado');
      }

      if (Object.keys(req.body).length === 0) {
        return res.status(400).json('No se envio ninguna informacion para modificar');
      }
      let hashPassword;
      if (password) {
        hashPassword = await bcrypt.hash(password, 10);

      };
      console.log('Cambiando rol', role);
      console.log('Probando role', filterUser.role);
      if (role !== filterUser.role) {
        if (!isAdmin(req)) {
          return res.status(403).json('El usuario no tiene permiso para cambiar de rol');
        }
      }

      // if (role) updates.role = role;

      const result = await usersCollection.updateOne(
        filterUser,
        {
          $set: {
            email: email,
            password: hashPassword,
            role: role
          }
        }
      );

      if (result.modifiedCount === 0) {
        return res.status(400).json('No realizo ningun cambio');
      }

      res.status(200).json(result);
    } catch (error) {
      console.error('Error actualizando user:', error);
      res.status(500).json('Error interno');
    }
  },

  deleteUser: async (req, res) => {
    try {
      const {uid} = req.params;
      const db = await connect();
      const usersCollection = db.collection('users');

      let filterUser;
      console.log(req.user.role);
      if (req.user.role !== "admin") {
        if (uid !== req.user.id && uid !== req.user.email) {
          return res.status(403).json('Usuario no tiene permisos para ver informacion');
        }
      }

      if (ObjectId.isValid(uid)) {
        filterUser = await usersCollection.findOne({ _id: new ObjectId(uid) })
      }
      else {
        filterUser = await usersCollection.findOne({ email: uid });
      }

      if (!filterUser) {
        return res.status(404).json('User no encontrado');
      }


      const result = await usersCollection.deleteOne(filterUser);

      res.status(200).json('User eliminado');
    } catch (error) {
      console.error('Error eliminando user:', error);
      res.status(500).json('Error interno');
    }
  }
};
