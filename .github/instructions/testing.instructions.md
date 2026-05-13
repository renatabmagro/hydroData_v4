---
applyTo: "tests/**/*,**/*.test.ts,**/*.spec.ts"
---

# Regras de Testes

## Objetivo

Garantir:

- verificabilidade;
- auditabilidade;
- contenção probabilística;
- estabilidade metodológica.

---

# Regras obrigatórias

## 1. Cobrir comportamento observável

Os testes devem validar:

- inputs;
- outputs;
- bordas;
- erros;
- side effects.

---

## 2. Derivar testes da spec

Os testes devem seguir:

- specs/;
- regras metodológicas;
- contratos explícitos.

Nunca derivar comportamento da implementação.

---

## 3. Cobrir fronteiras

Sempre incluir:

- thresholds;
- limites;
- valores mínimos;
- valores máximos;
- inputs inválidos.

---

## 4. Evitar redundância

Não criar:

- múltiplos testes equivalentes;
- testes extremamente acoplados;
- testes frágeis.

---

## 5. Testes semânticos

Sempre validar:

- coerência metodológica;
- semântica correta;
- universos estatísticos;
- elegibilidade vs score.

---

## 6. Earth Engine

Validar:

- masks;
- reducers;
- projections;
- scale;
- normalizações.

---

## 7. Relatórios

Validar:

- termos proibidos;
- coerência textual;
- coerência estatística.
```

---