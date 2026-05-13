---
applyTo: "src/**/*.ts"
---

# Earth Engine Instructions

## Objetivo

Garantir consistência geoespacial.

---

# Regras obrigatórias

## 1. Máscaras

Separar explicitamente:

- masks de elegibilidade;
- masks analíticas;
- masks visuais.

---

## 2. Reducers

Sempre explicitar:

- reducer;
- geometry;
- scale;
- maxPixels.

---

## 3. Scale

Nunca usar scale implícito.

---

## 4. maxPixels

Sempre definir explicitamente.

---

## 5. updateMask

Não utilizar:

```ts
updateMask(ivpcMask)
```

para derivar:

- denominadores globais;
- percentuais totais;
- métricas globais.

---

## 6. Projections

Sempre validar:

- CRS;
- resolução;
- alinhamento espacial.

---

## 7. Raster operations

Evitar:

- operações implícitas;
- normalizações ocultas;
- thresholds hardcoded.

---

# Regras de normalização

Toda normalização deve:

- possuir nome explícito;
- possuir min/max claros;
- possuir rastreabilidade.
```
