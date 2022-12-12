const express = require('express');
const router = express.Router();
//const login = require('../middleware/login'); 

const UsersController = require('../controllers/users.controller');

router.post('/cadastro', UsersController.postUser);
router.get('/consultar/todos', UsersController.getUsers);


module.exports = router;