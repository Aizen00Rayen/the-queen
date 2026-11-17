require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const path = require('path');
const fs = require('fs');
const express = require('express');
const helmet = require('helmet');
const compression = require('compression');

require('./db');
require('./seed/seed')();

const app = express();
app.set('trust proxy', 1);
app.disable('x-powered-by');
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com', 'data:'],
      imgSrc: ["'self'", 'data:', 'blob:'],
      connectSrc: ["'self'"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));
app.use(compression());
app.use(express.json({ limit: '200kb' }));

app.use('/api/admin', require('./routes/admin'));
app.use('/api', require('./routes/public'));
app.use('/api', (req, res) => res.status(404).json({ error: 'Not found' }));

const { UPLOAD_DIR } = require('./paths');
app.use('/uploads', express.static(UPLOAD_DIR, { maxAge: '30d', immutable: true }));

const PUBLIC_DIR = path.join(__dirname, 'public');
if (fs.existsSync(PUBLIC_DIR)) {
  app.use('/assets', express.static(path.join(PUBLIC_DIR, 'assets'), { maxAge: '1y', immutable: true }));
  app.use(express.static(PUBLIC_DIR, { maxAge: '7d', index: false }));
  app.get('*', (req, res) => res.sendFile(path.join(PUBLIC_DIR, 'index.html')));
} else {
  app.get('/', (req, res) => res.send('API running. Build the client with `npm run build`.'));
}

app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.status ? err.message : 'Erreur serveur' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`👑 The Queen running on http://localhost:${PORT}`));
