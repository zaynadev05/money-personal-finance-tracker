import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();
// Convert process.env.PORT to a number cleanly to prevent TypeScript compilation/overload errors
const PORT: number = Number(process.env.PORT) || 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const distPath = path.join(__dirname, 'dist');

// Serve static assets
app.use(express.static(distPath));

// Fallback all routes to index.html for client-side routing
app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Production server is running on port ${PORT}`);
});
