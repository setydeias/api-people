const mysql = require('mysql2/promise');
const dataconection = require('../config/database/mysql2').connection;
const bcrypt = require('bcrypt');
const { any } = require('bluebird');

exports.postPeople = async (req, res, next) => { 
 
  const connection = await mysql.createConnection(dataconection);

  await connection.execute('SET TRANSACTION ISOLATION LEVEL READ COMMITTED');   
  await connection.beginTransaction();
  
  try {

    await insertPeople(connection, req);    
    const [rows,] = await connection.execute('SELECT LAST_INSERT_ID() as id_people');

    await insertAdress(connection, req, rows[0].id_people);

    for (let i = 0; i < req.body.contacts.length; i++) {
      await insertContact(connection, req, rows[0].id_people, i);
    }

    const temporary_password = parseInt(Math.random() * 999999);
    
    await insertUser(connection, req, rows[0].id_people, temporary_password);

    const response = {
      message: 'Cadastro realizado com sucesso!',
      pessoaCadastrada: {
        id_people: rows[0].id_people,
        name: req.body.name,
        description_user: req.body.document,
        password_user: temporary_password,
      }
    }

    await connection.commit();
    return res.status(201).send(response);

  } catch (err) {
    connection.rollback();
    console.error(`Não foi possível cadastrar: ${err.message}`, err);
    return res.status(304).send(err);
  }
}

const insertPeople = (connection, req) => {
  connection.execute(`
      INSERT INTO people(
        id_status, id_document_type, document, usual_name, birth_date, sexo, id_treatment, date_registration
      )
      VALUES(
        ?,?,?,?,?,?,?,?
      );
    `,[
        req.body.id_status, 
        req.body.id_document_type, 
        req.body.document, 
        req.body.usual_name, 
        req.body.birth_date, 
        req.body.sexo, 
        req.body.id_treatment, 
        req.body.date_registration
    ]);   
}

const insertAdress = (connection, req, id_people) => {
  connection.execute(`
      INSERT INTO adress(
        id_people, 
        id_adress_type, 
        adress, 
        address_number, 
        city, 
        uf, 
        address_complement, 
        district, 
        cep
      )
      VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?)

    `, [
      id_people,
      req.body.id_adress_type,
      req.body.adress,
      req.body.address_number,
      req.body.city,
      req.body.uf,
      req.body.address_complement,
      req.body.district,
      req.body.cep
    ]);    
}

const insertContact = (connection, req, id_people, i) => {
  connection.execute(`
        INSERT INTO contact(
          id_people,
          id_contact_type,
          contact,
          whatsapp,
          main
        )
        VALUES(
          ?,?,?,?,?
        );
      `,[      
        id_people,
        req.body.contacts[i].id_contact_type,
        req.body.contacts[i].contact,
        req.body.contacts[i].whatsapp,
        req.body.contacts[i].main
      ]);       
}

const insertUser = (connection, req, id_people, temporary_password) => {
  bcrypt.hash( toString(temporary_password), 10, (errBcrypt, hash) => {
    if(errBcrypt) { 
      connection.rollback();
      return res.status(500).send({ error: errBcrypt })
    }
    connection.execute(`
      INSERT INTO user(
        id_people,
        description_user,
        password_user
      )
      VALUES(
        ?, ?, ?
      );
    `,[      
      id_people,
      req.body.document,
      hash
    ]);
  });
}
