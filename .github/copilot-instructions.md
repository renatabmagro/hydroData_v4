# IVPC Platform — Copilot Instructions

## Objetivo do projeto

Esta plataforma implementa análises espaciais relacionadas ao IVPC (Índice de Vulnerabilidade Populacional Crítica), utilizando:

- análise geoespacial;
- métricas hidrológicas;
- vulnerabilidade relativa;
- cobertura operacional de monitoramento;
- geração de relatórios analíticos.

O projeto possui natureza:

- científica;
- metodológica;
- auditável;
- espacial.

---

# Regra fundamental

O sistema NÃO é um sistema de previsão hidrológica.

O IVPC:

- NÃO representa probabilidade de inundação;
- NÃO representa previsão;
- NÃO representa risco absoluto;
- NÃO representa vulnerabilidade socioeconômica completa.

O IVPC representa:

```text
vulnerabilidade relativa espacial em áreas sujeitas à inundação e com deficiência operacional de monitoramento hidrológico.
`````

---

# Fluxo obrigatório

Toda tarefa deve seguir:

1. Ler spec antes de editar código;
2. Identificar regras observáveis;
3. Propor plano curto;
4. Gerar ou revisar testes;
5. Implementar mudança mínima;
6. Validar semanticamente;
7. Revisar side effects;
8. Resumir o diff.

---

# Regras obrigatórias

## 1. Nunca inventar regras metodológicas

Se existir ambiguidade:

- perguntar;
- NÃO assumir;
- NÃO inferir silenciosamente.

---

## 2. Sempre priorizar verificabilidade

Tudo que puder ser:

- testado;
- tipado;
- validado;
- normalizado;
- explicitado;

NÃO deve ficar apenas no prompt.

---

## 3. Mudanças pequenas e focadas

Evitar:

- grandes refatorações implícitas;
- alterações arquiteturais silenciosas;
- mudanças amplas sem testes.

---

## 4. Não alterar semântica metodológica

É proibido:

- transformar IVPC em risco;
- usar linguagem alarmista;
- inferir causalidade hidrológica;
- alterar fórmulas sem spec;
- alterar pesos sem spec.

---

## 5. Regras sobre engine IVPC

Separar explicitamente:

| Componente | Papel |
|---|---|
| physical hazard | elegibilidade |
| blind spot | elegibilidade operacional |
| exposure | intensidade operacional |
| sensitivity | intensidade populacional |
| IVPC | score final |

---

## 6. Regras de exposição

Exposição:

- NÃO é distância bruta;
- deve ser contínua;
- deve ser normalizada;
- deve representar intensidade relativa.

---

## 7. Regras de sensibilidade

Sensibilidade:

- representa intensidade populacional espacial;
- NÃO representa vulnerabilidade socioeconômica completa.

---

## 8. Regras do relatório

O relatório:

- NÃO deve afirmar previsão;
- NÃO deve afirmar probabilidade;
- NÃO deve usar linguagem alarmista;
- NÃO deve usar máscaras IVPC como universo estatístico total.

---

## 9. Terminologia obrigatória

| NÃO usar | Usar |
|---|---|
| risco | vulnerabilidade relativa |
| perigo | suscetibilidade física |
| exposição | deficiência operacional |
| área crítica | hotspot espacial |

---

## 10. Regras técnicas

Preferir:

- funções puras;
- baixo acoplamento;
- módulos pequenos;
- tipagem explícita;
- validação runtime;
- schemas;
- testes determinísticos.

---

# Fluxo de revisão

Toda implementação deve:

1. passar em testes;
2. passar em validação semântica;
3. preservar coerência metodológica;
4. ser revisável;
5. possuir resumo do diff.

---