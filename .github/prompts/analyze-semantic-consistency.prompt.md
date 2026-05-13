---
agent: ask
model: GPT-5
description: Revisar coerência metodológica do IVPC
tools: ['codebase']
---

Analise:

- specs;
- engine;
- analytics;
- reports.

Objetivo:

Identificar:

- deriva semântica;
- inconsistências metodológicas;
- uso incorreto de terminologia;
- mistura entre elegibilidade e score;
- inconsistência estatística.

---

# Validar explicitamente

## 1. IVPC

Verificar se:

- IVPC não é tratado como risco;
- IVPC não é tratado como previsão.

---

## 2. Exposure

Verificar se:

- exposure é contínua;
- exposure não é binária.

---

## 3. Hazard

Verificar se:

- hazard atua apenas como elegibilidade.

---

## 4. Relatórios

Verificar se:

- não usam denominadores incorretos;
- não usam linguagem proibida.

---

# Saída esperada

Gerar:

- problemas encontrados;
- severidade;
- impacto metodológico;
- recomendação mínima de correção.
```

---