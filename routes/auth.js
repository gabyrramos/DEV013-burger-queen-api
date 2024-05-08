const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const config = require('../config');
const { connect } = require('../connect');

const { secret } = config;

module.exports = (app, nextMain) => {
  app.post('/login', (req, resp, next) => {
    const { email, password } = req.body;

    if (!email || !password) {
      return next(400);
    }
    // TODO: Authenticate the user

    try {
      const database = connect();
      const collection = database.collection('users');

      const user = collection.findOne({ email });
      if (!user) {
        return resp.status(404).send('Email o password incorrectos');
      }
      const passwordMatch = bcrypt.compare(password, user.password);
      if (!passwordMatch) {
        return resp.status(404).send('Email o password incorrectos');
      }
      // If they match, send an access token created with JWT
      const token = jwt.sign({ id: user._id, email: user.email }, secret, { expiresIn: '1h' });
      resp.json({ token });
    } catch (error) {
      console.error(error);
      return next(500);
    }
  });
  return nextMain();
};
