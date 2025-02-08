import express from 'express';
import cors from 'cors';
import axios from 'axios';
import NodeCache from 'node-cache';
import dns from 'dns';
import { promisify } from 'util';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const cache = new NodeCache({ stdTTL: 300 }); // Cache por 5 minutos

// Configuração do CORS para produção e desenvolvimento
const corsOptions = {
  origin: process.env.NODE_ENV === 'production'
    ? [/\.onrender\.com$/, process.env.CLIENT_URL].filter(Boolean)
    : 'http://localhost:5173',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  maxAge: 86400 // 24 horas
};

app.use(cors(corsOptions));
app.use(express.json());

// Servir arquivos estáticos do build do Vite
app.use(express.static(path.join(__dirname, 'dist')));

// Middleware para logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Função para resolver DNS
async function resolveDNS(hostname, customDNS) {
  if (!customDNS) {
    return hostname; // Usa DNS padrão do sistema
  }

  try {
    // Configura o resolver com o DNS customizado
    const resolver = new dns.Resolver();
    resolver.setServers([customDNS]);

    // Resolve o hostname
    const resolve4 = promisify(resolver.resolve4.bind(resolver));
    const addresses = await resolve4(hostname);
    
    if (addresses && addresses.length > 0) {
      return addresses[0]; // Retorna o primeiro IP encontrado
    }
  } catch (error) {
    console.error('DNS resolution error:', error);
  }
  
  return hostname; // Fallback para o hostname original
}

// Middleware para validação de parâmetros
const validateParams = (req, res, next) => {
  const { url } = req.query;
  
  if (!url) {
    return res.status(400).json({ error: 'URL parameter is required' });
  }

  try {
    new URL(url);
    next();
  } catch (error) {
    res.status(400).json({ error: 'Invalid URL format' });
  }
};

// Rota principal do proxy IPTV
app.get('/api/iptv', validateParams, async (req, res) => {
  try {
    const { url, username, password, action, stream_id, limit, dns: customDNS } = req.query;
    
    // Gera uma chave única para o cache baseada nos parâmetros
    const cacheKey = `${url}-${username}-${password}-${action}-${stream_id}-${limit}-${customDNS}`;
    
    // Verifica se há dados em cache
    const cachedData = cache.get(cacheKey);
    if (cachedData) {
      console.log('Returning cached data');
      return res.json(cachedData);
    }

    // Constrói a URL final
    const targetUrl = new URL(url);
    const params = new URLSearchParams(targetUrl.search);
    
    if (username) params.set('username', username);
    if (password) params.set('password', password);
    if (action) params.set('action', action);
    if (stream_id) params.set('stream_id', stream_id);
    if (limit) params.set('limit', limit);
    
    targetUrl.search = params.toString();

    // Resolve o DNS se necessário
    const resolvedHostname = await resolveDNS(targetUrl.hostname, customDNS);
    const finalUrl = new URL(targetUrl.toString());
    finalUrl.hostname = resolvedHostname;

    // Faz a requisição para o servidor IPTV
    const response = await axios({
      method: 'get',
      url: finalUrl.toString(),
      timeout: 5000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    // Armazena os dados em cache
    cache.set(cacheKey, response.data);

    res.json(response.data);
  } catch (error) {
    console.error('Proxy error:', error.message);
    
    if (error.response) {
      res.status(error.response.status).json({
        error: `Proxy error: ${error.response.status} - ${error.response.statusText}`
      });
    } else {
      res.status(500).json({
        error: `Internal server error: ${error.message}`
      });
    }
  }
});

// Rota de healthcheck
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Rota para todas as outras requisições - serve o index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`Proxy server running on port ${PORT}`);
}); 