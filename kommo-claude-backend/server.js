const express = require('express');
const axios = require('axios');

const app = express();
app.use(express.json());

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const KOMMO_CLIENT_ID = process.env.KOMMO_CLIENT_ID;
const KOMMO_CLIENT_SECRET = process.env.KOMMO_CLIENT_SECRET;
const KOMMO_REDIRECT_URI = process.env.KOMMO_REDIRECT_URI;

app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'Servidor rodando!' });
});

// Função central: chama a API do Claude
async function askClaude(systemPrompt, userMessage) {
  if (!ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY não configurada');
  }

  const response = await axios.post(
    'https://api.anthropic.com/v1/messages',
    {
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1024,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }],
    },
    {
      headers: {
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
    }
  );
  return response.data.content[0].text;
}

// ROTA 3: Classificar e Qualificar Lead
app.post('/lead/classificar', async (req, res) => {
  try {
    const { nome, empresa, cargo, origem, mensagem } = req.body;

    if (!nome || !empresa || !cargo || !origem || !mensagem) {
      return res.status(400).json({ 
        sucesso: false, 
        erro: 'Campos obrigatórios: nome, empresa, cargo, origem, mensagem' 
      });
    }

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

    const resultado = await askClaude(system, user);
    const json = JSON.parse(resultado.replace(/```json|```/g, '').trim());
    res.json({ sucesso: true, classificacao: json });
  } catch (err) {
    console.error('Erro em /lead/classificar:', err.message);
    res.status(500).json({ sucesso: false, erro: err.message });
  }
});

// Inicia o servidor
const PORT = process.env.PORT || 8080;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
});