const users = require("../routes/users")

module.exports = {
  createUser: (req, resp, next)=>{ //AQUI MANEJAMOS EL CRUD

  },
  
  getUser: async (req, resp, next) => {  //AQUI MANEJAMOS EL CRUD
    // TODO: Implement the necessary function to fetch the `users` collection or table
   const users = await users.find();
   resp.json(users)
  },

  updateUser: (req, resp, next) => {  //AQUI MANEJAMOS EL CRUD
    // TODO: Implement the necessary function to fetch the `users` collection or table
   
  },

  deleteUser: (req, resp, next) => {  //AQUI MANEJAMOS EL CRUD
    // TODO: Implement the necessary function to fetch the `users` collection or table
  
  },

}