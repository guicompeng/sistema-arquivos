const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

const uploadPath = '/mnt/gfs';
if (!fs.existsSync(uploadPath)) fs.mkdirSync(uploadPath, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadPath),
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const safeName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    cb(null, `${timestamp}-${safeName}`);
  }
});

const upload = multer({ 
  storage,
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB limit
  },
  fileFilter: (req, file, cb) => {
    // Aceitar todos os tipos de arquivo
    cb(null, true);
  }
});

const app = express();

// Middleware para parsing JSON
app.use(express.json());

// Configurar CORS se necessário
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

app.post('/upload', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Nenhum arquivo foi enviado' });
    }

    const response = {
      message: `Arquivo ${req.file.originalname} salvo com sucesso`,
      filename: req.file.filename,
      originalname: req.file.originalname,
      size: req.file.size,
      path: req.file.path,
      server: process.env.HOSTNAME || 'unknown',
      uploadTime: new Date().toISOString()
    };

    console.log(`[${response.server}] Upload realizado: ${req.file.originalname} (${req.file.size} bytes)`);
    res.json(response);
  } catch (error) {
    console.error(`Erro no upload: ${error.message}`);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Endpoint para listar arquivos
app.get('/files', (req, res) => {
  try {
    const files = fs.readdirSync(uploadPath);
    const fileList = files.map(filename => {
      const filePath = path.join(uploadPath, filename);
      const stats = fs.statSync(filePath);
      return {
        filename,
        size: stats.size,
        created: stats.ctime,
        modified: stats.mtime
      };
    });
    
    res.json({
      server: process.env.HOSTNAME || 'unknown',
      files: fileList,
      totalFiles: fileList.length
    });
  } catch (error) {
    console.error(`Erro ao listar arquivos: ${error.message}`);
    res.status(500).json({ error: 'Erro ao listar arquivos' });
  }
});

// Endpoint para download de arquivos
app.get('/download/:filename', (req, res) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join(uploadPath, filename);
    
    // Verificar se o arquivo existe
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Arquivo não encontrado' });
    }
    
    // Verificar se é um arquivo (não diretório)
    const stats = fs.statSync(filePath);
    if (!stats.isFile()) {
      return res.status(400).json({ error: 'Caminho não é um arquivo válido' });
    }
    
    // Obter o nome original do arquivo (remover timestamp)
    const originalName = filename.replace(/^\d+-/, '').replace(/_/g, ' ');
    
    console.log(`[${process.env.HOSTNAME || 'unknown'}] Download iniciado: ${filename}`);
    
    // Configurar headers para download
    res.setHeader('Content-Disposition', `attachment; filename="${originalName}"`);
    res.setHeader('Content-Type', 'application/octet-stream');
    
    // Enviar arquivo
    res.sendFile(filePath);
  } catch (error) {
    console.error(`Erro no download: ${error.message}`);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Endpoint para deletar arquivos
app.delete('/delete/:filename', (req, res) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join(uploadPath, filename);
    
    // Verificar se o arquivo existe
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Arquivo não encontrado' });
    }
    
    // Verificar se é um arquivo (não diretório)
    const stats = fs.statSync(filePath);
    if (!stats.isFile()) {
      return res.status(400).json({ error: 'Caminho não é um arquivo válido' });
    }
    
    // Deletar o arquivo
    fs.unlinkSync(filePath);
    
    console.log(`[${process.env.HOSTNAME || 'unknown'}] Arquivo deletado: ${filename}`);
    
    res.json({
      message: `Arquivo ${filename} removido com sucesso`,
      filename: filename,
      server: process.env.HOSTNAME || 'unknown',
      deletedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error(`Erro ao deletar arquivo: ${error.message}`);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Endpoint de status/health check
app.get('/', (req, res) => {
  const serverInfo = {
    server: process.env.HOSTNAME || 'unknown',
    status: 'online',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    memory: process.memoryUsage()
  };
  
  res.json(serverInfo);
});

// Endpoint específico para status
app.get('/status', (req, res) => {
  res.json({
    server: process.env.HOSTNAME || 'unknown',
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor ${process.env.HOSTNAME || 'unknown'} rodando na porta ${PORT}`);
  console.log(`Diretório de upload: ${uploadPath}`);
});
