const mysql  = require('../config/database/mysql').pool;
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
            'SELECT * FROM user;',
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