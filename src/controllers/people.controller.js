const mysql = require('mysql2/promise');
const dataconection = require('../config/database/mysql').connection;

exports.postPeople = async (req, res, next) => { 
 
  const connection = await mysql.createConnection(dataconection);

  await connection.execute('SET TRANSACTION ISOLATION LEVEL READ COMMITTED');   
  await connection.beginTransaction();
  
  try {

    await connection.execute(`
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
    
    const [rows,] = await connection.execute('SELECT LAST_INSERT_ID() as id_people');
    
    for (let i = 0; i < req.body.contacts.length; i++) {
      await connection.execute(`
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
        rows[0].id_people,
        req.body.contacts[i].id_contact_type,
        req.body.contacts[i].contact,
        req.body.contacts[i].whatsapp,
        req.body.contacts[i].main
      ]);       
    }

    await connection.execute(`
      INSERT INTO user(
        id_people,
        description_user,
        password_user
      )
      VALUES(
        ?, ?, ?
      );
    `,[      
      rows[0].id_people,
      req.body.description_user,
      req.body.password_user
    ]);


    const response = {
      message: 'Cadastro realizado com sucesso!',
      pessoaCadastrada: {
        d_people: rows[0].id_people,
        name: req.body.name
      }
    }

    await connection.commit();
    return res.status(201).send(response);

  } catch (err) {
    connection.rollback();
    console.error(`Ocorreu um erro ao criar o pedido: ${err.message}`, err);
    return res.status(304).send(err.message);
  }
}

