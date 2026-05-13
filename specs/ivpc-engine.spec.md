# IVPC Engine Specification

Version: 1.0
Status: Operational
Scope: Engine analítica IVPC

---

# Objetivo

Formalizar a engine analítica do IVPC garantindo:

- coerência metodológica;
- auditabilidade;
- verificabilidade;
- separação entre elegibilidade e intensidade;
- estabilidade semântica.

---

# Definição oficial do IVPC

O IVPC representa:

vulnerabilidade relativa espacial em áreas sujeitas à inundação e com deficiência operacional de monitoramento hidrológico.

---

# O IVPC NÃO representa

O IVPC NÃO é:

- previsão hidrológica;
- probabilidade de inundação;
- risco absoluto;
- vulnerabilidade socioeconômica completa;
- índice meteorológico.

---

# Objetivo metodológico

Identificar espacialmente:

- áreas urbanas potencialmente expostas;
- regiões com deficiência operacional de monitoramento;
- hotspots relativos de vulnerabilidade operacional.

---

# Arquitetura conceitual

A engine deve separar explicitamente:

| Componente | Papel |
|---|---|
| physical hazard | elegibilidade física |
| blind spot | elegibilidade operacional |
| exposure | intensidade operacional |
| sensitivity | intensidade populacional |
| IVPC | score final |

---

# Pipeline obrigatório

## Etapa 1 — Physical Hazard

Objetivo:

delimitar áreas fisicamente suscetíveis à inundação.

Resultado:

hazardMask

Tipo:

- binário;
- elegibilidade espacial.

---

## Etapa 2 — Blind Spot

Objetivo:

identificar deficiência operacional de monitoramento hidrológico.

Resultado:

blindSpotMask

Critério atual:

- distância > 10 km de estação hidrológica.

Tipo:

- binário;
- elegibilidade operacional.

---

## Etapa 3 — Universo Elegível IVPC

Definição:

ivpcEligibleMask = hazardMask AND blindSpotMask

Objetivo:

delimitar universo elegível para cálculo IVPC.

---

## Etapa 4 — Exposure

Objetivo:

representar intensidade relativa de deficiência operacional.

Tipo:

- contínuo;
- normalizado.

---

# Regras obrigatórias de Exposure

Exposure:

- NÃO pode ser binária;
- NÃO pode ser distância bruta;
- deve ser contínua;
- deve ser monotônica;
- deve ser normalizada.

---

# Exposure permitido

Exemplos válidos:

- distância normalizada;
- decay contínuo;
- kernel contínuo;
- custo acumulado normalizado.

---

# Exposure proibido

Exemplos inválidos:

- threshold binário;
- classes arbitrárias;
- score categórico hardcoded.

---

## Etapa 5 — Sensitivity

Objetivo:

representar intensidade populacional espacial.

Tipo:

- contínuo;
- normalizado.

---

# Regras obrigatórias de Sensitivity

Sensitivity:

- deve representar concentração populacional;
- deve ser normalizada;
- deve possuir rastreabilidade.

---

# Inputs permitidos

Exemplos válidos:

- densidade populacional;
- intensidade urbana;
- proxy populacional espacial.

---

# Inputs proibidos

Exemplos inválidos:

- índices socioeconômicos compostos sem spec;
- pesos arbitrários;
- inferências subjetivas.

---

## Etapa 6 — Cálculo IVPC

O IVPC deve utilizar exclusivamente:

IVPC = f(exposure, sensitivity)

---

# Regras obrigatórias do score

O score IVPC:

- NÃO pode incluir hazard diretamente;
- NÃO pode incluir blind spot diretamente;
- NÃO pode misturar elegibilidade e intensidade.

---

# Universo válido do score

O IVPC só pode existir dentro de:

ivpcEligibleMask

---

# Universo inválido

É proibido:

- calcular IVPC fora do universo elegível;
- utilizar score em regiões fora da elegibilidade operacional.

---

# Máscaras obrigatórias

| Máscara | Papel |
|---|---|
| hazardMask | elegibilidade física |
| blindSpotMask | elegibilidade operacional |
| ivpcEligibleMask | universo metodológico |
| ivpcScoreMask | score válido |

---

# Regras estatísticas

## Regra crítica

Camadas mascaradas NÃO podem ser utilizadas como denominador estatístico global.

---

# Separação obrigatória

Separar explicitamente:

| Universo | Significado |
|---|---|
| total | toda bacia |
| urbano | urbanização total |
| blind spot | deficiência operacional |
| elegível IVPC | universo metodológico |
| IVPC válido | score final |

---

# Regras Earth Engine

Toda operação deve explicitar:

- reducer;
- geometry;
- scale;
- maxPixels.

---

# Proibições metodológicas

É proibido:

- tratar IVPC como risco;
- tratar IVPC como previsão;
- somar hazard no score;
- somar blind spot no score;
- mascarar universos globais;
- usar thresholds arbitrários sem spec.

---

# Resultado esperado

A engine deve produzir:

- coerência espacial;
- coerência metodológica;
- rastreabilidade analítica;
- auditabilidade científica.