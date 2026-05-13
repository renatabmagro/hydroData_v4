---
applyTo: "src/engine/**/*,src/analytics/**/*"
---

# Regras Semânticas IVPC

## Definição

O IVPC representa:

```text
vulnerabilidade relativa espacial em áreas sujeitas à inundação e com baixa cobertura operacional de monitoramento hidrológico.
```

---

# O IVPC NÃO representa

- risco absoluto;
- previsão;
- probabilidade de inundação;
- vulnerabilidade socioeconômica completa.

---

# Separação obrigatória

| Componente | Papel |
|---|---|
| physical hazard | elegibilidade |
| blind spot | elegibilidade operacional |
| exposure | intensidade operacional |
| sensitivity | intensidade populacional |
| IVPC | score final |

---

# Regras obrigatórias

## 1. Physical hazard

Deve atuar apenas como:

```text
filtro espacial de elegibilidade
```

Nunca entrar diretamente no score final.

---

## 2. Blind spot

Blind spot:

- representa deficiência operacional;
- NÃO representa score;
- NÃO representa intensidade contínua.

---

## 3. Exposure

Exposure:

- deve ser contínua;
- deve ser normalizada;
- NÃO deve usar threshold binário;
- NÃO é distância bruta.

---

## 4. Sensitivity

Sensitivity:

- representa intensidade populacional;
- deve permanecer normalizada;
- não deve usar hardcodes arbitrários.

---

## 5. Fórmula final

A fórmula IVPC deve usar exclusivamente:

- exposure;
- sensitivity.

---

# Proibições

É proibido:

- somar hazard no score;
- somar blind spot no score;
- mascarar universos estatísticos globais;
- misturar elegibilidade com intensidade.
```