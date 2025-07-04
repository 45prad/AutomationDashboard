import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET; // This should be stored in .env.local for security

const fetchuser = (req, res, next) => {
    // Get the user from jwt token and add id to the req object
    const token = req.header('Auth-token');

    if (!token) {
        return res.status(401).send({ error: "Please authenticate using a valid token" });
    }

    try {
        const InfofromToken = jwt.verify(token, JWT_SECRET);
        req.user = InfofromToken.user;
        next();
    } catch (err) {
        return res.status(401).send({ error: "Can't authenticate auth-token" });
    }
};

export default fetchuser;
