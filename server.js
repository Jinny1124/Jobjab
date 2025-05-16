import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import bodyParser from 'body-parser';
import cors from 'cors';
import session from 'express-session';
import mysql from 'mysql2';
import bcrypt from 'bcrypt';

const app = express();
const PORT = 3000;

// Resolve __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cors({
  origin: 'http://localhost:3000', // Adjust to your frontend's origin
  credentials: true
}));

// Configure session middleware
app.use(session({
  secret: 'your-secret-key', // Replace with a secure secret key
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false } // Set to true if using HTTPS
}));

// Create a MySQL connection
const db = mysql.createConnection({
  host: 'localhost', // Replace with your database host
  user: 'root',      // Replace with your database username
  password: '',      // Replace with your database password
  database: 'jobjab_db' // Replace with your database name
});

// Connect to the database
db.connect((err) => {
  if (err) {
    console.error('Error connecting to the database:', err);
    return;
  }
  console.log('Connected to the MySQL database.');

  db.query('SELECT 1', (err, results) => {
    if (err) {
      console.error('Error testing database connection:', err);
    } else {
      console.log('Database connection is working.');
    }
  });
});

// Serve static files
app.use('/components', express.static(path.join(__dirname, 'components')));
app.use('/src', express.static(path.join(__dirname, 'src')));

// Serve HTML files
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'components', '1homepage.html'));
});
app.get('/views/2login.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'components', '2login.html'));
});
app.get('/views/3signup.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'components', '3signup.html'));
});
app.get('/views/4inhomepage.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'components', '4inhomepage.html'));
});
app.get('/views/5accemployer.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'components', '5accemployer.html'));
});
app.get('/views/6accemplyee.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'components', '6accemplyee.html'));
});

// LOGIN
app.post('/api/login', (req, res) => {
  const { username_or_email, password } = req.body;

  if (!username_or_email || !password) {
    return res.status(400).json({ message: 'กรุณากรอกข้อมูลให้ครบถ้วน' });
  }

  const sql = `SELECT * FROM signup WHERE username = ? OR email = ?`;

  db.query(sql, [username_or_email, username_or_email], async (err, results) => {
    if (err) {
      console.error('Error fetching user from database:', err);
      return res.status(500).json({ message: 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ' });
    }

    if (results.length === 0) {
      return res.status(401).json({ message: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' });
    }

    const user = results[0];
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ message: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' });
    }

    req.session.userId = user.id; // Save user ID in session
    res.json({ success: true, message: 'เข้าสู่ระบบสำเร็จ', user: { email: user.email } });
  });
});

// SIGNUP
app.post('/api/signup', async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ message: 'กรุณากรอกข้อมูลให้ครบถ้วน' });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const sql = `INSERT INTO signup (username, email, password) VALUES (?, ?, ?)`;

  db.query(sql, [username, email, hashedPassword], (err, result) => {
    if (err) {
      console.error('Error inserting user into database:', err);
      return res.status(500).json({ message: 'เกิดข้อผิดพลาดในการสมัครสมาชิก' });
    }

    res.status(200).json({ message: 'User registered successfully' });
  });
});


// Start server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});