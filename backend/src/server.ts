import express, { Request, Response } from 'express';
import cors from 'cors';
import mysql from 'mysql2/promise';

const app = express();
const PORT = 3000;  // Fixed port for development

// Create MySQL connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'mysql',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'rootpassword',
  database: process.env.DB_NAME || 'user_management',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Test database connection on startup
(async () => {
  try {
    const connection = await pool.getConnection();
    console.log('✅ Database connected successfully');

    // Create users table if it doesn't exist
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

    // Insert sample data if table is empty
    const [rows] = await connection.query('SELECT COUNT(*) as count FROM users');
    if (rows[0].count === 0) {
      await connection.query(`
        INSERT INTO users (username, email, first_name, last_name, age, city) VALUES
        ('john_doe', 'john@example.com', 'John', 'Doe', 28, 'New York'),
        ('jane_smith', 'jane@example.com', 'Jane', 'Smith', 32, 'Los Angeles'),
        ('bob_wilson', 'bob@example.com', 'Bob', 'Wilson', 24, 'Chicago')
      `);
      console.log('✅ Sample data inserted');
    }

    connection.release();
  } catch (error) {
    console.error('❌ Database connection failed:', error);
  }
})();

// ============ API ROUTES ============

// Health check
app.get('/api/health', async (req: Request, res: Response) => {
  try {
    const [rows] = await pool.query('SELECT 1 + 1 AS solution');
    res.json({ 
      success: true,
      status: 'healthy', 
      database: 'connected',
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

// Get all users
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

// Create user
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
    
    const [newUser] = await pool.query('SELECT * FROM users WHERE id = ?', [result.insertId]);
    
    res.status(201).json({ 
      success: true, 
      message: 'User created successfully',
      data: newUser[0]
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

// Delete user
app.delete('/api/users/:id', async (req: Request, res: Response) => {
  try {
    const [result] = await pool.query('DELETE FROM users WHERE id = ?', [req.params.id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    res.json({ success: true, message: 'User deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Dashboard stats
app.get('/api/dashboard', async (req: Request, res: Response) => {
  try {
    const [totalResult] = await pool.query('SELECT COUNT(*) as count FROM users');
    const [ageResult] = await pool.query('SELECT AVG(age) as avg FROM users WHERE age IS NOT NULL');
    
    const [cityResult] = await pool.query(`
      SELECT city, COUNT(*) as count 
      FROM users 
      WHERE city IS NOT NULL 
      GROUP BY city 
      ORDER BY count DESC 
      LIMIT 3
    `);
    
    const [todayResult] = await pool.query(`
      SELECT COUNT(*) as count 
      FROM users 
      WHERE DATE(created_at) = CURDATE()
    `);
    
    res.json({
      success: true,
      data: {
        totalUsers: totalResult[0].count,
        averageAge: Math.round(ageResult[0].avg) || 0,
        topCities: cityResult,
        newToday: todayResult[0].count,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Root endpoint
app.get('/', (req: Request, res: Response) => {
  res.json({
    message: 'User Management API',
    version: '1.0.0',
    status: 'online',
    endpoints: {
      health: '/api/health',
      users: '/api/users',
      dashboard: '/api/dashboard'
    }
  });
});

app.listen(PORT, () => {
  console.log('='.repeat(50));
  console.log(`🚀 Server is running in DEVELOPMENT mode!`);
  console.log(`📌 URL: http://localhost:${PORT}`);
  console.log(`📊 Health: http://localhost:${PORT}/api/health`);
  console.log(`👥 Users: http://localhost:${PORT}/api/users`);
  console.log(`🔧 Hot reload enabled - edit code and see changes instantly!`);
  console.log('='.repeat(50));
});
