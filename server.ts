import express from 'express';
import dotenv from 'dotenv';
import path from 'path';

// Carregar variáveis de ambiente do arquivo .env
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Importar o handler da Vercel
import extractPdfHandler from './api/extract-pdf';

// Registrar o endpoint. Não aplicamos middlewares de parsing de body (como express.json())
// pois o handler lê o stream do corpo bruto diretamente para processar o binário do PDF.
app.post('/api/extract-pdf', (req, res) => {
  extractPdfHandler(req, res);
});

// Middleware de tratamento de erros global
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('[Backend Error]:', err);
  res.status(500).json({ error: err.message || 'Erro interno no servidor' });
});

// Rota de status simples
app.get('/api/status', (req, res) => {
  res.json({ 
    status: 'healthy', 
    openai_key_configured: !!process.env.OPENAI_API_KEY,
    supabase_url_configured: !!process.env.VITE_SUPABASE_URL
  });
});

app.listen(PORT, () => {
  console.log(`\n=============================================================`);
  console.log(`[Solum Financeiro Backend] Servidor rodando em http://localhost:${PORT}`);
  console.log(`[Solum Financeiro Backend] Endpoint de IA: http://localhost:${PORT}/api/extract-pdf`);
  console.log(`=============================================================\n`);
});
