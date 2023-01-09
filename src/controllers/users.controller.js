const mysql  = require('mysql2');
const dataconection = require('../config/database/mysql2').connection;
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');


exports.postUser = (req, res, next) => {
    //console.log(req.user)
    mysql.getConnection((error, conn) => {
       
        if(error) { return res.status(500).send({ error: error }) }
        conn.query('SELECT * FROM user WHERE description_user = ?', [req.body.description_user], (error, result) => {
            if(error) { return res.status(500).send({ error: error }) }
            if(result.length > 0) {
                res.status(409).send({  "statusCode": 409,
                "error": "Conflito",
                "message": "Usuário já cadastrado."
            })
            } else {
                bcrypt.hash( req.body.password_user, 10, (errBcrypt, hash) => {
                    if(errBcrypt) { return res.status(500).send({ error: errBcrypt })}
                    conn.query(
                        'INSERT INTO user(description_user, password_user) VALUES(?,?);',
                        [req.body.description_user, hash],
                        (error, result, fields) => {
                            conn.release();
                            if(error){ return res.status(500).send({ testeErro: error }) } 
                            
                            const response = {
                                message: 'Usuário cadastrado com sucesso!',
                                 usuarioCadastrado: {
                                     id_user: result.insertId,
                                     descricao: req.body.description_user,
                                     request: {
                                        type: 'POST',
                                        description: 'Insere um usuário de acesso.',
                                        url: 'https://localhost:3001/api/painel/users/create ' //Deverá ser substituido por uma variável de ambiente.
                                    }
                                 }
                            }
                            return res.status(201).send(response);
                    })
                }); 
            }
        })
    });  
}

exports.getUsers =  (req, res, next) =>{
   
    mysql.getConnection((error, conn) => {
        if(error) { return res.status(500).send({ error: error })}
        conn.query(
            `
                SELECT * FROM user;
            `,
            (error, result, fields) => {
                conn.release();
                if(error) { return res.status(500).send({ error: error })}
                const response = {
                    quantidade: result.length,
                    users: result.map(user => {
                        return {
                            id_user: user.id_user,
                            descricao: user.description_user,
                            request: {
                                type: 'GET',
                                description: 'Retorna todos os usuários cadastrados.',
                                url: 'https://localhost:3001/api/usuario/consultar/todos' //Deverá ser substituido por uma variável de ambiente.
                            }
                        }
                    })
                }
                return res.status(200).send(response);
            }
        )
    });
}

exports.loginUser = (req, res, next) => {

    const connection = mysql.createConnection(dataconection);

    connection.execute(`
        SELECT 
            people.id_people as id_people,
            people.id_status as id_status,
            people.document as document,
            people.name as name, 
            user.id_user as id_user,
            user.password_user as password_user
        FROM
            people
        INNER JOIN
            user
        ON
            people.id_people = user.id_people
        WHERE	
        people.document = ?;`, 
        [req.body.document], (error, results, fields) => {
            if(error) { return res.status(500).send({ error: error })}
            if(results.length < 1) {
                return res.status(204).send({ message: 'Documento não cadastrado.' })
            } 

            bcrypt.compare(req.body.password_user,  results[0].password_user, (err, result) => {
                
                if(err) {
                  return res.status(401).send({ message: 'Falha na autenticação.' })
                }
                
                if(result) {
                    const token = jwt.sign({
                      id_user: results[0].id_user,
                      name: results[0].name
                    },
                    process.env.JWT_KEY,
                    {
                      expiresIn: "1h"
                    });
                    
                    return res.status(200).send({                         
			            people: {
			            	id_people: results[0].id_people,
                            id_status: results[0].id_status,
                            document: results[0].document,
                            name: results[0].name,
                            id_user: results[0].id_user,
                            password_user: results[0].password_user
			            },
			            message:  'Autenticado com sucesso.',
                        access_token: token,
                        token_type: "Bearer",
                        expires_in: 3600,
                    });
                }

                return  res.status(401).send({ message: 'Falha na autenticação' })
          });
        }
    );
}