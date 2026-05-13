# IVPC Report Specification

Version: 1.0
Status: Operational
Scope: Relatórios analíticos IVPC

---

# Objetivo

Formalizar:

- semântica textual;
- interpretação espacial;
- interpretação estatística;
- coerência metodológica.

---

# Natureza do relatório

O relatório é:

analítico e metodológico.

O relatório NÃO é:

- previsão;
- alerta operacional;
- modelo probabilístico;
- diagnóstico definitivo de risco.

---

# Linguagem proibida

Nunca utilizar:

- risco de inundação;
- previsão de inundação;
- desastre iminente;
- probabilidade de inundação;
- região condenada;
- colapso hidrológico.

---

# Linguagem recomendada

Preferir:

- vulnerabilidade relativa;
- hotspot espacial;
- suscetibilidade física;
- deficiência operacional;
- intensidade populacional.

---

# Regras obrigatórias

## 1. Separação de universos

O relatório deve distinguir explicitamente:

| Universo | Significado |
|---|---|
| total | toda bacia |
| urbano | urbanização total |
| blind spot | deficiência operacional |
| elegível IVPC | universo metodológico |
| vulnerável | score IVPC válido |

---

## 2. Proibição crítica

Nunca utilizar máscara IVPC como universo estatístico global.

---

## 3. Métricas globais

Métricas globais:

- devem usar universo total;
- devem usar denominadores explícitos.

---

## 4. Métricas IVPC

Métricas IVPC:

- representam apenas universo elegível;
- NÃO representam totais globais.

---

# Regras de interpretação espacial

O relatório deve interpretar:

- concentração espacial;
- hotspots;
- cobertura operacional;
- intensidade relativa.

---

# Interpretações proibidas

É proibido:

- inferir causalidade absoluta;
- inferir previsão hidrológica;
- inferir magnitude real de inundação.

---

# Regras de coerência visual

As métricas devem ser coerentes com:

- mapas;
- rasters;
- máscaras;
- distribuição espacial observável.

---

# Estrutura obrigatória

## 1. Contexto metodológico

Descrever:

- escopo;
- limitações;
- significado do IVPC.

---

## 2. Cobertura hidrológica urbana

Apresentar:

| Métrica | Unidade |
|---|---|
| área urbana total | km² |
| área urbana monitorada | km² |
| área urbana blind spot | km² |
| % urbana monitorada | % |
| % urbana blind spot | % |

---

## 3. Vulnerabilidade IVPC

Apresentar:

- hotspots;
- intensidade relativa;
- distribuição espacial.

---

## 4. Limitações

Descrever:

- limitações operacionais;
- limitações metodológicas;
- limitações espaciais.

---

# Regras de escrita

Evitar:

- exageros;
- dramatização;
- afirmações absolutas;
- ambiguidade estatística.

---

# Resultado esperado

O relatório deve ser:

- auditável;
- tecnicamente defensável;
- semanticamente consistente;
- metodologicamente alinhado.