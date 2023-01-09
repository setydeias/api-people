const mysql = require('mysql2');
const mysqlPromise = require('mysql2/promise');
const dataconection = require('../config/database/mysql2').connection;
const bcrypt = require('bcrypt');
const { any } = require('bluebird');

exports.postPeople = async (req, res, next) => { 
 
  const connection = await mysqlPromise.createConnection(dataconection);

  await connection.execute('SET TRANSACTION ISOLATION LEVEL READ COMMITTED');   
  await connection.beginTransaction();
  
  try {

    await insertPeople(connection, req);    
    const [rows,] = await connection.execute('SELECT LAST_INSERT_ID() as id_people');

    await insertAdress(connection, req, rows[0].id_people);

    for (let i = 0; i < req.body.contacts.length; i++) {
      await insertContact(connection, req.body.contacts[i], rows[0].id_people, i);
    }

    const temporary_password = parseInt(Math.random() * 999999);

    await insertUser(connection, req, rows[0].id_people, temporary_password.toString());

    const response = {
      message: 'Cadastro realizado com sucesso!',
      pessoaCadastrada: {
        id_people: rows[0].id_people,
        name: req.body.name,
        description_user: req.body.document,
        password_user: temporary_password.toString(),
      }
    }

    await connection.commit();
    return res.status(201).send(response);

  } catch (err) {
    connection.rollback();
    console.error(`Não foi possível cadastrar: ${err.message}`, err);
    return res.status(304).send({
      message: 'Não foi possível cadastrar'
    });
  }
}

exports.patchPeople = async (req, res, next) => { 
 
 const connection = await mysqlPromise.createConnection(dataconection);

  await connection.execute('SET TRANSACTION ISOLATION LEVEL READ COMMITTED');   
  await connection.beginTransaction();

  try {

    await updatePeople(connection, req);
    await updateAdress(connection, req);

    for (let i = 0; i < req.body.contacts.length; i++) {
      await updateContact(connection, req.body.contacts[i]);
    }

    const response = {
      message: 'Alterações realizado com sucesso!',
      pessoaAlterada: {
        id_people: req.body.id_people,
        name: req.body.name,
      }
    }

    await connection.commit();
    return res.status(202).send(response);

  } catch (err) {
    connection.rollback();
    console.error(`Não foi possível alterar: ${err.message}`, err);
    return res.status(304).send(err);
  }
}

exports.patchContact = (req, res, next) => {

  const connection = mysql.createConnection(dataconection);

  connection.execute(`
    UPDATE 
      contact
    SET
      id_contact_type=?,
      contact=?,
      whatsapp=?,
      main=?
    WHERE
      id_contact=?;
    `,[      
      req.body.id_contact_type,
      req.body.contact,
      req.body.whatsapp,
      req.body.main,
      req.body.id_contact,
    ], (err, row) => {

      if (err) { return res.status(500).send({ error: err })}
      
      const response = {
        message: 'Alterações realizado com sucesso!',
        contatoAlterada: {
          id_contact: req.body.id_contact,
          contato: req.body.contact,
        }
      }
      return res.status(200).send(response);
    }
  );
}

exports.deleteContact = (req, res, next) => {

  const connection = mysql.createConnection(dataconection);

  connection.execute(`
    DELETE FROM 
      contact
    WHERE
      id_contact=?;
    `,[      
      req.params.id,
    ], (err, row) => {

      if (err) { return res.status(500).send({ error: err })}
      
      const response = {
        message: 'Contao Excluído com sucesso.',
        request: {
          tipo: 'POST',
          descricao: 'Insere um Contato',
          url: 'https://localhost:3001/api/pessoa/cadastrar', //Deverá ser substituido por uma variável de ambiente.
          body: {
            Descrição: 'String',
            id: 'int'
          }
        }
      } 
      return res.status(202).send(response);
    }
  );
}

const insertPeople = (connection, req) => {
  connection.execute(`
      INSERT INTO people(
        id_status, 
        id_document_type, 
        document, 
        name,
        usual_name, 
        birth_date, 
        sexo, 
        id_treatment, 
        date_registration, 
        last_change
      )
      VALUES(
        ?,?,?,?,?,?,?,?,?,?
      );  
    `,[
        req.body.id_status, 
        req.body.id_document_type, 
        req.body.document, 
        req.body.name,
        req.body.usual_name, 
        req.body.birth_date, 
        req.body.sexo, 
        req.body.id_treatment,
        req.body.date_registration,
        req.body.last_change
    ]);   
}

const updatePeople = (connection, req) => {
  connection.execute(`
        UPDATE 
          people 
        SET
          id_status =?, 
          id_document_type =?, 
          document =?,
          name =?, 
          usual_name =?, 
          birth_date =?, 
          sexo =?, 
          id_treatment =?,
          last_change =?
        WHERE 
          id_people =?;
    `,[
        req.body.id_status, 
        req.body.id_document_type, 
        req.body.document, 
        req.body.name,
        req.body.usual_name, 
        req.body.birth_date, 
        req.body.sexo, 
        req.body.id_treatment,
        req.body.last_change, 
        req.body.id_people
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

const updateAdress = (connection, req) => {
  connection.execute(`
      UPDATE 
        adress
      SET 
        id_adress_type=?, 
        adress=?, 
        address_number=?, 
        city=?, 
        uf=?, 
        address_complement=?, 
        district=?, 
        cep=?
      WHERE
        id_people=?

    `, [
      req.body.adress.id_adress_type,
      req.body.adress.adress,
      req.body.adress.address_number,
      req.body.adress.city,
      req.body.adress.uf,
      req.body.adress.address_complement,
      req.body.adress.district,
      req.body.adress.cep,
      req.body.id_people
    ]);    
}

const insertContact = (connection, contact, id_people, i) => {
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
        contact.id_contact_type,
        contact.contact,
        contact.whatsapp,
        contact.main
      ]
  );       
}

const updateContact = (connection, contact) => {
  connection.execute(`
    UPDATE 
      contact
    SET
      id_contact_type=?,
      contact=?,
      whatsapp=?,
      main=?
    WHERE
      id_contact=?;
    `,[      
        contact.id_contact_type,
        contact.contact,
        contact.whatsapp,
        contact.main,
        contact.id_contact,
      ]
  );
}

const insertUser = (connection, req, id_people, temporary_password) => {
  bcrypt.hash(temporary_password, 10, (errBcrypt, hash) => {
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
