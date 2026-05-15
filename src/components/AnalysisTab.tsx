import React, { useState, useEffect } from "react";
import { Loader2, Zap, Users, ShieldAlert, Droplets, Download } from "lucide-react";
import { MapContainer, TileLayer, GeoJSON, useMap } from "react-leaflet";
import Markdown from "react-markdown";
import { gerarRelatorioIVPC } from "./AnalysisEngine";
import { runIVPCPipeline } from "../core/engine";
import type {RawAnalysisInput} from "../core/engine";

// @ts-ignore
import html2pdf from "html2pdf.js";
import { validateAnalysis } from "../services/runtime/runtimeValidation";


interface AnalysisTabProps {
  supabase: any;
  selectedBaciaMetadata: any;
  selectedBaciaGeojson: any;
  ivpcResultData?: any;
}

function MapUpdater({ geoJson }: { geoJson: any }) {
  const map = useMap();
  useEffect(() => {
    if (geoJson) {
      import('@turf/turf').then((turf) => {
        try {
          const bbox = turf.bbox(geoJson);
          map.fitBounds([
            [bbox[1], bbox[0]],
            [bbox[3], bbox[2]]
          ], { padding: [50, 50] });
        } catch (err) {
          console.error("Erro ao dar zoom na bacia:", err);
        }
      });
    }
  }, [geoJson, map]);
  return null;
}

export default function AnalysisTab({ supabase, selectedBaciaMetadata, selectedBaciaGeojson, ivpcResultData }: AnalysisTabProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [report, setReport] = useState<string>("");
  const [mapTileUrl, setMapTileUrl] = useState<string | null>(null);
  const [socialMapTileUrl, setSocialMapTileUrl] = useState<string | null>(null);
  const [activeLayer, setActiveLayer] = useState<'fisico' | 'socio'>('fisico');
  const [errorStatus, setErrorStatus] = useState<string>("");
  const [analisePrecalculada, setAnalisePrecalculada] = useState<any>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownloadPDF = async () => {
    const element = document.getElementById("report-content");
    if (!element) return;
    
    setIsDownloading(true);
    
    // Workaround: html2canvas (usado pelo html2pdf.js) não suporta a função de cor 'oklch' introduzida no Tailwind v4.
    // Vamos injetar temporariamente cores HEX explícitas para escapar do formato de cor oklch durante a exportação do PDF.
    const styleId = "pdf-export-style-fix";
    let styleEl = document.getElementById(styleId);
    if (!styleEl) {
      styleEl = document.createElement("style");
      styleEl.id = styleId;
      styleEl.innerHTML = `
        .pdf-export-mode, .pdf-export-mode * {
          color: #334155 !important;
          background-color: #ffffff !important;
          border-color: #e2e8f0 !important;
          text-decoration-color: #334155 !important;
          box-shadow: none !important;
          outline: none !important;
        }
        .pdf-export-mode img {
          background-color: transparent !important;
        }
      `;
      document.head.appendChild(styleEl);
    }

    element.classList.add("pdf-export-mode");

    try {
      const opt: any = {
        margin:       10,
        filename:     `relatorio_ivpc_${selectedBaciaMetadata?.id_bacia || 'bacia'}.pdf`,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2, useCORS: true },
        jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };
      
      await html2pdf().from(element).set(opt).save();
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
    } finally {
      element.classList.remove("pdf-export-mode");
      setIsDownloading(false);
    }
  };

  const buscarAnaliseSupabase = async () => {
    if (!selectedBaciaMetadata?.id) return;
    
    setReport("");
    setErrorStatus("Buscando indicadores pré-calculados do banco de dados...");
    setMapTileUrl(null);
    setSocialMapTileUrl(null);
    setIsProcessing(true);

    try {
      // ✅ Adicionar timeout na query (máx 10 segundos)
      const queryPromise = supabase
        .from('analise_ivpc')
        .select('*')
        .eq('bacia_id', selectedBaciaMetadata.id)
        .single();

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Timeout: Supabase query demorou mais de 10s')), 10000)
      );

      const { data, error } = await Promise.race([queryPromise, timeoutPromise]) as any;

      // ✅ Verificar erro PRIMEIRO (antes de tentar validar)
      if (error || !data) {
        console.warn("Query retornou vazio ou erro:", error);
        
        if (ivpcResultData?.stats) {
          console.log("Usando fallback com ivpcResultData");
          // Mock data context since DB fetch failed
          const dataToUse = {
            area_total_km2: ivpcResultData.stats.areaTotal,
            area_urbana_risco_km2: ivpcResultData.stats.urbanEligibleArea,
            area_ponto_cego_km2: ivpcResultData.stats.urbanBlindSpotArea,
            porcentagem_risco: ivpcResultData.stats.urbanTotalArea > 0 ? (ivpcResultData.stats.urbanBlindSpotArea / ivpcResultData.stats.urbanTotalArea) * 100 : 0,
            distancia_max_km: ivpcResultData.stats.distMax / 1000,
            pop_total_ponto_cego: ivpcResultData.stats.popTotalPontoCego,
            pop_idosos_criancas_risco: ivpcResultData.stats.popIdososCriancas,
            ivpc_socioambiental: ivpcResultData.stats.ivpcSocioambiental,
            modo_metodologico: ivpcResultData.modoMetodologico,
            url_asset_mapa_social: ivpcResultData.socialUrlFormat || ''
          };
          
          setAnalisePrecalculada(dataToUse);
          await processarPipeline(dataToUse, null);
        } else {
          setErrorStatus("A Análise IVPC ainda não foi gerada para esta bacia. Por favor, volte à aba 'Nova Extração' e realize a extração de dados para calcular o índice.");
          setIsProcessing(false);
        }
        return;
      }

      // ✅ Só chegar aqui se data NÃO é null
      console.log("Dados recebidos do Supabase:", data);
      
      let dataToUse;
      try {
        dataToUse = validateAnalysis(data);
      } catch (validationError) {
        console.error("Erro na validação dos dados:", validationError);
        setErrorStatus("Erro ao validar dados do banco de dados. Verifique se estão completos.");
        setIsProcessing(false);
        return;
      }

      setAnalisePrecalculada(dataToUse);
      await processarPipeline(dataToUse, data);

    } catch (err) {
      console.error("Erro na busca/processamento:", err);
      setErrorStatus(`Erro ao processar análise: ${err instanceof Error ? err.message : String(err)}`);
      setIsProcessing(false);
    }
  };

  // ✅ Extrair lógica de processamento em função separada
  const processarPipeline = async (dataToUse: RawAnalysisInput, data: any) => {
    try {
      console.log("Iniciando pipeline IVPC...");
      const startTime = performance.now();
      
      const pipelineResult = await runIVPCPipeline(dataToUse);
      
      const endTime = performance.now();
      console.log(`Pipeline concluído em ${(endTime - startTime).toFixed(2)}ms`);

      const metrics = pipelineResult.metrics;
      const ivpc = pipelineResult.ivpc;

      console.log("Gerando relatório...");
      const reportStartTime = performance.now();

      // Gera o relatório
      const textoRelatorio = gerarRelatorioIVPC({
        nomeBacia: selectedBaciaMetadata.nome_bacia,
        areaTotalKm2: metrics.areaTotalKm2,
        areaUrbanaRiscoKm2: ivpcResultData?.stats?.urbanEligibleArea || metrics.urbanEligibleArea,
        areaPontoCegoKm2: ivpcResultData?.stats?.urbanBlindSpotArea || metrics.urbanBlindSpotArea,
        porcentagemRisco: ivpcResultData?.stats ? (ivpcResultData.stats.urbanTotalArea > 0 ? (ivpcResultData.stats.urbanBlindSpotArea / ivpcResultData.stats.urbanTotalArea) * 100 : 0) : metrics.blindSpotPercentage,
        urbanTotalArea: ivpcResultData?.stats?.urbanTotalArea,
        urbanMonitoredArea: ivpcResultData?.stats?.urbanMonitoredArea,
        urbanBlindSpotArea: ivpcResultData?.stats?.urbanBlindSpotArea,
        urbanEligibleArea: ivpcResultData?.stats?.urbanEligibleArea,
        distanciaMaxKm: metrics.maxDistanceKm,
        popTotalPontoCego: metrics.populationBlindSpot,
        popIdososCriancasRisco: metrics.vulnerablePopulation,
        domSemSaneamento: dataToUse.pop_total_ponto_cego ? Math.floor(dataToUse.pop_total_ponto_cego / 3 * 0.15) : 0,
        ivpcSocioambiental: ivpc.value,
        modoMetodologico: dataToUse.modo_metodologico,
        qtdEstacoes: ivpcResultData?.stats?.qtdEstacoes,
        mapUrls: ivpcResultData?.mapUrls
      });

      const reportEndTime = performance.now();
      console.log(`Relatório gerado em ${(reportEndTime - reportStartTime).toFixed(2)}ms`);

      setReport(textoRelatorio);
      setErrorStatus("");

      // ✅ Carregar assets (não bloqueia o relatório)
      if (data?.asset_id && !data.asset_id.includes('SEU-USUARIO')) {
        try {
          const res = await fetch('/api/analise/asset-layer', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ assetId: data.asset_id })
          });
          const cType = res.headers.get("content-type");
          if (cType && cType.indexOf("application/json") !== -1) {
            const resData = await res.json();
            if (resData.urlFormat) {
              setMapTileUrl(resData.urlFormat);
              setSocialMapTileUrl(resData.urlFormat);
            }
          }
        } catch (e) {
          console.error("Erro ao carregar Asset Layer:", e);
        }
      } else if (data?.url_asset_mapa_social) {
        setMapTileUrl(data.url_asset_mapa_social);
        setSocialMapTileUrl(data.url_asset_mapa_social);
      }

      setIsProcessing(false);
    } catch (err) {
      console.error("Erro no processamento do pipeline:", err);
      setErrorStatus(`Erro ao processar pipeline: ${err instanceof Error ? err.message : String(err)}`);
      setIsProcessing(false);
    }
  };

  useEffect(() => {
    buscarAnaliseSupabase();
  }, [selectedBaciaMetadata, selectedBaciaGeojson, supabase]);

  if (!selectedBaciaMetadata || !selectedBaciaGeojson) {
    return (
      <div className="p-8 max-w-7xl mx-auto flex flex-col items-center justify-center h-full text-center">
        <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm max-w-lg">
          <Zap className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-800 mb-2">Nenhuma bacia selecionada</h2>
          <p className="text-slate-500 mb-6">
            Para realizar a análise de vulnerabilidade (IVPC), por favor, selecione e extraia uma bacia hidrográfica na aba "Nova extração" primeiro.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto flex flex-col h-full h-screen overflow-hidden">
      <div className="mb-6 flex-shrink-0">
        <h2 className="text-2xl font-bold text-slate-900">
          Análise de Vulnerabilidade {selectedBaciaMetadata.nivel ? `- ${selectedBaciaMetadata.nivel}: ${selectedBaciaMetadata.nome_bacia}` : `- ${selectedBaciaMetadata.nome_bacia}`}
        </h2>
        <p className="text-slate-500 mt-1">
          Índice de Vulnerabilidade de Ponto Cego (IVPC) nas Áreas Urbanas
        </p>
      </div>

      <div className="flex gap-4 mb-6 flex-shrink-0 bg-white p-4 rounded-xl border border-slate-200 justify-between items-center">
        <div className="text-sm font-medium text-slate-700">
          Bacia selecionada: <span className="text-blue-600 font-bold">{selectedBaciaMetadata.nome_bacia}</span>
        </div>
      </div>

      {errorStatus && !report && (
        <div className="mb-4 text-sm font-medium text-purple-700 bg-purple-50 p-3 rounded-md">
          {errorStatus}
        </div>
      )}

      {/* CARDS COM INDICADORES SOCIAIS */}
      {analisePrecalculada && (
        <div className="flex gap-4 mb-6 pt-2 flex-shrink-0">
          <div className="flex-1 bg-white p-4 rounded-xl border border-rose-200 shadow-sm border-l-4 border-l-rose-500">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500 mb-1">População no Ponto Cego</p>
                <h3 className="text-2xl font-bold text-slate-800">
                   {analisePrecalculada.pop_total_ponto_cego != null ? analisePrecalculada.pop_total_ponto_cego.toLocaleString('pt-BR') : 'N/A'}
                </h3>
              </div>
              <div className="p-2 bg-rose-100 rounded-lg">
                <Users className="w-5 h-5 text-rose-600" />
              </div>
            </div>
          </div>
          
          <div className="flex-1 bg-white p-4 rounded-xl border border-amber-200 shadow-sm border-l-4 border-l-amber-500">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500 mb-1">Domicílios em Risco</p>
                <h3 className="text-2xl font-bold text-slate-800">
                  {analisePrecalculada.pop_idosos_criancas_risco != null ? analisePrecalculada.pop_idosos_criancas_risco.toLocaleString('pt-BR') : 'N/A'}
                </h3>
              </div>
              <div className="p-2 bg-amber-100 rounded-lg">
                <ShieldAlert className="w-5 h-5 text-amber-600" />
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-1 gap-6 min-h-[500px]">
        {/* REPORT CONTAINER */}
        <div className="w-full flex flex-col bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="bg-slate-50 border-b border-slate-200 p-4 font-semibold text-slate-800 flex justify-between items-center">
            <span>Parecer Técnico ⚡ (Diagnóstico IVPC)</span>
            {report && (
              <button 
                onClick={handleDownloadPDF}
                disabled={isDownloading}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-1.5 rounded disabled:opacity-50 transition-colors"
                title="Baixar Relatório em PDF"
              >
                {isDownloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                {isDownloading ? "Gerando PDF..." : "Baixar PDF"}
              </button>
            )}
          </div>
          <div className="flex-1 overflow-auto p-6 text-sm text-slate-700" id="report-content">
            {report ? (
              <div className="markdown-body space-y-4 leading-relaxed">
                <Markdown>{report}</Markdown>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 text-center">
                {isProcessing ? (
                  <p className="animate-pulse">Analisando imagens e gerando modelo...</p>
                ) : (
                   <p>{errorStatus || 'Aguardando processamento no ETL...'}</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

