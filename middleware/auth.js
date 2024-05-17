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
    req.uid = decodedToken._id;
    console.log(req.uid);
  });

  next();
};

module.exports.isAuthenticated = (req) => {
  console.log(req.id)
  return req.uid ? true : false;
  // TODO: Decide based on the request information whether the user is authenticated

};

module.exports.isAdmin = (req, res, next) => {
  // TODO: Decide based on the request information whether the user is an admin
  //const { role } = req.user;
  return req.role === "admin" ? true : false;
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
