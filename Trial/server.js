const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');

const app = express();
const port = 3000;
const JWT_SECRET = 'your-secret-key'; // In production, use environment variable

// Middleware
app.use(bodyParser.json());
app.use(express.static('public'));
app.use(express.static('views')); // Serve files from views directory

// Database setup
const db = new sqlite3.Database('./db/healthcare.db', (err) => {
    if (err) {
        console.error('Error opening database:', err);
    } else {
        console.log('Connected to SQLite database');
        initDatabase();
    }
});

// Initialize database with tables
function initDatabase() {
    // Users table (for both patients and doctors)
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        name TEXT NOT NULL,
        role TEXT NOT NULL,
        specialization TEXT,
        phone TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Appointments table
    db.run(`CREATE TABLE IF NOT EXISTS appointments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        patient_id INTEGER NOT NULL,
        doctor_id INTEGER NOT NULL,
        appointment_date DATETIME NOT NULL,
        status TEXT DEFAULT 'pending',
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (patient_id) REFERENCES users(id),
        FOREIGN KEY (doctor_id) REFERENCES users(id)
    )`);

    // Emergency contacts table
    db.run(`CREATE TABLE IF NOT EXISTS emergency_contacts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        patient_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        phone TEXT NOT NULL,
        relationship TEXT NOT NULL,
        FOREIGN KEY (patient_id) REFERENCES users(id)
    )`);

    // Insert sample doctor
    const sampleDoctor = {
        email: 'doctor@example.com',
        password: bcrypt.hashSync('password123', 10),
        name: 'Dr. John Smith',
        role: 'doctor',
        specialization: 'General Medicine',
        phone: '1234567890'
    };

    db.run(`INSERT OR IGNORE INTO users (email, password, name, role, specialization, phone) 
            VALUES (?, ?, ?, ?, ?, ?)`,
        [sampleDoctor.email, sampleDoctor.password, sampleDoctor.name, 
         sampleDoctor.role, sampleDoctor.specialization, sampleDoctor.phone]);
}

// Authentication middleware
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid token' });
        }
        req.user = user;
        next();
    });
};

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'login.html'));
});

app.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'register.html'));
});

// Authentication routes
app.post('/api/register', async (req, res) => {
    const { email, password, name, role, specialization, phone } = req.body;
    
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        db.run(`INSERT INTO users (email, password, name, role, specialization, phone) 
                VALUES (?, ?, ?, ?, ?, ?)`,
            [email, hashedPassword, name, role, specialization, phone],
            function(err) {
                if (err) {
                    if (err.message.includes('UNIQUE constraint failed')) {
                        return res.status(400).json({ error: 'Email already exists' });
                    }
                    return res.status(500).json({ error: err.message });
                }
                res.status(201).json({ id: this.lastID });
            });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/login', (req, res) => {
    const { email, password } = req.body;
    
    db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET);
        res.json({ token, user: { id: user.id, email: user.email, name: user.name, role: user.role } });
    });
});

// Appointment routes
app.post('/api/appointments', authenticateToken, (req, res) => {
    const { doctor_id, appointment_date, notes } = req.body;
    const patient_id = req.user.id;

    db.run(`INSERT INTO appointments (patient_id, doctor_id, appointment_date, notes) 
            VALUES (?, ?, ?, ?)`,
        [patient_id, doctor_id, appointment_date, notes],
        function(err) {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            res.status(201).json({ id: this.lastID });
        });
});

app.get('/api/appointments', authenticateToken, (req, res) => {
    const userId = req.user.id;
    const role = req.user.role;
    
    let query = `
        SELECT a.*, 
               p.name as patient_name, 
               d.name as doctor_name, 
               d.specialization
        FROM appointments a
        JOIN users p ON a.patient_id = p.id
        JOIN users d ON a.doctor_id = d.id
        WHERE ${role === 'doctor' ? 'a.doctor_id' : 'a.patient_id'} = ?
        ORDER BY a.appointment_date DESC
    `;
    
    db.all(query, [userId], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(rows);
    });
});

// Emergency contact routes
app.post('/api/emergency-contacts', authenticateToken, (req, res) => {
    const { name, phone, relationship } = req.body;
    const patient_id = req.user.id;

    db.run(`INSERT INTO emergency_contacts (patient_id, name, phone, relationship) 
            VALUES (?, ?, ?, ?)`,
        [patient_id, name, phone, relationship],
        function(err) {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            res.status(201).json({ id: this.lastID });
        });
});

app.get('/api/emergency-contacts', authenticateToken, (req, res) => {
    const patient_id = req.user.id;
    
    db.all('SELECT * FROM emergency_contacts WHERE patient_id = ?', [patient_id], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(rows);
    });
});

// Doctor routes
app.get('/api/doctors', (req, res) => {
    db.all('SELECT id, name, specialization, phone FROM users WHERE role = ?', ['doctor'], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(rows);
    });
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
}); 