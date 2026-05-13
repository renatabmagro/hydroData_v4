# IVPC Testing Architecture

## Objetivo

Garantir:

- verificabilidade;
- auditabilidade;
- estabilidade metodológica;
- contenção probabilística;
- preservação semântica.

---

# Filosofia

O sistema IVPC depende de:

- coerência espacial;
- coerência estatística;
- coerência metodológica.

Os testes NÃO devem validar apenas:

- execução;
- ausência de erro;
- outputs superficiais.

Os testes devem validar:

- semântica;
- universos;
- metodologia;
- coerência científica.

---

# Estrutura obrigatória

tests/
├── unit/
├── integration/
├── semantic/
├── ee/
├── reports/
├── regression/
├── smoke/
├── fixtures/
└── helpers/

---

# Tipos de testes

## unit/

Valida:

- funções puras;
- normalizações;
- cálculos locais;
- utilidades.

---

## integration/

Valida:

- fluxo entre módulos;
- compatibilidade entre componentes;
- pipeline IVPC.

---

## semantic/

Valida:

- coerência metodológica;
- regras IVPC;
- universos estatísticos;
- terminologia.

---

## ee/

Valida:

- Earth Engine;
- reducers;
- masks;
- scale;
- raster operations.

---

## reports/

Valida:

- coerência textual;
- termos proibidos;
- coerência estatística.

---

## regression/

Evita:

- retorno de bugs;
- deriva metodológica;
- regressões analíticas.

---

## smoke/

Valida:

- execução mínima;
- estabilidade básica;
- pipeline principal.

---

# Regras obrigatórias

## 1. Testes devem derivar da spec

Toda regra testada deve existir em:

- specs/;
- docs/;
- contratos explícitos.

---

## 2. Não testar implementação privada

Priorizar:

- comportamento observável;
- contratos;
- outputs.

---

## 3. Testes semânticos são obrigatórios

O projeto NÃO é apenas técnico.

Logo:
- coerência científica é obrigatória.

---

## 4. Cobertura mínima

Cobertura mínima alvo:

| Categoria | Cobertura |
|---|---|
| unit | 85% |
| semantic | 100% regras críticas |
| reports | 100% termos críticos |
| smoke | obrigatório |

---

# Regras proibidas

É proibido:

- duplicar testes equivalentes;
- criar testes frágeis;
- acoplar testes à implementação interna;
- validar apenas ausência de erro.

---

# Resultado esperado

O pipeline de testes deve impedir:

- deriva semântica;
- regressões metodológicas;
- inconsistência estatística;
- inconsistência espacial.