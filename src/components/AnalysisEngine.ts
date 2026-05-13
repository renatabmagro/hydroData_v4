import {
  validateReportNarrative
}
from "../reports/reportSemanticRules";

interface ReportInput {

  nomeBacia?: string;

  areaTotalKm2?: number;

  areaUrbanaRiscoKm2?: number;

  areaPontoCegoKm2?: number;

  porcentagemRisco?: number;

  urbanTotalArea?: number;

  urbanMonitoredArea?: number;

  urbanBlindSpotArea?: number;

  urbanEligibleArea?: number;

  distanciaMaxKm?: number;

  popTotalPontoCego?: number;

  popIdososCriancasRisco?: number;

  domSemSaneamento?: number;

  ivpcSocioambiental?: number;

  modoMetodologico?: string;

  qtdEstacoes?: number | null;

  mapUrls?: {
    fisico?: string;
    social?: string;
  };
}

function formatNumber(
  value: number,
  digits = 2
): string {

  return value.toLocaleString(
    "pt-BR",
    {
      minimumFractionDigits: digits,
      maximumFractionDigits: digits
    }
  );
}

function classifyIVPC(
  value: number
): string {

  if (value >= 0.8)
    return "Muito Alto";

  if (value >= 0.6)
    return "Alto";

  if (value >= 0.4)
    return "Moderado";

  if (value >= 0.2)
    return "Baixo";

  return "Muito Baixo";
}

export function gerarRelatorioIVPC(
  metricas: ReportInput
): string {

  const {

    nomeBacia = "Bacia não identificada",

    areaTotalKm2 = 0,

    areaUrbanaRiscoKm2 = 0,

    areaPontoCegoKm2 = 0,

    porcentagemRisco = 0,

    urbanTotalArea = 0,

    urbanMonitoredArea = 0,

    urbanBlindSpotArea = 0,

    urbanEligibleArea = 0,

    distanciaMaxKm = 0,

    popTotalPontoCego = 0,

    popIdososCriancasRisco = 0,

    domSemSaneamento = 0,

    ivpcSocioambiental = 0,

    modoMetodologico = "padrao",

    qtdEstacoes = null

  } = metricas;

  /*
  =====================================================
  UNIVERSOS ESTATÍSTICOS
  =====================================================
  */

  const uTotal =
    typeof urbanTotalArea === "number"
      ? urbanTotalArea
      : 0;

  const uBlind =
    typeof urbanBlindSpotArea === "number"
      ? urbanBlindSpotArea
      : areaPontoCegoKm2;

  const uEligible =
    typeof urbanEligibleArea === "number"
      ? urbanEligibleArea
      : areaUrbanaRiscoKm2;

  const uMonitored =
    typeof urbanMonitoredArea === "number"
      ? urbanMonitoredArea
      : Math.max(
          uTotal - uBlind,
          0
        );

  /*
  =====================================================
  PERCENTUAIS
  =====================================================
  */

  const percUrbanoMonitorado =
    uTotal > 0
      ? (
          uMonitored /
          uTotal
        ) * 100
      : 0;

  const percUrbanoBlindSpot =
    uTotal > 0
      ? (
          uBlind /
          uTotal
        ) * 100
      : porcentagemRisco;

  /*
  =====================================================
  VALIDAÇÃO SEMÂNTICA
  =====================================================
  */

  validateReportNarrative(
    percUrbanoBlindSpot,
    percUrbanoMonitorado
  );

  /*
  =====================================================
  CLASSIFICAÇÃO IVPC
  =====================================================
  */

  const classeIVPC =
    classifyIVPC(
      ivpcSocioambiental
    );

  /*
  =====================================================
  INTERPRETAÇÃO ESPACIAL
  =====================================================
  */

  let interpretacaoEspacial = "";

  if (
    ivpcSocioambiental > 0.6 &&
    percUrbanoBlindSpot > 40
  ) {

    interpretacaoEspacial = `
Os maiores valores do IVPC concentram-se em áreas urbanizadas com baixa cobertura hidrológica e elevada intensidade populacional vulnerável.
`;

  } else if (
    ivpcSocioambiental > 0.6
  ) {

    interpretacaoEspacial = `
Embora parte significativa da área urbana possua cobertura operacional, existem hotspots espaciais com vulnerabilidade relativa elevada.
`;

  } else if (
    percUrbanoBlindSpot > 60
  ) {

    interpretacaoEspacial = `
A deficiência operacional de monitoramento hidrológico é espacialmente significativa, embora a intensidade relativa do IVPC permaneça moderada.
`;

  } else {

    interpretacaoEspacial = `
A análise indica distribuição espacial relativamente equilibrada entre cobertura operacional e vulnerabilidade relativa.
`;
  }

  /*
  =====================================================
  NARRATIVA OPERACIONAL
  =====================================================
  */

  const coverageNarrative =
    percUrbanoBlindSpot >= 99

      ? `
Foi identificada deficiência operacional severa no monitoramento hidrológico urbano.
`

      : `
A análise identificou coexistência entre áreas monitoradas e áreas com deficiência operacional.
`;

  /*
  =====================================================
  AVISO METODOLÓGICO
  =====================================================
  */

  const semIbgeWarning =
    modoMetodologico === "sem_ibge"

      ? `
> **Atenção:** A análise foi executada sem camadas oficiais IBGE de áreas suscetíveis. Os resultados possuem menor rigor institucional comparativo.
`

      : "";

  /*
  =====================================================
  TEXTO METODOLÓGICO OBRIGATÓRIO
  =====================================================
  */

  const metodologiaNarrativa = `

## Interpretação metodológica

O IVPC representa um índice espacial multicritério de vulnerabilidade populacional relativa em áreas sujeitas à inundação e com baixa cobertura de monitoramento hidrológico.

O IVPC representa vulnerabilidade relativa dentro das condições espaciais analisadas.

O IVPC NÃO representa:
- probabilidade de inundação;
- previsão hidrológica;
- risco absoluto;
- vulnerabilidade social completa.

A análise distingue explicitamente:
- universo espacial total da bacia;
- área urbana total;
- área urbana monitorada;
- área urbana com deficiência operacional;
- universo elegível IVPC.

Camadas mascaradas NÃO podem ser utilizadas como denominador estatístico global.

As métricas operacionais NÃO utilizam a área total da bacia como denominador.

Cobertura monitorada estimada:
${formatNumber(percUrbanoMonitorado)}%.

Deficiência operacional estimada:
${formatNumber(percUrbanoBlindSpot)}%.
`;

  /*
  =====================================================
  RELATÓRIO FINAL
  =====================================================
  */

  return `

# Parecer Técnico — Diagnóstico IVPC

${semIbgeWarning}

## Identificação da análise

- Bacia analisada: ${nomeBacia}
- Data da análise: ${new Date().toLocaleDateString("pt-BR")}
- Modo metodológico: ${modoMetodologico}
- Quantidade de estações hidrológicas: ${qtdEstacoes ?? "N/A"}

---

## Resultado IVPC

### Índice IVPC

- Valor calculado: ${formatNumber(ivpcSocioambiental, 3)}
- Classificação: ${classeIVPC}

---

## Cobertura operacional hidrológica

- Área total da bacia:
${formatNumber(areaTotalKm2)} km²

- Área urbana total:
${formatNumber(uTotal)} km²

- Área urbana elegível IVPC:
${formatNumber(uEligible)} km²

- Área urbana monitorada:
${formatNumber(uMonitored)} km²

- Área urbana com deficiência operacional:
${formatNumber(uBlind)} km²

- Cobertura monitorada:
${formatNumber(percUrbanoMonitorado)}%

- Deficiência operacional:
${formatNumber(percUrbanoBlindSpot)}%

- Distância operacional máxima:
${formatNumber(distanciaMaxKm)} km

---

## Sensibilidade populacional

- População em áreas com deficiência operacional:
${popTotalPontoCego.toLocaleString("pt-BR")}

- População vulnerável:
${popIdososCriancasRisco.toLocaleString("pt-BR")}

- Estimativa de domicílios sem saneamento:
${domSemSaneamento.toLocaleString("pt-BR")}

---

## Interpretação espacial

${interpretacaoEspacial}

${coverageNarrative}

---

${metodologiaNarrativa}

---

## Conclusão

A análise indica que o IVPC deve ser interpretado como um indicador relativo de vulnerabilidade espacial multicritério.

Os resultados refletem:
- intensidade populacional vulnerável;
- deficiência operacional de monitoramento;
- distribuição espacial dos hotspots;
- elegibilidade física associada à suscetibilidade à inundação.

O índice NÃO deve ser interpretado como:
- previsão hidrológica;
- probabilidade futura;
- medida absoluta de risco.

`;
}