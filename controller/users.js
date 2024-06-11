const bcrypt = require('bcrypt');
const { connect } = require('../connect');
const { ObjectId } = require("mongodb");
const jwt = require('jsonwebtoken');

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

      if (!email || !password) {
        return res.status(400).json('Email o password son invalidos');
      }

      const db = await connect();
      const roleCollection = db.collection('roles');
      const usersCollection = db.collection('users');

      // const validRole = await roleCollection.findOne({ role });
      // if (!validRole) {
      //   return res.status(400).json('Invalid role');
      // }

      const existingEmail = await usersCollection.findOne({ email });
      if (existingEmail) {
        return res.status(400).json('Email already exists');
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const userCreated = await usersCollection.insertOne({
        email,
        password: hashedPassword,
        role,
      });

      res.status(200).json({
        _id: userCreated.insertedId,
        email,
        password,
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
      const db = await connect();
      const usersCollection = db.collection('users');
      const userID = req.params.id;
      console.log('Get user by ID:', userID, req.user._id, req.user.role);
      if(!req.user){
        console.error('Autenticacion requerida');
        return res.status(403).json('No autenticado');
      }

      if (!ObjectId.isValid(userID)) {
        console.error('Usuario invalido:', userID);
        return res.status(403).json('User ID invalido');
      }

      const userObjectId = new ObjectId(userID);
      const user = await usersCollection.findOne({_id: userObjectId});

      if (!user) {
        console.error('Usuario no encontrado:', userID);
        return res.status(404).json('User no encontrado');
      // } else {
      //   return res.status(200).json(user);
      }
      console.log('Usuario encontrado:', user);

      //const requestUserId = toObjectId(req.user._id);

      if (req.user._id !== userID || req.user.role !== 'admin'){
        console.error('Permiso denegado:', req.user._id);
        return res.status(403).json('No tienes permiso para acceder');
      }

      return res.status(200).json(user);
    } catch (error) {
      console.error('Error buscando usuario por ID:', error);
      return res.status(500).json('Algo salio mal');
    }
  },

  updateUser: async (req, res) => {
    try {
      const db = await connect();
      const usersCollection = db.collection('users');
      const uid = req.params.id;
      const { email, password, role } = req.body;

  
      if (!req.user) {
          return res.status(401).json('No autenticado');
      }

      if (!ObjectId.isValid(uid)) {
          return res.status(400).json('User ID invalido');
      }

      if (!email && !password && !role) {
          return res.status(400).json('No hay propiedades para actualizar');
      }

      const isOwner = req.user._id === uid;
      const isAdmin = req.user.role === 'admin';

      if (!isOwner && !isAdmin) {
          return res.status(403).json('No tienes permiso para actualizar este usuario');
      }

      if (!isAdmin && role) {
          return res.status(403).json('No puedes cambiar tu propio rol');
      }

      const updates = {};
      if (email) updates.email = email;
      if (password) updates.password = await bcrypt.hash(password, 10);
      if (role) updates.role = role;

      const result = await usersCollection.updateOne(
          { _id: new ObjectId(uid) },
          { $set: updates }
      );

      if (result.matchedCount === 0) {
          return res.status(404).json('User no encontrado');
      }

      res.status(200).json('Actualizacion exitosa');
  } catch (error) {
      console.error('Error actualizando user:', error);
      res.status(500).json('Error interno');
  }
},

  deleteUser: async (req, res) => {
    try {
      const db = await connect();
      const usersCollection = db.collection('users');
      const uid = req.params.id;

      if (!req.user) {
          return res.status(401).json('No autenticado');
      }

      if (!ObjectId.isValid(uid)) {
          return res.status(403).json('Invalid user ID');
      }

      const userToDelete = await usersCollection.findOne({ _id: new ObjectId(uid) });
      if (!userToDelete) {
      return res.status(404).json('User no encontrado');
    }

      const isOwner = req.user._id.toString() === uid;
      const isAdmin = req.user.role === 'admin';
      if (!isAdmin) {
          return res.status(404).json('No tienes permiso para eliminar este usuario');
      }

      if (!isOwner) {
        return res.status(404).json('No tienes permiso para eliminar este usuario');
    }

      const result = await usersCollection.deleteOne({ _id: new ObjectId(uid) });

      if (result.deletedCount === 0) {
          return res.status(404).json('User no encontrado');
      }

      res.status(200).json('User eliminado');
  } catch (error) {
      console.error('Error eliminando user:', error);
      res.status(500).json('Error interno');
  }
}
};
