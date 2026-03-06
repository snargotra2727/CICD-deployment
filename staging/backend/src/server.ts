import express, { Request, Response } from 'express';
import cors from 'cors';
import mysql from 'mysql2/promise';

const app = express();
const PORT = process.env.PORT || 3000;

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'mysql-staging',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'rootpassword',
  database: process.env.DB_NAME || 'user_management_staging',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

(async () => {
  try {
    const connection = await pool.getConnection();
    console.log('✅ Staging Database connected');

    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        first_name VARCHAR(50),
        last_name VARCHAR(50),
        age INT,
        city VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Users table ready');
    connection.release();
  } catch (error) {
    console.error('❌ Database connection failed:', error);
  }
})();

app.get('/api/health', async (req: Request, res: Response) => {
  try {
    await pool.query('SELECT 1');
    res.json({ 
      success: true,
      status: 'healthy', 
      database: 'connected',
      environment: 'staging',
      timestamp: new Date().toISOString() 
    });
  } catch (error: any) {
    res.status(500).json({ 
      success: false,
      status: 'unhealthy', 
      database: 'disconnected',
      error: error.message 
    });
  }
});

app.get('/api/users', async (req: Request, res: Response) => {
  try {
    const [rows] = await pool.query('SELECT * FROM users ORDER BY created_at DESC');
    res.json({ 
      success: true, 
      data: rows,
      count: Array.isArray(rows) ? rows.length : 0
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/users', async (req: Request, res: Response) => {
  try {
    const { username, email, first_name, last_name, age, city } = req.body;
    
    if (!username || !email) {
      return res.status(400).json({ 
        success: false, 
        message: 'Username and email are required' 
      });
    }

    const [result] = await pool.query(
      `INSERT INTO users (username, email, first_name, last_name, age, city) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [username, email, first_name || null, last_name || null, age || null, city || null]
    );
    
    const insertResult = result as any;
    const [newUser] = await pool.query('SELECT * FROM users WHERE id = ?', [insertResult.insertId]);
    const users = newUser as any[];
    
    res.status(201).json({ 
      success: true, 
      message: 'User created successfully',
      data: users[0]
    });
  } catch (error: any) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ 
        success: false, 
        message: 'Username or email already exists' 
      });
    }
    res.status(500).json({ success: false, error: error.message });
  }
});

app.delete('/api/users/:id', async (req: Request, res: Response) => {
  try {
    const [result] = await pool.query('DELETE FROM users WHERE id = ?', [req.params.id]);
    const deleteResult = result as any;
    
    if (deleteResult.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    res.json({ success: true, message: 'User deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/dashboard', async (req: Request, res: Response) => {
  try {
    const [totalRows] = await pool.query('SELECT COUNT(*) as count FROM users');
    const totalResult = totalRows as any[];
    
    res.json({
      success: true,
      data: {
        totalUsers: totalResult[0].count,
        environment: 'staging',
        timestamp: new Date().toISOString()
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/', (req: Request, res: Response) => {
  res.json({
    message: 'User Management API - STAGING',
    version: '1.0.0',
    status: 'online',
    environment: 'staging'
  });
});

app.listen(PORT, () => {
  console.log('='.repeat(50));
  console.log(`🧪 STAGING Server running!`);
  console.log(`📌 URL: http://localhost:${PORT}`);
  console.log(`📊 Health: http://localhost:${PORT}/api/health`);
  console.log('='.repeat(50));
});
