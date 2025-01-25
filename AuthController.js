const bcrypt = require('bcrypt');
const User = require('./User').User;
const session =  require('express-session')
const jwt = require('jsonwebtoken');



const generateAccessToken = (id, username) => {
    const payload = {
        id,
        username 
    }
    console.log(payload);
    return jwt.sign(payload, "1234567", {expiresIn: "24h"});
}

class AuthController {
    async login(req, res) {
        try {
            const { username, password } = req.body;
            console.log(`Login attempt: ${username}`);
            const candidate = await User.findOne({ username });
            if (!candidate) {
                console.error(`User not found: ${username}`);
                return res.status(400).json({ message: "User not found" });
            }
            const valid = bcrypt.compareSync(password, candidate.password);
            if (!valid) {
                console.error(`Invalid password for user: ${username}`);
                return res.status(400).json({ message: "Invalid password" });
            }
            const token = generateAccessToken(candidate._id, candidate.username);
            res.header('Authorization', `Bearer ${token}`);

            const idString = candidate._id.toString(); 
            req.session.userId = idString; 
            req.session.username = candidate.username; 
            console.log(candidate.username)
            return res.redirect(`/?id=${idString}`);
        } catch (err) {
            console.error('Error during login:', err);
            res.status(500).json({ message: "Internal server error" });
        }
    }

    async register(req, res) {
        try {
            const { username, password } = req.body;
            console.log(`Register attempt: ${username}`);
            const candidate = await User.findOne({ username });
            if (candidate) {
                console.error(`User already exists: ${username}`);
                return res.status(400).json({ message: "User already exists" });
            }
            const hashPassword = bcrypt.hashSync(password, 7);
            const newUser = new User({ username, password: hashPassword });
            await newUser.save();
            const token = generateAccessToken(newUser._id, newUser.username);
            res.cookie('token', token, { httpOnly: true, secure: false, sameSite: 'Strict' });
            res.header('Authorization', `Bearer ${token}`);
            return res.redirect('/');
        } catch (err) {
            console.error('Error during registration:', err);
            res.status(500).json({ message: "Internal server error" });
        }
    }

    async getUser(req, res) {
        try {
            const users = await User.find();
            return res.json(users);
        } catch (err) {
            console.error('Error fetching users:', err);
            res.status(500).json({ message: "Internal server error" });
        }
    }
}

module.exports = new AuthController();