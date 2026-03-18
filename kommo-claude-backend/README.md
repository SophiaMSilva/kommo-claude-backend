# 🤖 Kommo + Claude AI — Backend de Integração

Backend Node.js que conecta o **Kommo CRM** com o **Claude AI** para classificar leads, analisar campanhas e otimizar funis de vendas.

---

## 📁 Estrutura do Projeto

```
kommo-claude-backend/
├── server.js       → Servidor principal com todas as rotas
├── .env            → Suas chaves e configurações (NÃO suba no Git!)
├── package.json    → Dependências do projeto
└── README.md       → Este arquivo
```

---

## 🚀 Passo a Passo para Rodar

### 1. Instalar o Node.js
Baixe em: https://nodejs.org (versão LTS recomendada)

### 2. Abrir o projeto no VS Code
```
Arquivo > Abrir Pasta > selecione a pasta kommo-claude-backend
```

### 3. Abrir o terminal no VS Code
```
Ctrl + ` (acento grave)
```

### 4. Instalar as dependências
```bash
npm install
```

### 5. Configurar o arquivo .env
Abra o arquivo `.env` e preencha:
- `ANTHROPIC_API_KEY` → sua chave de https://console.anthropic.com
- `KOMMO_CLIENT_ID` → ID da integração criada no Kommo
- `KOMMO_CLIENT_SECRET` → Secret da integração do Kommo

### 6. Rodar o servidor
```bash
npm run dev
```

Você verá:
```
🚀 Servidor rodando em http://localhost:3000
```

---

## 🔗 Configurar no Kommo

No formulário "Criar integração" do Kommo, preencha:

| Campo | Valor |
|---|---|
| URL de redirecionamento | `http://localhost:3000/oauth/callback` |
| Nome da integração | `Claude AI Assistant` |
| Descrição | Classificação de leads e análise de funil com IA |

> ⚠️ Para produção (Railway/Render), substitua `localhost:3000` pela URL do seu servidor online.

---

## 📡 Rotas Disponíveis

### `POST /lead/classificar`
Classifica e qualifica um lead automaticamente.

**Body (JSON):**
```json
{
  "nome": "João Silva",
  "empresa": "Tech Solutions Ltda",
  "cargo": "Diretor de TI",
  "origem": "Google Ads",
  "mensagem": "Preciso de uma solução para automatizar meu time de vendas"
}
```

**Resposta:**
```json
{
  "sucesso": true,
  "classificacao": {
    "temperatura": "quente",
    "score": 85,
    "perfil": "Decision maker com dor clara e orçamento provável",
    "proximo_passo": "Agendar demo em até 24h",
    "justificativa": "Cargo de diretor com necessidade específica e urgência implícita"
  }
}
```

---

### `POST /campanha/analisar`
Analisa performance de uma campanha e sugere melhorias.

**Body (JSON):**
```json
{
  "nome_campanha": "Google Ads - Julho 2025",
  "canal": "Google Ads",
  "periodo": "01/07/2025 a 31/07/2025",
  "leads_gerados": 150,
  "conversoes": 12,
  "custo": 3500
}
```

---

### `POST /funil/analisar`
Analisa o funil de vendas e identifica gargalos.

**Body (JSON):**
```json
{
  "etapas": [
    { "nome": "Prospecção", "quantidade": 500, "valor_total": 250000 },
    { "nome": "Qualificação", "quantidade": 200, "valor_total": 180000 },
    { "nome": "Proposta Enviada", "quantidade": 80, "valor_total": 120000 },
    { "nome": "Negociação", "quantidade": 30, "valor_total": 90000 },
    { "nome": "Fechamento", "quantidade": 15, "valor_total": 75000 }
  ]
}
```

---

### `POST /webhook`
Recebe eventos automáticos do Kommo (novo lead, mudança de etapa, etc.)

---

## 🧪 Testar as Rotas

Use o **Thunder Client** (extensão do VS Code) ou **Postman**:
1. Instale a extensão "Thunder Client" no VS Code
2. Importe as rotas acima
3. Faça as requisições POST com os exemplos de body

---

## ☁️ Ir para Produção (quando estiver pronto)

1. Crie conta no **Railway** (railway.app) — gratuito para começar
2. Faça upload do projeto
3. Configure as variáveis de ambiente no painel do Railway
4. Copie a URL gerada e substitua no Kommo

---

## 🆘 Dúvidas?

- Documentação Claude API: https://docs.anthropic.com
- Documentação Kommo: https://www.kommo.com/developers/
