const jwt = require('jsonwebtoken');

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
    console.log('aqui el decoded token', decodedToken);
    req.user = {
     id: decodedToken.id,
     email: decodedToken.email,
     role: decodedToken.role,
    };
    console.log(req.uid);
  });

  next();
};

module.exports.isAuthenticated = (req, res, next) => {
  console.log(req.user);
  return req.user != null ;
};

module.exports.isAdmin = (req, res, next) => {
  return req.user && req.user.role === 'admin'
  
};

module.exports.requireAuth = (req, res, next) => {
  if (!module.exports.isAuthenticated(req, res, next)) {
    return res.status(401).send('No autorizado');
  }
  next();
};

module.exports.requireAdmin = (req, res, next) => {
  if (!module.exports.isAuthenticated(req, res, next)) {
    return res.status(401).send('No autorizado');
  } else if (!module.exports.isAdmin(req, res, next)) {
    return res.status(403).send('Accesso Restringido');
  }
  next();
};