const express = require('express');
const axios = require('axios');
//require('dotenv').config();

const app = express();
app.use(express.json());

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const KOMMO_CLIENT_ID = process.env.KOMMO_CLIENT_ID;
const KOMMO_CLIENT_SECRET = process.env.KOMMO_CLIENT_SECRET;
const KOMMO_REDIRECT_URI = process.env.KOMMO_REDIRECT_URI;
// ─────────────────────────────────────────────
// Adicionado 18/03, antes das outras rotas
// ─────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'Servidor rodando!' });
});

// ─────────────────────────────────────────────
// Função central: chama a API do Claude
// ─────────────────────────────────────────────
async function askClaude(systemPrompt, userMessage) {
  const response = await axios.post(
    'https://api.anthropic.com/v1/messages',
    {
      model: 'claude-sonnet-4-5',
      max_tokens: 1024,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }],
    },
    {
      headers: {
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
        'content-type': 'application/json',
      },
    }
  );
  return response.data.content[0].text;
}

// ─────────────────────────────────────────────
// ROTA 1: OAuth - Callback do Kommo
// ─────────────────────────────────────────────
app.get('/oauth/callback', async (req, res) => {
  const { code } = req.query;
  if (!code) return res.status(400).send('Código OAuth não encontrado.');

  try {
    const tokenResponse = await axios.post(
      'https://www.kommo.com/oauth2/access_token',
      {
        client_id: KOMMO_CLIENT_ID,
        client_secret: KOMMO_CLIENT_SECRET,
        grant_type: 'authorization_code',
        code,
        redirect_uri: KOMMO_REDIRECT_URI,
      }
    );

    const { access_token, refresh_token } = tokenResponse.data;
    console.log('✅ OAuth OK! Access Token:', access_token);
    // Em produção: salve os tokens num banco de dados

    res.send('✅ Integração com Kommo realizada com sucesso! Pode fechar esta janela.');
  } catch (err) {
    console.error('Erro no OAuth:', err.response?.data || err.message);
    res.status(500).send('Erro ao autenticar com o Kommo.');
  }
});

// ─────────────────────────────────────────────
// ROTA 2: Webhook - Recebe eventos do Kommo
// ─────────────────────────────────────────────
app.post('/webhook', async (req, res) => {
  console.log('📩 Webhook recebido:', JSON.stringify(req.body, null, 2));
  res.sendStatus(200); // Responde rápido pro Kommo
});

// ─────────────────────────────────────────────
// ROTA 3: Classificar e Qualificar Lead
// ─────────────────────────────────────────────
app.post('/lead/classificar', async (req, res) => {
  const { nome, empresa, cargo, origem, mensagem } = req.body;

  const system = `Você é um especialista em vendas B2B. Analise leads e classifique-os de forma objetiva.
Sempre responda em JSON com os campos: 
- temperatura: "quente" | "morno" | "frio"
- score: número de 0 a 100
- perfil: texto curto descrevendo o lead
- proximo_passo: ação recomendada para o vendedor
- justificativa: por que essa classificação`;

  const user = `Classifique este lead:
Nome: ${nome}
Empresa: ${empresa}
Cargo: ${cargo}
Origem: ${origem}
Mensagem: ${mensagem}`;

  try {
    const resultado = await askClaude(system, user);
    const json = JSON.parse(resultado.replace(/```json|```/g, '').trim());
    res.json({ sucesso: true, classificacao: json });
  } catch (err) {
    console.error('Erro completo:', JSON.stringify(err.response?.data, null, 2));
    res.status(500).json({ sucesso: false, erro: err.message });
  }
});

// ─────────────────────────────────────────────
// ROTA 4: Analisar Campanha
// ─────────────────────────────────────────────
app.post('/campanha/analisar', async (req, res) => {
  const { nome_campanha, canal, leads_gerados, custo, conversoes, periodo } = req.body;

  const system = `Você é um analista de marketing digital especializado em geração de leads e ROI.
Responda sempre em JSON com os campos:
- avaliacao_geral: "excelente" | "boa" | "regular" | "ruim"
- cpl: custo por lead (calculado)
- taxa_conversao: percentual
- pontos_fortes: lista de pontos positivos
- pontos_fracos: lista de problemas identificados
- melhorias: lista de sugestões práticas e acionáveis
- projecao: o que esperar se as melhorias forem aplicadas`;

  const user = `Analise esta campanha:
Nome: ${nome_campanha}
Canal: ${canal}
Período: ${periodo}
Leads gerados: ${leads_gerados}
Conversões: ${conversoes}
Custo total: R$ ${custo}`;

  try {
    const resultado = await askClaude(system, user);
    const json = JSON.parse(resultado.replace(/```json|```/g, '').trim());
    res.json({ sucesso: true, analise: json });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ sucesso: false, erro: err.message });
  }
});

// ─────────────────────────────────────────────
// ROTA 5: Analisar Funil de Vendas
// ─────────────────────────────────────────────
app.post('/funil/analisar', async (req, res) => {
  const { etapas } = req.body;
  // etapas: array de { nome, quantidade, valor_total }

  const system = `Você é um especialista em funis de vendas e CRM. Analise os dados de funil e identifique gargalos.
Responda sempre em JSON com os campos:
- saude_geral: "saudável" | "atenção" | "crítico"
- taxa_conversao_geral: percentual do topo ao fundo
- gargalos: lista de etapas com maior perda, com percentual de perda
- etapa_critica: qual etapa precisa de mais atenção
- acoes_imediatas: lista de 3 ações prioritárias
- acoes_medio_prazo: lista de 3 ações para os próximos 30-60 dias
- estimativa_melhoria: projeção de ganho se gargalos forem resolvidos`;

  const user = `Analise este funil de vendas:
${etapas.map((e, i) => `Etapa ${i + 1} - ${e.nome}: ${e.quantidade} leads | R$ ${e.valor_total}`).join('\n')}`;

  try {
    const resultado = await askClaude(system, user);
    const json = JSON.parse(resultado.replace(/```json|```/g, '').trim());
    res.json({ sucesso: true, analise: json });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ sucesso: false, erro: err.message });
  }
});

// ─────────────────────────────────────────────
// Inicia o servidor
// ─────────────────────────────────────────────
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
  console.log(`📋 Rotas disponíveis:
  GET  /oauth/callback      → Callback OAuth do Kommo
  POST /webhook             → Recebe eventos do Kommo
  POST /lead/classificar    → Classifica e qualifica lead
  POST /campanha/analisar   → Analisa campanha de marketing
  POST /funil/analisar      → Analisa funil de vendas`);
});
