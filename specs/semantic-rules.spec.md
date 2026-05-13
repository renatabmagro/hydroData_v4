# Semantic Rules Specification

Version: 1.0
Status: Foundational
Scope: Regras semânticas globais do projeto IVPC

---

# Objetivo

Definir:

- semântica oficial;
- terminologia obrigatória;
- interpretações válidas;
- interpretações proibidas.

---

# Regra semântica central

O IVPC representa:

vulnerabilidade relativa espacial.

---

# O IVPC NÃO representa

O IVPC NÃO é:

- risco absoluto;
- previsão;
- probabilidade;
- modelo hidrológico;
- vulnerabilidade socioeconômica completa.

---

# Separação metodológica obrigatória

| Conceito | Papel |
|---|---|
| hazard | elegibilidade física |
| blind spot | elegibilidade operacional |
| exposure | intensidade operacional |
| sensitivity | intensidade populacional |
| IVPC | vulnerabilidade relativa |

---

# Regras obrigatórias

## Hazard

Hazard:

- NÃO entra diretamente no score;
- atua apenas como elegibilidade física.

---

## Blind Spot

Blind spot:

- NÃO é intensidade;
- NÃO é score;
- representa deficiência operacional binária.

---

## Exposure

Exposure:

- deve ser contínua;
- deve representar intensidade relativa;
- NÃO pode ser binária.

---

## Sensitivity

Sensitivity:

- representa intensidade populacional;
- NÃO representa vulnerabilidade socioeconômica completa.

---

## IVPC

IVPC:

- representa vulnerabilidade relativa;
- depende de exposure e sensitivity;
- existe apenas no universo elegível.

---

# Terminologia obrigatória

| Evitar | Preferir |
|---|---|
| risco | vulnerabilidade relativa |
| perigo | suscetibilidade física |
| área crítica | hotspot espacial |
| previsão | análise espacial |
| ameaça | deficiência operacional |

---

# Regras estatísticas

## Regra crítica

Máscaras IVPC NÃO representam universo total.

---

# Separação obrigatória

Separar explicitamente:

- métricas globais;
- métricas blind spot;
- métricas IVPC;
- métricas urbanas;
- métricas elegíveis.

---

# Regras de interpretação

É permitido:

- interpretar hotspots;
- interpretar intensidade relativa;
- interpretar concentração espacial.

---

# Interpretações proibidas

É proibido:

- prever eventos;
- afirmar probabilidade;
- afirmar causalidade direta;
- inferir risco absoluto.

---

# Regras de visualização

Mapas IVPC:

- representam intensidade relativa;
- NÃO representam probabilidade;
- NÃO representam magnitude hidrológica real.

---

# Regras de implementação

Toda implementação deve:

- preservar semântica;
- preservar universos;
- preservar separação metodológica.

---

# Resultado esperado

O sistema deve manter:

- coerência científica;
- coerência estatística;
- coerência espacial;
- coerência semântica.