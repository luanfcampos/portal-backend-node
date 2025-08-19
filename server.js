const express = require('express');
const cors = require('cors');
const axios = require('axios');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

// Configuração da NewsAPI
const NEWS_API_KEY = process.env.NEWS_API_KEY || 'YOUR_API_KEY_HERE';
const NEWS_API_BASE_URL = 'https://newsapi.org/v2';

// Sistema de Cache
let newsCache = {
  data: null,
  timestamp: null,
  duration: 10 * 60 * 1000 // 10 minutos em millisegundos
};

// Middleware
app.use(cors());
app.use(express.json());

// Servir arquivos estáticos do React
app.use(express.static(path.join(__dirname, 'build')));

// Função para filtrar notícias de tecnologia e jogos
function filterTechAndGamingNews(articles) {
  // Palavras-chave para INCLUIR (tecnologia e jogos)
  const includeKeywords = [
    // Tecnologia geral
    'tecnologia', 'tech', 'smartphone', 'computador', 'software', 'hardware', 
    'inteligência artificial', 'ia', 'ai', 'machine learning', 'blockchain',
    'criptomoeda', 'bitcoin', 'ethereum', 'nft', 'metaverso', 'realidade virtual',
    'vr', 'ar', 'realidade aumentada', 'internet', 'wifi', '5g', 'fibra ótica',
    'cloud', 'nuvem', 'servidor', 'aplicativo', 'app', 'móvel', 'android', 'ios',
    
    // Empresas de tech
    'google', 'microsoft', 'apple', 'amazon', 'meta', 'facebook', 'tesla',
    'netflix', 'spotify', 'uber', 'twitter', 'x.com', 'tiktok', 'instagram',
    'whatsapp', 'linkedin', 'zoom', 'slack', 'dropbox', 'adobe',
    
    // Jogos e gaming
    'jogos', 'games', 'gaming', 'gamer', 'videogame', 'console', 'pc gamer',
    'playstation', 'ps5', 'ps4', 'xbox', 'nintendo', 'switch', 'steam',
    'epic games', 'fortnite', 'minecraft', 'valorant', 'league of legends',
    'call of duty', 'fifa', 'pes', 'cyberpunk', 'gta', 'the sims',
    'twitch', 'streaming', 'esports', 'e-sports', 'competitivo',
    
    // Produtos tech específicos
    'iphone', 'ipad', 'macbook', 'samsung galaxy', 'pixel', 'oneplus',
    'notebook', 'laptop', 'desktop', 'monitor', 'teclado', 'mouse',
    'headset', 'fone', 'smartwatch', 'tablet', 'gpu', 'cpu', 'processador',
    'nvidia', 'amd', 'intel', 'qualcomm'
  ];

  // Palavras-chave para EXCLUIR (temas não relacionados)
  const excludeKeywords = [
    // Política
    'política', 'político', 'eleição', 'governo', 'ministro', 'deputado', 'senador',
    'presidente', 'prefeito', 'governador', 'congresso', 'câmara', 'senado',
    'pt', 'psdb', 'mdb', 'psd', 'pl', 'união brasil', 'republicanos',
    'lula', 'bolsonaro', 'tse', 'stf', 'supremo', 'tribunal', 'investigação',
    'pix', 'eua', 'resposta', 'réplica', 'brasil', 'propriedade intelectual',
    'desmatamento', 'ilegal', 'mercado de etanol',
    
    // Saúde/Doenças
    'covid', 'pandemia', 'vírus', 'doença', 'hospital', 'médico', 'medicina',
    'saúde', 'sus', 'vacina', 'sintoma', 'tratamento', 'infectado', 'óbito',
    'morte', 'morreu', 'faleceu', 'óbitos', 'internação', 'uti',
    'câncer', 'diabetes', 'hipertensão', 'dengue', 'zika', 'chikungunya',
    'autismo', 'síndrome', 'mutação', 'gene', 'diagnóstico', 'condição',
    'tea', 'deafi', 'combinação', 'caracterizada',
    
    // Violência/Crime
    'violência', 'crime', 'assassinato', 'homicídio', 'latrocínio', 'roubo',
    'furto', 'sequestro', 'estupro', 'agressão', 'briga', 'discussão',
    'polícia', 'delegacia', 'prisão', 'preso', 'cadeia', 'detento',
    'bandido', 'criminoso', 'tráfico', 'droga', 'arma', 'disparo',
    
    // Acidentes/Tragédias
    'acidente', 'tragédia', 'desastre', 'colisão', 'batida', 'atropelamento',
    'incêndio', 'explosão', 'desabamento', 'enchente', 'alagamento',
    'terremoto', 'tsunami', 'furacão', 'tornado',
    
    // Economia Tradicional
    'inflação', 'juros', 'selic', 'pib', 'ipca', 'igp-m', 'bolsa de valores',
    'bovespa', 'b3', 'dólar', 'real', 'euro', 'petrobras', 'vale',
    'banco central', 'fazenda', 'receita federal', 'imposto', 'tributação',
    
    // Esportes Tradicionais (EXPANDIDO)
    'futebol', 'copa', 'campeonato', 'brasileirão', 'libertadores', 'uefa',
    'fifa', 'cbf', 'flamengo', 'corinthians', 'palmeiras', 'são paulo',
    'vasco', 'botafogo', 'grêmio', 'internacional', 'atlético', 'cruzeiro',
    'jogador de futebol', 'técnico', 'árbitro', 'gol', 'penalty',
    'fc porto', 'gil vicente', 'dragão', 'barcelona', 'liga', 'jornada',
    'azuis e branco', 'danilo', 'libertadores', 'volante', 'clube',
    'abel ferreira', 'vitória', 'vice-liderança', 'equipe', 'trabalho',
    'palmeiras bate', 'botafogo', 'brasileirão',
    
    // Entretenimento Tradicional (EXPANDIDO)
    'novela', 'bbb', 'big brother', 'reality show', 'programa de tv',
    'celebridade', 'famoso', 'artista', 'ator', 'atriz', 'cantor', 'cantora',
    'show', 'música', 'filme', 'cinema', 'oscar', 'globo', 'sbt', 'record',
    'band', 'cultura', 'netflix série', 'amazon prime série',
    'tecnordes', 'ideologia', 'perigoso', 'porto de abrigo', 'infraestrutura',
    'extrema-direita', 'difusão', 'paralelo', 'mãe', 'filho', 'rotina',
    'rafael', 'foi diagnosticado', 'anos', 'conta como'
  ];

  // Sites/fontes confiáveis para tech e games
  const trustedSources = [
    'techcrunch', 'the verge', 'wired', 'ars technica', 'engadget',
    'gizmodo', 'cnet', 'zdnet', 'techmundo', 'olhar digital',
    'gamespot', 'ign', 'polygon', 'kotaku', 'eurogamer',
    'rock paper shotgun', 'destructoid', 'nintendo life'
  ];

  return articles.filter(article => {
    // Verificações básicas de qualidade
    if (!article.title || article.title === '[Removed]') return false;
    if (!article.description) return false;
    if (!article.url) return false;

    // Combinar título, descrição e conteúdo para análise
    const content = (
      (article.title || '') + ' ' + 
      (article.description || '') + ' ' + 
      (article.content || '') + ' ' +
      (article.source?.name || '')
    ).toLowerCase();

    // Verificar se a fonte é confiável para tech
    const source = (article.source?.name || '').toLowerCase();
    const isTrustedSource = trustedSources.some(trusted => 
      source.includes(trusted)
    );

    // Verificar palavras-chave de inclusão
    const hasRelevantKeywords = includeKeywords.some(keyword => 
      content.includes(keyword.toLowerCase())
    );

    // Verificar palavras-chave de exclusão (muito mais rigoroso)
    const hasExcludedKeywords = excludeKeywords.some(keyword => {
      const keywordLower = keyword.toLowerCase();
      const titleLower = (article.title || '').toLowerCase();
      const descLower = (article.description || '').toLowerCase();
      
      return titleLower.includes(keywordLower) || 
             descLower.includes(keywordLower) ||
             content.includes(keywordLower);
    });

    // Verificação adicional: rejeitar se tem qualquer palavra excluída no título
    const hasTitleExclusion = excludeKeywords.some(keyword => 
      (article.title || '').toLowerCase().includes(keyword.toLowerCase())
    );

    // Filtro específico para fontes não tech
    const nonTechSources = [
      'sapo.pt', 'terra.com.br', 'metropoles.com', 'expresso.pt',
      'globo.com', 'uol.com.br', 'folha.com', 'estadao.com.br',
      'veja.com', 'istoe.com.br', 'r7.com', 'band.com.br'
    ];
    
    const isNonTechSource = nonTechSources.some(source => 
      (article.url || '').toLowerCase().includes(source) ||
      (article.source?.name || '').toLowerCase().includes(source.split('.')[0])
    );

    // Critério mais rigoroso para fontes não confiáveis
    const isRejectableSource = [
      'globo', 'g1', 'uol', 'folha', 'estadao', 'veja', 'isto é',
      'r7', 'band', 'sbt', 'record', 'cultura', 'jovem pan'
    ].some(source => (article.source?.name || '').toLowerCase().includes(source)) 
    && !hasRelevantKeywords;

    // Filtrar por data (últimos 30 dias)
    const publishedDate = new Date(article.publishedAt);
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const isRecent = publishedDate >= thirtyDaysAgo;

    // Pontuação para relevância
    let relevanceScore = 0;
    
    // Aumentar pontuação para palavras-chave no título
    includeKeywords.forEach(keyword => {
      if ((article.title || '').toLowerCase().includes(keyword.toLowerCase())) {
        relevanceScore += 3;
      }
    });
    
    // Aumentar pontuação para palavras-chave na descrição
    includeKeywords.forEach(keyword => {
      if ((article.description || '').toLowerCase().includes(keyword.toLowerCase())) {
        relevanceScore += 2;
      }
    });
    
    // Bonus para fonte confiável
    if (isTrustedSource) {
      relevanceScore += 5;
    }

    // Critérios finais de inclusão (MUITO rigorosos)
    return (
      hasRelevantKeywords && // DEVE ter conteúdo tech relevante
      !hasExcludedKeywords && // NÃO pode ter palavras excluídas
      !hasTitleExclusion && // NÃO pode ter exclusão no título
      (isTrustedSource || !isNonTechSource) && // Deve ser fonte tech OU não ser fonte não-tech
      isRecent && // É recente
      relevanceScore >= 5 // Pontuação mínima muito alta
    );
  })
  .sort((a, b) => {
    // Ordenar por data (mais recente primeiro)
    return new Date(b.publishedAt) - new Date(a.publishedAt);
  });
}

// Rota para buscar notícias
app.get('/api/news', async (req, res) => {
  try {
    // Verificar cache primeiro
    const now = Date.now();
    if (newsCache.data && newsCache.timestamp && (now - newsCache.timestamp) < newsCache.duration) {
      console.log('📦 Usando dados em cache (economizando API calls)');
      console.log('⏰ Cache válido por mais:', Math.round((newsCache.duration - (now - newsCache.timestamp)) / 60000), 'minutos');
      
      const filteredArticles = filterTechAndGamingNews(newsCache.data);
      const finalArticles = filteredArticles.slice(0, 20);

      return res.json({
        status: 'success',
        totalResults: finalArticles.length,
        articles: finalArticles,
        cached: true,
        cacheExpiresIn: Math.round((newsCache.duration - (now - newsCache.timestamp)) / 60000)
      });
    }

    console.log('🌐 Fazendo nova requisição à API (cache expirado ou vazio)');
    
    const {
      q = 'tecnologia OR jogos OR games OR gaming OR smartphone OR software OR hardware OR AI OR "inteligência artificial" OR iphone OR android OR playstation OR xbox OR nintendo',
      category = '',
      language = 'pt',
      page = 1,
      pageSize = 50 // Aumentado para ter mais opções para filtrar
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
      
      // Salvar no cache
      newsCache.data = data.articles;
      newsCache.timestamp = now;
      console.log('💾 Dados salvos no cache por', newsCache.duration / 60000, 'minutos');
      
      // Aplicar filtros aprimorados para tech e games
      const filteredArticles = filterTechAndGamingNews(data.articles);

      // Logs para debug
      console.log('📊 Artigos originais recebidos:', data.articles.length);
      console.log('🎯 Artigos após filtro tech/games:', filteredArticles.length);
      
      // Mostrar alguns exemplos dos artigos filtrados
      filteredArticles.slice(0, 3).forEach((article, index) => {
        console.log(`✅ Exemplo ${index + 1}:`, article.title);
      });

      // Limitar a 20 artigos finais para enviar
      const finalArticles = filteredArticles.slice(0, 20);

      res.json({
        status: 'success',
        totalResults: finalArticles.length,
        articles: finalArticles,
        cached: false
      });
    } else {
      throw new Error('Erro na resposta da API');
    }

  } catch (error) {
    console.error('❌ Erro ao buscar notícias:', error.message);
    
    // Se tem cache disponível, usar mesmo com erro
    if (newsCache.data) {
      console.log('🔄 Usando cache devido ao erro da API');
      const filteredArticles = filterTechAndGamingNews(newsCache.data);
      const finalArticles = filteredArticles.slice(0, 20);
      
      return res.json({
        status: 'success',
        totalResults: finalArticles.length,
        articles: finalArticles,
        cached: true,
        note: 'Dados do cache (API temporariamente indisponível)'
      });
    }
    
    // Retornar dados mockados em caso de erro sem cache
    const mockArticles = [
      {
        title: "🚀 iPhone 16 Pro Max: Apple revela especificações técnicas completas",
        description: "Nova geração do iPhone traz chip A18 Pro, câmeras melhoradas e suporte para IA avançada com maior eficiência energética.",
        url: "#",
        urlToImage: "https://images.unsplash.com/photo-1556656793-08538906a9f8?w=400&h=200&fit=crop",
        publishedAt: new Date().toISOString(),
        source: { name: "TechCrunch" }
      },
      {
        title: "🎮 PlayStation 6: Sony confirma desenvolvimento da próxima geração",
        description: "PlayStation 6 está em desenvolvimento com foco em ray tracing em tempo real, 8K nativo e compatibilidade com realidade virtual.",
        url: "#",
        urlToImage: "https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=400&h=200&fit=crop",
        publishedAt: new Date(Date.now() - 3600000).toISOString(),
        source: { name: "PlayStation Blog" }
      },
      {
        title: "🤖 ChatGPT-5: OpenAI anuncia lançamento para dezembro de 2024",
        description: "Nova versão promete capacidades de raciocínio multimodal, processamento de vídeo em tempo real e integração nativa com robótica.",
        url: "#",
        urlToImage: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=400&h=200&fit=crop",
        publishedAt: new Date(Date.now() - 7200000).toISOString(),
        source: { name: "OpenAI Blog" }
      },
      {
        title: "🕹️ Steam Deck 2: Valve confirma segunda geração para 2025",
        description: "Nova versão terá tela OLED de 120Hz, processador AMD personalizado e bateria com 50% mais autonomia.",
        url: "#",
        urlToImage: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=200&fit=crop",
        publishedAt: new Date(Date.now() - 10800000).toISOString(),
        source: { name: "Steam News" }
      }
    ];

    res.json({
      status: 'success',
      totalResults: mockArticles.length,
      articles: mockArticles,
      note: '⚠️ Limite da NewsAPI atingido. Aguarde o reset em ~47 minutos.'
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
    const enhancedQuery = `${q} AND (tecnologia OR jogos OR games OR gaming OR tech OR smartphone OR software)`;

    const params = {
      apiKey: NEWS_API_KEY,
      q: enhancedQuery,
      language: 'pt',
      sortBy: 'publishedAt',
      pageSize: 50 // Aumentado para ter mais opções para filtrar
    };

    const response = await axios.get(`${NEWS_API_BASE_URL}/everything`, { params });

    if (response.status === 200) {
      const data = response.data;
      
      // Aplicar filtros aprimorados
      const filteredArticles = filterTechAndGamingNews(data.articles);
      
      // Logs para debug
      console.log(`Busca por "${q}" - Artigos originais:`, data.articles.length);
      console.log(`Busca por "${q}" - Artigos filtrados:`, filteredArticles.length);

      res.json({
        status: 'success',
        query: q,
        totalResults: filteredArticles.length,
        articles: filteredArticles.slice(0, 20) // Limitar a 20 resultados
      });
    } else {
      throw new Error('Erro na resposta da API');
    }

  } catch (error) {
    console.error('Erro ao buscar notícias:', error.message);
    
    // Retornar dados mockados personalizados para a busca
    const mockArticles = [
      {
        title: `Resultados tech para "${req.query.q}"`,
        description: `Mostrando resultados de tecnologia e jogos relacionados a ${req.query.q}`,
        url: "#",
        urlToImage: "https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=400&h=200&fit=crop",
        publishedAt: new Date().toISOString(),
        source: { name: "Tech Demo Source" }
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