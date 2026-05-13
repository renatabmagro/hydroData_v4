---
agent: ask
model: GPT-5
description: Gerar testes metodológicos e técnicos do IVPC
tools: ['search/codebase']
---

Leia:

- specs/
- docs/
- arquivos relacionados ao engine IVPC

Sua tarefa:

1. Identificar regras testáveis;
2. Identificar fronteiras críticas;
3. Identificar inconsistências metodológicas possíveis;
4. Gerar testes mínimos e suficientes;
5. NÃO implementar produção.

---

# Regras obrigatórias

Os testes devem validar:

- elegibilidade espacial;
- exposure;
- sensitivity;
- fórmula final;
- universos estatísticos;
- consistência do relatório.

---

# Verificações obrigatórias

Validar:

- exposure contínua;
- blind spot binário;
- hazard fora do score;
- máscaras corretas;
- denominadores corretos.

---

# Proibições

Não:

- inventar metodologia;
- alterar fórmulas;
- assumir comportamento implícito.

---

# Saída esperada

- lista de regras observáveis;
- lista de bordas;
- testes sugeridos;
- riscos metodológicos.
```