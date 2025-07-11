
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const mysql = require('mysql2/promise');
const axios = require('axios');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('dist'));

// Multer setup for file uploads
const upload = multer({ 
  dest: 'uploads/',
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  }
});

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || '10.51.0.11',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'P!nnacl3451qaz',
  database: process.env.DB_NAME || 'bi_sync_data',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

// Ollama configuration
const ollamaConfig = {
  host: process.env.OLLAMA_HOST || '10.51.0.15',
  port: process.env.OLLAMA_PORT || '11434',
  model: process.env.OLLAMA_MODEL || 'qwen2.5:7b'
};

// Create MySQL connection pool
const pool = mysql.createPool(dbConfig);

// Test database connection
async function testDbConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('✅ Database connected successfully');
    
    // Test query to get table structure
    const [rows] = await connection.execute('DESCRIBE pim_product');
    console.log('📊 pim_product table columns:', rows.map(r => r.Field).join(', '));
    
    connection.release();
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
  }
}

// Test Ollama connection
async function testOllamaConnection() {
  try {
    const response = await axios.post(`http://${ollamaConfig.host}:${ollamaConfig.port}/api/generate`, {
      model: ollamaConfig.model,
      prompt: 'Hello, are you working?',
      stream: false
    });
    console.log('✅ Ollama connected successfully');
  } catch (error) {
    console.error('❌ Ollama connection failed:', error.message);
  }
}

// Chat endpoint
app.post('/api/chat', async (req, res) => {
  try {
    const { message, files, history } = req.body;
    
    console.log('💬 Received chat message:', message);
    console.log('📁 Files:', files?.length || 0);
    
    // Prepare context for AI
    let context = `You are DataScribe AI, a database assistant. You help users process data and insert it into the pim_product table in the bi_sync_data MySQL database.

Database connection: ${dbConfig.host}:${dbConfig.port}/${dbConfig.database}
Current request: ${message}`;

    if (files && files.length > 0) {
      context += `\n\nFiles uploaded: ${files.map(f => f.name).join(', ')}`;
    }

    // Call Ollama API
    const ollamaResponse = await axios.post(`http://${ollamaConfig.host}:${ollamaConfig.port}/api/generate`, {
      model: ollamaConfig.model,
      prompt: context,
      stream: false
    });

    const aiResponse = ollamaResponse.data.response;
    
    // Log the interaction
    console.log('🤖 AI Response:', aiResponse.substring(0, 100) + '...');
    
    res.json({
      success: true,
      response: aiResponse,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Chat error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to process chat request',
      details: error.message
    });
  }
});

// File upload endpoint
app.post('/api/upload', upload.array('files'), async (req, res) => {
  try {
    const files = req.files;
    console.log('📁 Files uploaded:', files.map(f => f.originalname));
    
    // Process files here - parse CSV, Excel, etc.
    const processedFiles = files.map(file => ({
      name: file.originalname,
      size: file.size,
      type: file.mimetype,
      path: file.path
    }));
    
    res.json({
      success: true,
      files: processedFiles
    });
    
  } catch (error) {
    console.error('❌ Upload error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to upload files'
    });
  }
});

// Database query endpoint
app.post('/api/database/query', async (req, res) => {
  try {
    const { query, params } = req.body;
    
    console.log('🗄️  Executing query:', query);
    
    const connection = await pool.getConnection();
    const [results] = await connection.execute(query, params || []);
    connection.release();
    
    res.json({
      success: true,
      results: results,
      rowCount: Array.isArray(results) ? results.length : results.affectedRows
    });
    
  } catch (error) {
    console.error('❌ Database query error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Database query failed',
      details: error.message
    });
  }
});

// Health check endpoint
app.get('/api/health', async (req, res) => {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    services: {}
  };
  
  // Check database
  try {
    const connection = await pool.getConnection();
    await connection.execute('SELECT 1');
    connection.release();
    health.services.database = 'connected';
  } catch (error) {
    health.services.database = 'disconnected';
    health.status = 'degraded';
  }
  
  // Check Ollama
  try {
    await axios.get(`http://${ollamaConfig.host}:${ollamaConfig.port}/api/tags`);
    health.services.ollama = 'connected';
  } catch (error) {
    health.services.ollama = 'disconnected';
    health.status = 'degraded';
  }
  
  res.json(health);
});

// Serve React app for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌐 Frontend: http://localhost:${PORT}`);
  console.log(`🔌 API: http://localhost:${PORT}/api`);
  
  // Test connections
  testDbConnection();
  testOllamaConnection();
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('🔄 Shutting down gracefully...');
  await pool.end();
  process.exit(0);
});
