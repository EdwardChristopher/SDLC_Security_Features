const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
const verifyToken = require('../utils/verifyToken');

const router = express.Router();
const userFile = path.join(__dirname, '../data/user.json');
const secretKey = 'yourSecretKey';

// Helper function to read and write users from the user.json file
const readUsers = () => {
    const data = fs.readFileSync(userFile);
    return JSON.parse(data);
};

const writeUsers = (users) => {
    fs.writeFileSync(userFile, JSON.stringify(users, null, 2));
};

const validator = require('validator');

router.post('/register', async (req, res) => {
    const { username, password } = req.body;

    // Sanitize and validate username
    if (!username || !password) {
        return res.status(400).json({ message: 'Username and password are required.' });
    }

    if (!validator.isAlphanumeric(username)) {
        return res.status(400).json({ message: 'Username must be alphanumeric.' });
    }

    // Check if user already exists
    const users = readUsers();
    const existingUser = users.find(user => user.username === username);

    if (existingUser) {
        return res.status(400).json({ message: 'User already exists.' });
    }

    // Hash the password and save the new user
    const hashedPassword = await bcrypt.hash(password, 10);

    users.push({ username, password: hashedPassword });
    writeUsers(users);

    res.status(201).json({ message: 'User registered successfully.' });
});


router.post('/login', async (req, res) => {
    const { username, password } = req.body;

    // Sanitize and validate username
    if (!username || !password) {
        return res.status(400).json({ message: 'Username and password are required.' });
    }

    if (!validator.isAlphanumeric(username)) {
        return res.status(400).json({ message: 'Username must be alphanumeric.' });
    }

    // Fetch the user from user.json
    const users = readUsers();
    const user = users.find(user => user.username === username);

    if (!user) {
        return res.status(400).json({ message: 'Invalid username or password.' });
    }

    // Verify the password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
        return res.status(400).json({ message: 'Invalid username or password.' });
    }

    // Generate JWT token
    const token = jwt.sign({ username: user.username }, secretKey, { expiresIn: '1h' });
    res.json({ token });
});

// Protected route
router.get('/protected', verifyToken, (req, res) => {
    res.json({ message: `Welcome ${req.user.username}, this is a protected route.` });
});

module.exports = router;
