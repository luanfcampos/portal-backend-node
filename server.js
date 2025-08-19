require('dotenv').config();

const express = require('express');
const cors = require('cors');
const axios = require('axios');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

// Configuração da NewsAPI
const NEWS_API_KEY = process.env.NEWS_API_KEY;
const NEWS_API_BASE_URL = 'https://newsapi.org/v2';

// Middleware
app.use(cors());
app.use(express.json());

// Servir arquivos estáticos do React
app.use(express.static(path.join(__dirname, 'build')));

// Rota para buscar notícias
app.get('/api/news', async (req, res) => {
  try {
    const {
      q = 'tecnologia OR jogos OR games OR gaming',
      category = '',
      language = 'pt',
      page = 1,
      pageSize = 20
    } = req.query;

    // Parâmetros para a NewsAPI
    const params = {
      apiKey: NEWS_API_KEY,
      q: q,
      language: language,
      page: page,
      pageSize: pageSize,
      sortBy: 'publishedAt'
    };

    // Se categoria foi especificada, usar endpoint de top-headlines
    let url = `${NEWS_API_BASE_URL}/everything`;
    if (category) {
      url = `${NEWS_API_BASE_URL}/top-headlines`;
      params.category = category;
    }

    // Fazer requisição para a NewsAPI
    const response = await axios.get(url, { params });

    if (response.status === 200) {
      const data = response.data;
      
      // Filtrar artigos sem imagem ou com conteúdo removido
      const filteredArticles = data.articles.filter(article => 
        article.title !== '[Removed]' && 
        article.description && 
        article.urlToImage
      );

      res.json({
        status: 'success',
        totalResults: filteredArticles.length,
        articles: filteredArticles
      });
    } else {
      throw new Error('Erro na resposta da API');
    }

  } catch (error) {
    console.error('Erro ao buscar notícias:', error.message);
    
    // Retornar dados mockados em caso de erro
    const mockArticles = [
      {
        title: "PlayStation 5 Pro: Novos detalhes sobre especificações técnicas",
        description: "Sony revela mais informações sobre o hardware do PS5 Pro, incluindo melhorias na GPU e suporte para ray tracing avançado.",
        url: "#",
        urlToImage: "https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=400&h=200&fit=crop",
        publishedAt: new Date().toISOString(),
        source: { name: "PlayStation Blog" }
      },
      {
        title: "ChatGPT-5 pode chegar ainda este ano, diz OpenAI",
        description: "A próxima versão do modelo de linguagem da OpenAI promete capacidades ainda mais avançadas de raciocínio e compreensão.",
        url: "#",
        urlToImage: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=400&h=200&fit=crop",
        publishedAt: new Date(Date.now() - 3600000).toISOString(),
        source: { name: "TechCrunch" }
      },
      {
        title: "Nintendo anuncia novo Direct para março",
        description: "Evento digital da Nintendo promete revelar novos jogos para Switch e atualizações sobre títulos já anunciados.",
        url: "#",
        urlToImage: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=200&fit=crop",
        publishedAt: new Date(Date.now() - 7200000).toISOString(),
        source: { name: "Nintendo Life" }
      }
    ];

    res.json({
      status: 'success',
      totalResults: mockArticles.length,
      articles: mockArticles,
      note: 'Usando dados de demonstração (API indisponível)'
    });
  }
});

// Rota para busca personalizada de notícias
app.get('/api/news/search', async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q) {
      return res.status(400).json({
        status: 'error',
        message: 'Parâmetro de busca (q) é obrigatório'
      });
    }

    // Adicionar termos relacionados a jogos e tecnologia
    const enhancedQuery = `${q} AND (tecnologia OR jogos OR games OR gaming OR tech)`;

    const params = {
      apiKey: NEWS_API_KEY,
      q: enhancedQuery,
      language: 'pt',
      sortBy: 'publishedAt',
      pageSize: 20
    };

    const response = await axios.get(`${NEWS_API_BASE_URL}/everything`, { params });

    if (response.status === 200) {
      const data = response.data;
      res.json({
        status: 'success',
        query: q,
        totalResults: data.totalResults || 0,
        articles: data.articles || []
      });
    } else {
      throw new Error('Erro na resposta da API');
    }

  } catch (error) {
    console.error('Erro ao buscar notícias:', error.message);
    
    // Retornar dados mockados personalizados para a busca
    const mockArticles = [
      {
        title: `Resultados para "${req.query.q}"`,
        description: `Mostrando resultados relacionados a ${req.query.q}`,
        url: "#",
        urlToImage: "https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=400&h=200&fit=crop",
        publishedAt: new Date().toISOString(),
        source: { name: "Demo Source" }
      }
    ];

    res.json({
      status: 'success',
      query: req.query.q,
      totalResults: mockArticles.length,
      articles: mockArticles,
      note: 'Usando dados de demonstração (API indisponível)'
    });
  }
});

// Rota para listar categorias
app.get('/api/news/categories', (req, res) => {
  const categories = [
    { id: 'technology', name: 'Tecnologia', description: 'Notícias sobre tecnologia' },
    { id: 'gaming', name: 'Jogos', description: 'Notícias sobre jogos e gaming' },
    { id: 'business', name: 'Negócios', description: 'Notícias de negócios tech' },
    { id: 'science', name: 'Ciência', description: 'Notícias científicas' }
  ];

  res.json({
    status: 'success',
    categories: categories
  });
});

// Servir o React app para todas as outras rotas
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

// Iniciar servidor
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor rodando na porta ${PORT}`);
  console.log(`Acesse: http://localhost:${PORT}`);
});

module.exports = app;

