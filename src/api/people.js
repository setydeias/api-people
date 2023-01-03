const express = require('express');
const router = express.Router();
//const login = require('../middleware/login'); 

const PeopleController = require('../controllers/people.controller');

router.post('/cadastro', PeopleController.postPeople);
router.patch('/alteracao', PeopleController.patchPeople);

module.exports = router;