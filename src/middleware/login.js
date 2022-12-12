const jwt = require('jsonwebtoken');

const badCredentials = { 
    "statusCode": 401,
    "error": "Não autorizado",
    "message": "Credenciais inválidas"
}

exports.mandatory = (req, res, next) => {
    try {
        const token = req.headers.authorization.split(' ')[1];
        const decode = jwt.verify(token, process.env.JWT_KEY);
        req.user = decode;
        next();

    } catch (error) {
        return res.status(401).send(badCredentials);
    } 
}

exports.optional = (req, res, next) => {
    try {
        const token = req.headers.authorization.split(' ')[1];
        const decode = jwt.verify(token, process.env.JWT_KEY);
        req.user = decode;
        next();

    } catch (error) {
       next();
    } 
}