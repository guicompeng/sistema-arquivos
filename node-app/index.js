const express = require('express');
const multer = require('multer');
const fs = require('fs');

const uploadPath = '/mnt/gfs';
if (!fs.existsSync(uploadPath)) fs.mkdirSync(uploadPath, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadPath),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});

const upload = multer({ storage });

const app = express();

app.post('/upload', upload.single('file'), (req, res) => {
  res.send(`Arquivo salvo em ${req.file.path}`);
});

app.get('/', (req, res) => {
  res.send(`Servidor ${process.env.HOSTNAME} pronto`);
});

app.listen(3000, () => console.log(`Servidor ${process.env.HOSTNAME} rodando na porta 3000`));
