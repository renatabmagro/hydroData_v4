# IVPC Platform — Índice de Vulnerabilidade Populacional Crítica

[![Build](https://img.shields.io/badge/build-passing-brightgreen)]()
[![Coverage](https://img.shields.io/badge/coverage-comprehensive-blue)]()
[![License](https://img.shields.io/badge/license-MIT-green)]()

Plataforma de análise geoespacial inteligente para identificar áreas urbanas com vulnerabilidade crítica de monitoramento hidrológico. O **IVPC** quantifica a vulnerabilidade relativa de populações em áreas sujeitas à inundação que carecem de monitoramento operacional.

## 📋 Tabela de Conteúdos

- [Visão Geral](#visão-geral)
- [Como Começar](#como-começar)
- [Estrutura do Projeto](#estrutura-do-projeto)
- [Colaboração (Git Workflow)](#colaboração-git-workflow)
- [Desenvolvimento Local](#desenvolvimento-local)
- [Testes](#testes)
- [Regras Importantes](#regras-importantes)
- [Contribuição](#contribuição)

---

## 🎯 Visão Geral

### O que é IVPC?

O **IVPC (Índice de Vulnerabilidade Populacional Crítica)** é um índice de vulnerabilidade **relativa** que:

✅ Identifica populações urbanas em áreas suscetíveis à inundação (hazard)  
✅ Que carecem de monitoramento operacional adequado (blind spots > 10km de estação)  
✅ Com diferentes níveis de sensibilidade populacional  

❌ **NÃO é** um sistema de previsão de riscos  
❌ **NÃO é** probabilidade absoluta de inundação  
❌ **NÃO substitui** análises de risco tradicionais

### Stack Tecnológico

**Frontend:**
- React 19 + TypeScript
- TailwindCSS 4 (styling)
- React Leaflet 5 (mapas interativos)
- Recharts 3 (visualização de séries temporais)
- Zustand 5 (state management)

**Backend:**
- Node.js + Express
- Google Earth Engine (análise geoespacial)
- Supabase (banco de dados)
- Google Gemini (geração de relatórios)

**Validação & Qualidade:**
- Zod (validação de tipos em runtime)
- Vitest (testes)
- TypeScript (type safety)

---

## 🚀 Como Começar

### Pré-requisitos

- **Node.js** >= 18 (recomendado 20+)
- **npm** ou **pnpm**
- **Git**
- Credenciais Google Earth Engine (arquivo `.json`)
- Variáveis de ambiente Supabase

### Setup Inicial (Primeira Vez)

#### 1️⃣ Clone o repositório

```bash
git clone https://github.com/renatabmagro/hydroData_v4.git
cd hydroData_v4
```

#### 2️⃣ Instale dependências

```bash
npm install
# ou
pnpm install
```

#### 3️⃣ Configure variáveis de ambiente

Crie um arquivo `.env.local` na raiz do projeto:

```env
# Google Earth Engine
VITE_EE_PROJECT_ID=seu-projeto-gee
VITE_EE_CLIENT_EMAIL=seu-client-email@gee.iam.gserviceaccount.com

# Supabase
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-publica

# Google Gemini (opcional, para geração de relatórios)
VITE_GEMINI_API_KEY=sua-chave-api

# Desenvolvimento
VITE_API_URL=http://localhost:5173
```

**Nota:** Adicione as credenciais de GEE no diretório `credentials/`:
```bash
cp seu-arquivo-gee-credentials.json credentials/gee-service-account.json
```

#### 4️⃣ Inicie o servidor de desenvolvimento

```bash
npm run dev
```

A aplicação estará disponível em `http://localhost:5173`

---

## 📁 Estrutura do Projeto

```
hydroData_v4/
├── src/
│   ├── core/engine/              # Motor analítico IVPC (não modificar sem teste)
│   │   ├── config/               # Constantes IVPC
│   │   ├── eligibility/          # Regras de elegibilidade (hazard, blindSpot)
│   │   ├── exposure/             # Intensidade operacional
│   │   ├── ivpc/                 # Cálculo final e tipos
│   │   ├── metrics/              # Métricas urbanas
│   │   ├── pipeline/             # Orquestração
│   │   ├── sensitivity/          # Intensidade populacional
│   │   ├── types/                # Definições de tipos centralizadas
│   │   └── utils/                # Funções auxiliares
│   │
│   ├── components/               # Componentes React
│   │   ├── AnalysisTab.tsx       # Painel de análise
│   │   ├── AnalysisEngine.ts     # Lógica de geração de relatórios
│   │   └── ...
│   │
│   ├── pages/                    # Páginas da aplicação
│   ├── services/                 # Serviços (validação, logging, erros)
│   ├── hooks/                    # Hooks customizados
│   ├── state/                    # Estado global (Zustand)
│   ├── ee/                       # Google Earth Engine
│   └── schemas/                  # Validação Zod
│
├── tests/                        # Suite de testes
│   ├── unit/                     # Testes unitários
│   ├── integration/              # Testes de integração (pipeline completo)
│   ├── semantic/                 # Validação de regras IVPC
│   ├── smoke/                    # Testes básicos
│   ├── regression/               # Testes de regressão
│   └── helpers/                  # Utilidades de teste
│
├── specs/                        # Documentação de especificações
│   ├── ivpc-engine.spec.md       # Arquitetura analítica
│   ├── urban-metrics.spec.md     # Métricas urbanas
│   ├── ivpc-report.spec.md       # Formato de relatórios
│   ├── blindspot-analysis.spec.md
│   └── semantic-rules.spec.md    # Regras obrigatórias
│
├── .github/
│   ├── copilot-instructions.md   # Regras de desenvolvimento (LEIA!)
│   ├── workflows/                # GitHub Actions CI/CD
│   ├── agents/                   # Agentes Copilot customizados
│   └── ...
│
├── .gitignore                    # Exclusões de versionamento
├── package.json                  # Dependências e scripts
├── tsconfig.json                 # Configuração TypeScript
├── vite.config.ts                # Configuração Vite
└── README.md                     # Este arquivo
```

---

## 🔄 Colaboração (Git Workflow)

Como você adicionou uma colega como collaborator, aqui está como ela deve trabalhar:

### Para Colaboradores: Primeira Configuração

```bash
# 1. Clone o repositório
git clone https://github.com/renatabmagro/hydroData_v4.git
cd hydroData_v4

# 2. Instale dependências
npm install

# 3. Configure variáveis de ambiente (.env.local)
# Peça ao Renata as credenciais necessárias

# 4. Teste se tudo está funcionando
npm run build
```

### Workflow de Desenvolvimento (Branching)

Siga este padrão para fazer modificações:

#### 1. Crie uma branch para sua tarefa

```bash
# Sempre crie a partir da main mais atualizada
git checkout main
git pull origin main

# Crie uma branch descritiva
git checkout -b feature/descricao-da-mudanca
# Exemplos:
# - feature/adicionar-validacao-ivpc
# - fix/corrigir-calculo-metricas
# - docs/atualizar-readme
```

#### 2. Faça suas modificações

```bash
# Edite os arquivos necessários
# Teste suas mudanças localmente
npm run dev
npm test
```

#### 3. Commit com mensagens claras

```bash
# Commits pequenos e focados
git add .
git commit -m "feat: adicionar validação para ivpc_socioambiental"
# Exemplos de prefixos:
# - feat:     nova funcionalidade
# - fix:      correção de bug
# - docs:     documentação
# - refactor: reorganização de código
# - test:     testes
```

#### 4. Envie sua branch para o GitHub

```bash
git push origin feature/descricao-da-mudanca
```

#### 5. Crie um Pull Request (PR)

No GitHub:
1. Vá para [https://github.com/renatabmagro/hydroData_v4](https://github.com/renatabmagro/hydroData_v4)
2. Clique em "Compare & pull request"
3. Preencha a descrição explicando:
   - O que foi mudado e por quê
   - Como testar
   - Se há breaking changes
4. Aguarde revisão e merge

#### 6. Após merge, limpe sua branch local

```bash
git checkout main
git pull origin main
git branch -d feature/descricao-da-mudanca
git push origin --delete feature/descricao-da-mudanca
```

### Boas Práticas

✅ **Faça:**
- Crie branches para cada tarefa isolada
- Comits pequenos e descritivos
- Teste antes de fazer push
- Peça revisão antes de fazer merge
- Atualize sua branch com `main` se estiver desatualizada

❌ **Evite:**
- Fazer push direto na `main`
- Comits grandes com múltiplas mudanças
- Deixar branchs antigas abandonadas
- Modificar código do engine sem testes
- Alterar significado de terminologia IVPC

---

## 💻 Desenvolvimento Local

### Scripts Disponíveis

```bash
# Desenvolvimento
npm run dev              # Inicia servidor com hot reload (port 5173)

# Build
npm run build            # Build production
npm run build:analyze    # Analisa tamanho dos bundles

# Testing
npm test                 # Executa todos os testes
npm run test:unit        # Apenas testes unitários
npm run test:integration # Testes de pipeline completo
npm run test:semantic    # Valida regras IVPC
npm run test:watch       # Watch mode para desenvolvimento
npm run coverage         # Relatório de cobertura

# Quality
npm run lint             # Type checking com TypeScript
npm run format           # Formata código (se configurado)
```

### Debugging

#### No navegador:
- Abra DevTools (F12)
- Veja logs em Console
- Inspecione estado Zustand com Redux DevTools

#### No VS Code:
Adicione ao `.vscode/launch.json`:
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug Node",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/node_modules/.bin/tsx",
      "args": ["server.ts"],
      "cwd": "${workspaceFolder}"
    }
  ]
}
```

### Estrutura de Pastas para Novas Features

Se estiver adicionando uma nova funcionalidade, siga este padrão:

```
src/
├── myfeature/
│   ├── myfeature.ts           # Implementação
│   ├── myfeature.types.ts     # Tipos (se > 10 linhas)
│   ├── myfeature.validator.ts # Validações Zod (se necessário)
│   └── __tests__/
│       └── myfeature.test.ts
```

---

## 🧪 Testes

A plataforma possui uma suite completa de testes:

### Executar Testes

```bash
# Todos os testes
npm test

# Teste específico
npm test -- src/core/engine/ivpc/ivpc.test.ts

# Watch mode (durante desenvolvimento)
npm test -- --watch

# Cobertura
npm run coverage
```

### Escrever Testes

Quando você fizer uma mudança, **sempre adicione ou atualize testes**:

```typescript
// tests/unit/myfeature.test.ts
import { describe, it, expect } from 'vitest';
import { myFunction } from '../../src/myfeature';

describe('MyFeature', () => {
  it('should do something correctly', () => {
    const result = myFunction(input);
    expect(result).toEqual(expectedOutput);
  });
});
```

---

## ⚙️ Regras Importantes

Existem **regras críticas** definidas em [`.github/copilot-instructions.md`](./.github/copilot-instructions.md). Leia-as antes de fazer mudanças significativas!

### Principais:

1. **Nunca transforme IVPC em risco ou probabilidade**
   - IVPC é vulnerabilidade *relativa*, não risco absoluto
   - Preserve a terminologia semântica

2. **Tudo testável deve ser validado**
   - Use Zod para validação runtime
   - Types apenas não são suficientes
   - Componentes críticos (engine, pipeline) precisam de testes

3. **Mudanças pequenas e focadas**
   - Evite grandes refatorações silenciosas
   - Uma funcionalidade por branch
   - Preserve a arquitetura existente

4. **Questione antes de assumir**
   - Se algo sobre IVPC estiver ambíguo, pergunte
   - Não invente metodologia

---

## 👥 Contribuição

### Relatando Bugs

Se encontrar um bug:

1. Crie uma issue no GitHub com:
   - Descrição clara do problema
   - Passos para reproduzir
   - Comportamento esperado vs. observado
   - Screenshots (se visual)

2. Se você conseguir consertar, siga o workflow acima

### Sugestões de Features

Abra uma discussão antes de implementar mudanças grandes. Pergunte:
- Isso está alinhado com a semântica IVPC?
- Precisa de novos testes?
- Afeta outras partes do código?

---

## 📚 Documentação Adicional

- [Especificação do Engine IVPC](./specs/ivpc-engine.spec.md)
- [Métricas Urbanas](./specs/urban-metrics.spec.md)
- [Formato de Relatórios](./specs/ivpc-report.spec.md)
- [Análise de Blind Spots](./specs/blindspot-analysis.spec.md)
- [Regras Semânticas](./specs/semantic-rules.spec.md)
- [Instruções de Desenvolvimento](./.github/copilot-instructions.md)

---

## 🤝 Suporte

Se tiver dúvidas ou problemas:

1. Verifique se o problema está documentado nas specs/
2. Procure por issues abertas no GitHub
3. Abra uma nova issue com detalhes
4. Entre em contato com Renata (@renatabmagro)

---

## 📄 Licença

MIT License — veja LICENSE para detalhes

---

**Última atualização:** 12 de maio de 2026  
**Mantido por:** Renata Bulling Magro (@renatabmagro)
