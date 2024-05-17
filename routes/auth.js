const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const config = require('../config');
const { connect } = require('../connect');

const { secret } = config;

module.exports = (app, nextMain) => {
  app.post('/login', async (req, resp, next) => {
   
    // TODO: Authenticate the user

    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return resp.status(400).send('No existe contraseña ni email');
      }

      const database = await connect();
      const collection = database.collection('users');

      const user = await collection.findOne({ email });
      console.log('router user', user);
      if (!user) {
        return resp.status(404).send('Email o password incorrectos');
      }
      const passwordMatch = await bcrypt.compare(password, user.password);
      if (!passwordMatch) {
        return resp.status(404).send('Email o password incorrectos');
      }
      // If they match, send an access token created with JWT
      const token = jwt.sign({ id: user._id, email: user.email, role: user.role}, secret );
      resp.json({ token });
    } catch (error) {
      console.error(error);
      return next(500);
    }
  });
  return nextMain();
};
