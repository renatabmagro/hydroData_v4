# Urban Metrics Specification

Version: 1.0
Status: Operational
Scope: Métricas urbanas e cobertura hidrológica

---

# Objetivo

Formalizar métricas urbanas garantindo:

- coerência estatística;
- coerência espacial;
- separação entre universos;
- consistência metodológica.

---

# Problema metodológico crítico

Camadas mascaradas IVPC NÃO representam universo estatístico global.

---

# Regra fundamental

É proibido utilizar:

updateMask(ivpcMask)

como denominador para:

- métricas globais;
- percentuais totais;
- estatísticas urbanas globais.

---

# Universos estatísticos obrigatórios

## 1. Urban Total

Representa:

toda urbanização da bacia.

Variável obrigatória:

urbanTotalArea

---

## 2. Urban Blind Spot

Representa:

urbanização com deficiência operacional de monitoramento.

Critério atual:

- distância > 10 km.

Variável obrigatória:

urbanBlindSpotArea

---

## 3. Urban Monitored

Representa:

urbanização coberta operacionalmente.

Critério atual:

- distância ≤ 10 km.

Variável obrigatória:

urbanMonitoredArea

---

## 4. Urban Eligible IVPC

Representa:

urbanização dentro do universo metodológico IVPC.

Variável obrigatória:

urbanEligibleArea

---

## 5. Urban IVPC

Representa:

urbanização com score IVPC válido.

Variável obrigatória:

urbanIvpcArea

---

# Relações obrigatórias

## Coerência urbana

Deve ser aproximadamente verdadeiro:

urbanMonitoredArea + urbanBlindSpotArea ≈ urbanTotalArea

---

# Tolerância máxima

Erro permitido:

1%

---

# Percentuais obrigatórios

## Percentual urbano blind spot

Definição:

urbanBlindSpotArea / urbanTotalArea

---

# Regra obrigatória

O denominador deve ser:

urbanTotalArea

e NUNCA:

urbanEligibleArea

---

## Percentual urbano monitorado

Definição:

urbanMonitoredArea / urbanTotalArea

---

## Percentual urbano vulnerável

Definição:

urbanIvpcArea / urbanEligibleArea

---

# Regra crítica

Métricas IVPC NÃO representam métricas totais da bacia.

---

# Separação obrigatória

| Tipo | Finalidade |
|---|---|
| métricas globais | descrição da bacia |
| métricas blind spot | deficiência operacional |
| métricas IVPC | vulnerabilidade relativa |

---

# Regras de coerência visual

As métricas devem refletir:

- raster urbano;
- blindSpotMask;
- mapas IVPC;
- distribuição espacial observável.

---

# Regras de relatório

O relatório deve distinguir explicitamente:

| Conceito | Significado |
|---|---|
| urbano total | toda urbanização |
| urbano monitorado | coberto operacionalmente |
| urbano blind spot | deficiência operacional |
| urbano elegível | universo IVPC |
| urbano vulnerável | score IVPC válido |

---

# Proibições metodológicas

É proibido:

- usar máscara IVPC como universo total;
- apresentar métricas IVPC como totais globais;
- inferir ausência total de monitoramento sem validação espacial;
- afirmar 100% sem coerência visual.

---

# Resultado esperado

As métricas devem:

- refletir corretamente os mapas;
- possuir coerência estatística;
- preservar universos metodológicos;
- evitar falsos percentuais globais.