const express = require('express');
const router = express.Router();
//const login = require('../middleware/login'); 

const PeopleController = require('../controllers/people.controller');

router.post('/cadastrar', PeopleController.postPeople);
router.patch('/aditar/', PeopleController.patchPeople);
router.patch('/contato/editar', PeopleController.patchContact);
router.delete('/contato/delete/:id', PeopleController.deleteContact);

module.exports = router;