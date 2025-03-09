const express = require('express');
const mysql = require('mysql');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const path = require('path');

const app = express();
const port = 3002;
const host = '192.168.181.25'; // Change to your machine's IP address

const db = mysql.createPool({
    connectionLimit: 10,
    host: 'localhost',
    user: 'root',       
    password: '#Mothish@123', 
    database: 'users'  
});

db.query('SELECT 1', (err) => {
    if (err) {
        console.error('MySQL Connection Failed:', err.message);
        process.exit(1);
    }
    console.log('Connected to MySQL Database (Localhost)');
});
app.use(cors({ origin: '*' }));

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname)));

app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'welcome.html')));
app.get('/login', (req, res) => res.sendFile(path.join(__dirname, 'login.html')));
app.get('/dashboard', (req, res) => res.sendFile(path.join(__dirname, 'dashboard.html')));
app.get('/register', (req, res) => res.sendFile(path.join(__dirname, 'register.html')));

app.post('/signin', async (req, res) => {
    const { name, email, password, rollno, cgpa } = req.body;

    if (!name || !email || !password || !rollno || !cgpa) {
        return res.status(400).json({ success: false, message: 'All fields are required.' });
    }
    try {
        const checkQuery = 'SELECT id FROM users WHERE email = ?';
        db.query(checkQuery, [email], async (err, results) => {
            if (err) {
                console.error('❌ Error checking email:', err.message);
                return res.status(500).json({ success: false, message: 'Database error. Try again later.' });
            }

            if (results.length > 0) {
                return res.status(400).json({ success: false, message: 'Email already registered. Please login.' });
            }

            const hashedPassword = await bcrypt.hash(password, 10);
            const query = 'INSERT INTO users (name, email, password, roll_no, cgpa) VALUES (?, ?, ?, ?, ?)';
            db.query(query, [name, email, hashedPassword, rollno, cgpa], (err) => {
                if (err) {
                    console.error('Error inserting user:', err.message);
                    return res.status(500).json({ success: false, message: 'Database error. Try again later.' });
                }
                res.status(201).json({ success: true, message: 'Registration successful! Please log in.' });
            });
        });
    } catch (err) {
        console.error('Error hashing password:', err.message);
        res.status(500).json({ success: false, message: 'An error occurred. Try again later.' });
    }
});

app.post('/login', (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    const query = 'SELECT * FROM users WHERE email = ?';
    db.query(query, [email], async (err, results) => {
        if (err) {
            console.error('Database error:', err.message);
            return res.status(500).json({ success: false, message: 'Database error. Try again later.' });
        }

        if (results.length === 0) {
            return res.status(401).json({ success: false, message: 'Invalid email or password.' });
        }
        const user = results[0];
        const passwordMatch = await bcrypt.compare(password, user.password);

        if (passwordMatch) {
            res.json({ success: true, message: 'Login successful!', redirect: '/dashboard', email: user.email });
        } else {
            res.status(401).json({ success: false, message: 'Invalid email or password.' });
        }
    });
});

app.get('/getUserDetails', (req, res) => {
    const { email } = req.query;
    if (!email) {
        return res.status(400).json({ success: false, message: 'Email is required.' });
    }
    const query = 'SELECT name, email, roll_no, cgpa FROM users WHERE email = ?';
    db.query(query, [email], (err, results) => {
        if (err) {
            console.error('Database error:', err.message);
            return res.status(500).json({ success: false, message: 'Database error. Try again later.' });
        }

        if (results.length === 0) {
            return res.status(404).json({ success: false, message: 'User not found.' });
        }

        res.json({ success: true, user: results[0] });
    });
});
app.post('/register', async (req, res) => {
    const { name, email, rollno, cgpa, year, branch, semester, elective } = req.body;

    if (!name || !email || !rollno || !cgpa || !year || !branch || !semester || !elective) {
        return res.status(400).json({ success: false, message: "All fields are required." });
    }

    try {
        // Check if the user already exists in `openelective` table
        const checkUserQuery = 'SELECT RollNumber FROM openelective WHERE Email = ?';
        db.query(checkUserQuery, [email], async (err, results) => {
            if (err) {
                console.error('Error checking email:', err.message);
                return res.status(500).json({ success: false, message: 'Database error.' });
            }

            if (results.length > 0) {
                return res.status(400).json({ success: false, message: 'Email already registered.' });
            }

            // Insert user data into `openelective` table
            const electiveInsertQuery = `
                INSERT INTO openelective (RollNumber, Name, Email, CGPA, Year, Branch, Semester, OpenElective) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
            db.query(electiveInsertQuery, [rollno, name, email, cgpa, year, branch, semester, elective], (err) => {
                if (err) {
                    console.error('Error inserting elective:', err.message);
                    return res.status(500).json({ success: false, message: 'Database error.' });
                }

                res.status(201).json({ success: true, message: 'Registration successful!' });
            });
        });
    } catch (err) {
        console.error('Error:', err.message);
        res.status(500).json({ success: false, message: 'An error occurred. Try again later.' });
    }
});
app.listen(port, host, () => {
    console.log(`🚀 Server running at: http://${host}:${port}`);
});
