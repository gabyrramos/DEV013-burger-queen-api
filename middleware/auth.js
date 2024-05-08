const jwt = require('jsonwebtoken');
const { secret } = require('../config');

module.exports = (secret) => (req, resp, next) => {
  const { authorization } = req.headers;
  if (!authorization) {
    return next();
  }

  const [type, token] = authorization.split(' ');

  if (type.toLowerCase() !== 'bearer') {
    return next();
  }

  jwt.verify(token, secret, (err, decodedToken) => {
    if (err) {
      return next(403);
    }
  });
  // TODO: Verify user identity using `decodeToken.uid`
  const decodedToken = jwt.verify(token, secret);
  const tokenUserID = decodedToken.uid;
  if (!tokenUserID) {
    return resp.send('Id incorrecto');
  }
  next();
};

module.exports.isAuthenticated = (req, res, next) => {
  const token = req.headers.authorization;

  // TODO: Decide based on the request information whether the user is authenticated
  if (!token) {
    return res.status(401).send('Error, no hay token');
  }
  try {
    const tokenVerified = jwt.verify(token, secret);
    req.user = tokenVerified;

    next();
} catch (error) {
    return res.status(401).send('Error al validar token');
  }
};

module.exports.isAdmin = (req, res, next) => {
  // TODO: Decide based on the request information whether the user is an admin
  const { role } = req.user;
  if (role !== 'admin') {
    return res.status(403).send('Not authorized');
  }
  next();
};

module.exports.requireAuth = (req, resp, next) => (
  (!module.exports.isAuthenticated(req, resp, next))
    ? next(401)
    : next()
);

module.exports.requireAdmin = (req, resp, next) => (
  // eslint-disable-next-line no-nested-ternary
  (!module.exports.isAuthenticated(req, resp, next))
    ? next(401)
    : (!module.exports.isAdmin(req, resp, next))
      ? next(403)
      : next()
);
