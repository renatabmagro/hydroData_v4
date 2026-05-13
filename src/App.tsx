import React, { useState, useEffect } from 'react';
import { Database, Map as MapIcon, Download, CheckCircle, Loader2, Play, Layers, FileText, Activity, Server, Key, Trash2, LineChart, Info } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, GeoJSON, useMap } from 'react-leaflet';
import L from 'leaflet';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://pnedbwdgcwlicitmfymz.supabase.co';
const supabaseKey = 'sb_publishable_LsKJ_gxuDVpQbh-i5WndqQ_PPyh7cJm';
const supabase = createClient(supabaseUrl, supabaseKey);
import TimeSeriesChart from './components/TimeSeriesChart';
import AnalysisTab from './components/AnalysisTab';

// Fix for default marker icons in react-leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const inmetIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-orange.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const anaIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

interface BaciaMetadata {
  id: string;
  nome_bacia: string;
  geometria_geojson: string;
  area_km2: number;
  data_extracao: string;
}

interface RasterData {
  id: string;
  bacia_id: string;
  tipo_dado: string;
  fonte: string;
  caminho_arquivo: string;
  resolucao_m: number;
}

export default function App() {
  const [activeTab, setActiveTab] = useState<'extract' | 'timeseries' | 'catalog' | 'analysis'>('extract');
  const [ivpcResultData, setIvpcResultData] = useState<any>(null);
  
  // State for Extraction
  const [selectedNivel, setSelectedNivel] = useState('Todos');
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [selectedCustomBacia, setSelectedCustomBacia] = useState<any>(null);
  
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractionComplete, setExtractionComplete] = useState(false);
  const [extractionError, setExtractionError] = useState('');
  const [basinGeojson, setBasinGeojson] = useState<any>(null);
  const [mdtTileUrl, setMdtTileUrl] = useState<string | null>(null);
  const [showMdtLayer, setShowMdtLayer] = useState(false);
  const [riosTileUrl, setRiosTileUrl] = useState<string | null>(null);
  const [showRiosLayer, setShowRiosLayer] = useState(false);
  const [inundacaoTileUrl, setInundacaoTileUrl] = useState<string | null>(null);
  const [showInundacaoLayer, setShowInundacaoLayer] = useState(false);
  const [urbGeojson, setUrbGeojson] = useState<any>(null);
  const [showUrbLayer, setShowUrbLayer] = useState(true);
  const [riskGeojson, setRiskGeojson] = useState<any>(null);
  const [showRiskLayer, setShowRiskLayer] = useState(true);
  const [estacoes, setEstacoes] = useState<any[]>([]);
  const [showEstacoes, setShowEstacoes] = useState(true);
  const [telemetriaData, setTelemetriaData] = useState<Record<string, any>>({});
  const [loadingTelemetria, setLoadingTelemetria] = useState<Record<string, boolean>>({});

  // State for Catalog
  const [bacias, setBacias] = useState<BaciaMetadata[]>([]);
  const [rasters, setRasters] = useState<RasterData[]>([]);
  const [confirmClear, setConfirmClear] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  useEffect(() => {
    if (activeTab === 'catalog') {
      fetchCatalog();
    }
  }, [activeTab]);

  useEffect(() => {
    if (searchQuery.length < 3) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      let query = supabase
        .from('bacias_niveis')
        .select('id, nome_bacia, nivel, codigo_bacia');
        
      if (selectedNivel !== 'Todos') {
        query = query.eq('nivel', selectedNivel);
      }
      
      const { data, error } = await query
        .ilike('nome_bacia', `%${searchQuery}%`)
        .limit(10);
      
      if (data) {
        setSuggestions(data);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, selectedNivel]);

  const handleClearData = async () => {
    setIsClearing(true);
    try {
      const res = await fetch('/api/catalog/clear', { method: 'DELETE' });
      if (res.ok) {
        fetchCatalog();
        setConfirmClear(false);
      }
    } catch (error) {
      console.error("Erro ao limpar dados:", error);
    } finally {
      setIsClearing(false);
    }
  };

  const handleDownloadDB = () => {
    window.location.href = '/api/export/db';
  };

  const fetchCatalog = async () => {
    try {
      const baciasRes = await fetch('/api/catalog/bacias');
      if (!baciasRes.ok) {
        const text = await baciasRes.text();
        throw new Error(`Erro no servidor bacias (${baciasRes.status}): ${text.substring(0, 100)}`);
      }
      const baciasText = await baciasRes.text();
      let baciasData;
      try {
        baciasData = JSON.parse(baciasText);
      } catch (e) {
        throw new Error(`Resposta inesperada servidor bacias (${baciasRes.status}). Recarregue a página. Conteúdo: ${baciasText.substring(0, 100)}`);
      }
      setBacias(baciasData);

      const rastersRes = await fetch('/api/catalog/rasters');
      if (!rastersRes.ok) {
        const text = await rastersRes.text();
        throw new Error(`Erro no servidor rasters (${rastersRes.status}): ${text.substring(0, 100)}`);
      }
      const rastersText = await rastersRes.text();
      let rastersData;
      try {
        rastersData = JSON.parse(rastersText);
      } catch (e) {
        throw new Error(`Resposta inesperada servidor rasters (${rastersRes.status}). Recarregue a página. Conteúdo: ${rastersText.substring(0, 100)}`);
      }
      setRasters(rastersData);
    } catch (error) {
      console.error('Error fetching catalog:', error);
    }
  };

  const fetchTelemetria = async (orgao: string, codigo: string) => {
    if (telemetriaData[codigo] || loadingTelemetria[codigo]) return;

    setLoadingTelemetria(prev => ({ ...prev, [codigo]: true }));
    try {
      const res = await fetch(`/api/telemetria/${orgao}/${codigo}`);
      if (res.ok) {
        const text = await res.text();
        try {
          const data = JSON.parse(text);
          setTelemetriaData(prev => ({ ...prev, [codigo]: data }));
        } catch (e) {}
      }
    } catch (error) {
      console.error("Erro ao buscar telemetria:", error);
      setTelemetriaData(prev => ({ ...prev, [codigo]: { status: 'offline', mensagem: 'Erro na conexão' } }));
    } finally {
      setLoadingTelemetria(prev => ({ ...prev, [codigo]: false }));
    }
  };

  useEffect(() => {
    if (basinGeojson) {
      const fetchEstacoes = async () => {
        try {
          const res = await fetch('/api/estacoes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ geometria: basinGeojson })
          });
          if (res.ok) {
            const text = await res.text();
            try {
              const data = JSON.parse(text);
              setEstacoes(data.estacoes || data);
            } catch (e) {}
          }
        } catch (err) {
          console.error("Erro ao buscar estações:", err);
        }
      };
      fetchEstacoes();
    } else {
      setEstacoes([]);
    }
  }, [basinGeojson]);

  const handleExtraction = async () => {
    setIsExtracting(true);
    setExtractionComplete(false);
    setExtractionError('');
    setBasinGeojson(null);
    setMdtTileUrl(null);
    setShowMdtLayer(false);
    setRiosTileUrl(null);
    setShowRiosLayer(false);
    setInundacaoTileUrl(null);
    setShowInundacaoLayer(false);
    setUrbGeojson(null);
    setShowUrbLayer(true);
    setRiskGeojson(null);
    setShowRiskLayer(true);

    let baciaPayload: any = {};
      
    if (!selectedCustomBacia) {
      setExtractionError('Selecione uma bacia da lista de sugestões.');
      setIsExtracting(false);
      return;
    }
    
    const { data, error } = await supabase
      .from('bacias_niveis')
      .select('geojson_bacia, nome_bacia')
      .eq('id', selectedCustomBacia.id)
      .single();
      
    if (error || !data) {
      console.error("Supabase error fetching basin:", error);
      setExtractionError(`Erro ao buscar geometria da bacia no Supabase: ${error?.message || 'Dados não encontrados'}`);
      setIsExtracting(false);
      return;
    }

    baciaPayload = {
      basinName: data.nome_bacia,
      level: 8,
      geoJsonBacia: data.geojson_bacia
    };

    try {
      const res = await fetch('/api/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(baciaPayload)
      });
      
      let data;
      if (res.ok) {
        const text = await res.text();
        try {
          data = JSON.parse(text);
        } catch (e) {
          throw new Error(`Resposta inesperada servidor (${res.status}). Pode indicar instabilidade. Refaça a operação.`);
        }
      } else {
        const text = await res.text();
        throw new Error(`Erro do servidor (${res.status}): ${text.substring(0, 100)}`);
      }
      
      if (data.success) {
        setExtractionComplete(true);
        setBasinGeojson(data.geomGeojson);
        if (data.mdtTileUrl) {
          setMdtTileUrl(data.mdtTileUrl);
          setShowMdtLayer(true);
        }
        if (data.riosTileUrl) {
          setRiosTileUrl(data.riosTileUrl);
          setShowRiosLayer(true);
        }
        if (data.inundacaoTileUrl) {
          setInundacaoTileUrl(data.inundacaoTileUrl);
          setShowInundacaoLayer(true);
        }
        if (data.urbanizacaoGeojson) {
          setUrbGeojson(data.urbanizacaoGeojson);
        }
        if (data.riscoGeojson) {
          setRiskGeojson(data.riscoGeojson);
        }

        // Automatic IVPC calculation during extraction
        try {
          const resEstReq = await fetch('/api/estacoes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ geometria: data.geomGeojson })
          });
          let ests: any[] = [];
          if (resEstReq.ok) {
            const text = await resEstReq.text();
            try {
              const dataEst = JSON.parse(text);
              ests = dataEst.estacoes || dataEst;
            } catch (e) {}
          }
          const resIvpc = await fetch('/api/analise/ivpc', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ geoJson: data.geomGeojson, estacoes: ests })
          });
          if (resIvpc.ok) {
            const text = await resIvpc.text();
            try {
              const ivpcData = JSON.parse(text);
              setIvpcResultData(ivpcData);
              const { error: upsertErr } = await supabase.from('analise_ivpc').upsert({
                 bacia_id: selectedCustomBacia.id,
                 area_total_km2: ivpcData.stats.areaTotal || 0,
                 area_urbana_risco_km2: ivpcData.stats.urbanEligibleArea || 0,
                 area_ponto_cego_km2: ivpcData.stats.urbanBlindSpotArea || 0,
                 porcentagem_risco: ivpcData.stats.urbanTotalArea > 0 ? (ivpcData.stats.urbanBlindSpotArea / ivpcData.stats.urbanTotalArea) * 100 : 0,
                 distancia_max_km: (ivpcData.stats.distMax || 0) / 1000,
                 pop_total_ponto_cego: ivpcData.stats.popTotalPontoCego || 0,
                 pop_idosos_criancas_risco: ivpcData.stats.popIdososCriancas || 0,
                 indice_infraestrutura: ivpcData.stats.indiceInfraestrutura || 0,
                 ivpc_socioambiental: ivpcData.stats.ivpcSocioambiental || 0,
                 url_asset_mapa_social: ivpcData.socialUrlFormat || '',
                 asset_id: `users/SEU-USUARIO/ivpc_bacias/${String(selectedCustomBacia.id).replace(/-/g,'_')}`
              }, { onConflict: 'bacia_id' });
              
              if (upsertErr) {
                console.error("Erro ao salvar IVPC no Supabase:", upsertErr);
              }
            } catch (errParse) {
              console.error("Endpoint /api/analise/ivpc não retornou JSON.", errParse);
            }
          } else {
             const errText = await resIvpc.text();
             console.error(`Erro no retorno de /api/analise/ivpc: ${resIvpc.status} ${errText}`);
          }
        } catch (e) {
          console.error("Erro ao calcular IVPC automaticamente na extração:", e);
        }
      } else {
        setExtractionError(data.error || 'Erro na extração');
      }
    } catch (error: any) {
      setExtractionError(error.message);
    } finally {
      setIsExtracting(false);
    }
  };

  const mapCenterLat = -15;
  const mapCenterLng = -50;

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-900">
      {/* Sidebar */}
      <div className="w-64 bg-slate-900 text-slate-300 flex flex-col">
        <div className="p-6 border-b border-slate-800">
          <div className="flex items-center gap-3 text-white mb-2">
            <Activity className="w-6 h-6 text-blue-400" />
            <h1 className="font-semibold text-lg tracking-tight">HydroData</h1>
          </div>
          <p className="text-xs text-slate-500">Orquestrador de Monitoramento</p>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          <button
            onClick={() => setActiveTab('extract')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'extract' 
                ? 'bg-blue-600 text-white' 
                : 'hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Download className="w-4 h-4" />
            Nova Extração
          </button>
          <button
            onClick={() => setActiveTab('timeseries')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'timeseries' 
                ? 'bg-blue-600 text-white' 
                : 'hover:bg-slate-800 hover:text-white'
            }`}
          >
            <LineChart className="w-4 h-4" />
            Séries Históricas
          </button>
          <button
            onClick={() => setActiveTab('catalog')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'catalog' 
                ? 'bg-blue-600 text-white' 
                : 'hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Database className="w-4 h-4" />
            Catálogo SQLite
          </button>
          <button
            onClick={() => setActiveTab('analysis')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'analysis' 
                ? 'bg-purple-600 text-white' 
                : 'hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Layers className="w-4 h-4" />
            Análise
          </button>
        </nav>

        <div className="p-4 border-t border-slate-800 text-xs text-slate-500">
          <div className="flex items-center gap-2 mb-2">
            <Server className="w-3 h-3" />
            <span>Status: Online</span>
          </div>
          <p>GEE API: <span className="text-emerald-400">Autenticado</span></p>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        {activeTab === 'extract' ? (
          <div className="p-8 max-w-6xl mx-auto">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-slate-900">Extração de Dados Hidrológicos</h2>
              <p className="text-slate-500 mt-1">Pipeline automatizado via Google Earth Engine (GEE)</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Form Column */}
              <div className="lg:col-span-1 space-y-6">
                
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                  <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                    <MapIcon className="w-4 h-4 text-blue-500" />
                    Parâmetros da Bacia
                  </h3>
                  
                  <div className="space-y-4">
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">Nível da Bacia</label>
                        <select 
                          value={selectedNivel}
                          onChange={(e) => {
                            setSelectedNivel(e.target.value);
                            setSearchQuery('');
                            setSelectedCustomBacia(null);
                          }}
                          disabled={isExtracting}
                          className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100"
                        >
                          <option value="Todos">Todos os níveis</option>
                          <option value="Nivel 2">Nível 2</option>
                          <option value="Nivel 3">Nível 3</option>
                          <option value="Nivel 4">Nível 4</option>
                          <option value="Nivel 5">Nível 5</option>
                          <option value="Nivel 6">Nível 6</option>
                        </select>
                      </div>
                      <div className="relative">
                        <label className="block text-xs font-medium text-slate-500 mb-1">Nome da Bacia</label>
                        <input 
                          type="text"
                          placeholder="Digite 3+ letras..."
                          value={searchQuery}
                          onChange={(e) => {
                            setSearchQuery(e.target.value);
                            setSelectedCustomBacia(null);
                          }}
                          disabled={isExtracting}
                          className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100"
                        />
                        {suggestions.length > 0 && !selectedCustomBacia && (
                          <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-md shadow-lg max-h-48 overflow-auto">
                            {suggestions.map(sug => (
                              <button
                                key={sug.id}
                                className="w-full text-left px-3 py-2 text-sm hover:bg-blue-50 text-slate-800"
                                onClick={() => {
                                  setSelectedCustomBacia(sug);
                                  setSearchQuery(sug.nome_bacia);
                                  setSuggestions([]);
                                }}
                              >
                                {sug.nome_bacia}
                              </button>
                            ))}
                          </div>
                        )}
                        {selectedCustomBacia && (
                          <div className="mt-1 flex items-center justify-between bg-green-50 text-green-800 text-xs px-2 py-1 rounded">
                            <span>Selecionado: {selectedCustomBacia.nome_bacia}</span>
                            <button onClick={() => { setSelectedCustomBacia(null); setSearchQuery(''); }} className="text-green-900 hover:text-green-700 font-bold">&times;</button>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="pt-4">
                      <button 
                        onClick={handleExtraction}
                        disabled={isExtracting}
                        className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-md text-sm font-medium transition-colors disabled:bg-blue-400"
                      >
                        {isExtracting ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Processando na Nuvem...
                          </>
                        ) : (
                          <>
                            <Play className="w-4 h-4" />
                            Iniciar Extração Real
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Extraction Progress */}
                {(isExtracting || extractionComplete || extractionError) && (
                  <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                      <Layers className="w-4 h-4 text-blue-500" />
                      Status do Pipeline
                    </h3>
                    
                    {isExtracting && (
                      <div className="flex items-center gap-3 text-blue-600 font-medium text-sm">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Consultando Earth Engine e SQLite...
                      </div>
                    )}

                    {extractionError && (
                      <div className="p-3 bg-red-50 border border-red-100 rounded-md text-red-800 text-sm">
                        <strong>Erro:</strong> {extractionError}
                      </div>
                    )}
                    
                    {extractionComplete && (
                      <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-md text-emerald-800 text-sm">
                        <CheckCircle className="w-4 h-4 inline mr-2" />
                        <strong>Sucesso!</strong> Bacia {selectedCustomBacia?.nome_bacia ? `(${selectedCustomBacia.nome_bacia})` : ''} processada com sucesso a partir do banco de dados. Dados raster e inundações vinculados.
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Map Column */}
              <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[600px]">
                <div className="p-4 border-b border-slate-200 bg-slate-50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <h3 className="font-semibold text-slate-800 text-sm whitespace-nowrap">Visualização Espacial</h3>
                  <div className="flex flex-wrap gap-2 items-center">
                    {mdtTileUrl && (
                      <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer bg-white px-2 py-1.5 rounded-md border border-slate-200 shadow-sm hover:bg-slate-50 transition-colors">
                        <input 
                          type="checkbox" 
                          checked={showMdtLayer} 
                          onChange={(e) => setShowMdtLayer(e.target.checked)}
                          className="rounded text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
                        />
                        MDT (Elevação)
                        <span title="Modelo Digital de Terreno (SRTM 30m) - Mostra a elevação do relevo.">
                          <Info size={16} className="text-slate-400 hover:text-blue-500 transition-colors" />
                        </span>
                      </label>
                    )}
                    {riosTileUrl && (
                      <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer bg-white px-2 py-1.5 rounded-md border border-slate-200 shadow-sm hover:bg-slate-50 transition-colors">
                        <input 
                          type="checkbox" 
                          checked={showRiosLayer} 
                          onChange={(e) => setShowRiosLayer(e.target.checked)}
                          className="rounded text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
                        />
                        Rede Hidrográfica
                        <span title="Rios extraídos da base MERIT Hydro com área de drenagem > 10km².">
                          <Info size={16} className="text-slate-400 hover:text-blue-500 transition-colors" />
                        </span>
                      </label>
                    )}
                    {inundacaoTileUrl && (
                      <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer bg-white px-2 py-1.5 rounded-md border border-slate-200 shadow-sm hover:bg-slate-50 transition-colors">
                        <input 
                          type="checkbox" 
                          checked={showInundacaoLayer} 
                          onChange={(e) => setShowInundacaoLayer(e.target.checked)}
                          className="rounded text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
                        />
                        Frequência de Água (1984-2021)
                        <span title="Ocorrência histórica (JRC). Calcula a % do tempo que o local esteve coberto por água em 38 anos de imagens de satélite.">
                          <Info size={16} className="text-slate-400 hover:text-blue-500 transition-colors" />
                        </span>
                      </label>
                    )}
                    {estacoes.length > 0 && (
                      <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer bg-white px-2 py-1.5 rounded-md border border-slate-200 shadow-sm hover:bg-slate-50 transition-colors">
                        <input 
                          type="checkbox" 
                          checked={showEstacoes} 
                          onChange={(e) => setShowEstacoes(e.target.checked)}
                          className="rounded text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
                        />
                        Estações ({estacoes.length})
                        <span title="Estações fluviométricas e pluviométricas da ANA.">
                          <Info size={16} className="text-slate-400 hover:text-blue-500 transition-colors" />
                        </span>
                      </label>
                    )}
                    {urbGeojson && (
                      <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer bg-white px-2 py-1.5 rounded-md border border-slate-200 shadow-sm hover:bg-slate-50 transition-colors">
                        <input 
                          type="checkbox" 
                          checked={showUrbLayer} 
                          onChange={(e) => setShowUrbLayer(e.target.checked)}
                          className="rounded text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
                        />
                        Mancha Urbana
                        <span title="Área urbanizada dos municípios inseridos na bacia (Fonte: IBGE).">
                          <Info size={16} className="text-slate-400 hover:text-blue-500 transition-colors" />
                        </span>
                      </label>
                    )}
                    {riskGeojson && (
                      <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer bg-white px-2 py-1.5 rounded-md border border-slate-200 shadow-sm hover:bg-slate-50 transition-colors">
                        <input 
                          type="checkbox" 
                          checked={showRiskLayer} 
                          onChange={(e) => setShowRiskLayer(e.target.checked)}
                          className="rounded text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
                        />
                        Áreas de Risco
                        <span title="Áreas de risco mapeadas nos municípios da bacia.">
                          <Info size={16} className="text-slate-400 hover:text-blue-500 transition-colors" />
                        </span>
                      </label>
                    )}
                    <div className="flex gap-2">
                      <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
                        HydroSHEDS
                      </span>
                      <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-amber-100 text-amber-800">
                        SRTM 30m
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex-1 relative z-0">
                  <MapContainer 
                    center={[mapCenterLat, mapCenterLng]} 
                    zoom={5} 
                    style={{ height: '100%', width: '100%' }}
                  >
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    {showMdtLayer && mdtTileUrl && (
                      <TileLayer
                        url={mdtTileUrl}
                        opacity={0.7}
                        zIndex={10}
                      />
                    )}
                    {showRiosLayer && riosTileUrl && (
                      <TileLayer
                        url={riosTileUrl}
                        opacity={1.0}
                        zIndex={20}
                      />
                    )}
                    {showInundacaoLayer && inundacaoTileUrl && (
                      <TileLayer
                        url={inundacaoTileUrl}
                        opacity={0.8}
                        zIndex={15}
                      />
                    )}
                    <Marker position={[mapCenterLat, mapCenterLng]}>
                      <Popup>
                        Ponto de Referência
                      </Popup>
                    </Marker>
                    {basinGeojson && (
                      <GeoJSON 
                        key="basin"
                        data={basinGeojson} 
                        style={{ color: '#2563eb', weight: 2, fillColor: '#3b82f6', fillOpacity: 0.2 }} 
                      />
                    )}
                    {showUrbLayer && urbGeojson && (
                      <GeoJSON 
                        key={`urb-${urbGeojson.features?.length || 0}`}
                        data={urbGeojson} 
                        style={{ color: '#f97316', weight: 1, fillColor: '#ea580c', fillOpacity: 0.6 }} 
                        onEachFeature={(feature, layer) => {
                          if (feature.properties) {
                            layer.bindPopup(`<strong>Mancha Urbana</strong><br/>Município: ${feature.properties.municipio} - ${feature.properties.uf}`);
                          }
                        }}
                      />
                    )}
                    {showRiskLayer && riskGeojson && (
                      <GeoJSON 
                        key={`risk-${riskGeojson.features?.length || 0}`}
                        data={riskGeojson} 
                        style={{ color: '#dc2626', weight: 1, fillColor: '#ef4444', fillOpacity: 0.7 }} 
                        onEachFeature={(feature, layer) => {
                          if (feature.properties) {
                            layer.bindPopup(`<strong>Área de Risco</strong><br/>Município: ${feature.properties.municipio} - ${feature.properties.uf}`);
                          }
                        }}
                      />
                    )}
                    {showEstacoes && estacoes.map((est, idx) => (
                      <Marker 
                        key={idx} 
                        position={[est.latitude, est.longitude]}
                        icon={est.origem === 'INMET' ? inmetIcon : anaIcon}
                        eventHandlers={{
                          click: () => fetchTelemetria(est.origem, est.codigo),
                        }}
                      >
                        <Popup className="telemetria-popup">
                          <div className="text-sm min-w-[200px]">
                            <div className="flex items-center justify-between mb-2 border-b pb-2">
                              <strong className="text-base text-slate-800">{est.nome}</strong>
                              <span className={`text-xs px-2 py-0.5 rounded-full font-medium text-white ${est.origem === 'INMET' ? 'bg-orange-500' : 'bg-blue-500'}`}>
                                {est.origem}
                              </span>
                            </div>
                            <p className="m-0 text-slate-500 text-xs mb-3">Cód: {est.codigo} | {est.tipo}</p>
                            
                            <div className="bg-slate-50 p-3 rounded border border-slate-100">
                              {loadingTelemetria[est.codigo] ? (
                                <div className="flex items-center justify-center py-2 text-slate-400">
                                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                  <span className="text-xs">Buscando dados...</span>
                                </div>
                              ) : telemetriaData[est.codigo] ? (
                                telemetriaData[est.codigo].status === 'offline' ? (
                                  <div className="text-amber-600 text-xs flex items-center gap-1">
                                    <Activity className="w-3 h-3" />
                                    {telemetriaData[est.codigo].mensagem}
                                  </div>
                                ) : (
                                  <div className="space-y-1.5 text-slate-700">
                                    {telemetriaData[est.codigo].nivel_cm !== null && (
                                      <p className="m-0 flex justify-between">
                                        <span>Nível D'água:</span> 
                                        <strong>{telemetriaData[est.codigo].nivel_cm} cm</strong>
                                      </p>
                                    )}
                                    {telemetriaData[est.codigo].vazao_m3s !== null && (
                                      <p className="m-0 flex justify-between">
                                        <span>Vazão:</span> 
                                        <strong>{telemetriaData[est.codigo].vazao_m3s} m³/s</strong>
                                      </p>
                                    )}
                                    {telemetriaData[est.codigo].chuva_mm !== null && (
                                      <p className="m-0 flex justify-between">
                                        <span>Chuva:</span> 
                                        <strong>{telemetriaData[est.codigo].chuva_mm} mm</strong>
                                      </p>
                                    )}
                                    {telemetriaData[est.codigo].temperatura_c !== null && (
                                      <p className="m-0 flex justify-between">
                                        <span>Temperatura:</span> 
                                        <strong>{telemetriaData[est.codigo].temperatura_c} °C</strong>
                                      </p>
                                    )}
                                    <div className="mt-2 pt-2 border-t border-slate-200 text-[10px] text-slate-400 text-right">
                                      Leitura: {telemetriaData[est.codigo].data_leitura}
                                    </div>
                                  </div>
                                )
                              ) : (
                                <div className="text-slate-400 text-xs text-center">
                                  Clique para carregar dados
                                </div>
                              )}
                            </div>
                          </div>
                        </Popup>
                      </Marker>
                    ))}
                    <MapUpdater lat={mapCenterLat} lng={mapCenterLng} geojson={basinGeojson} />
                  </MapContainer>
                  
                  {/* Legenda Flutuante da Frequência de Água */}
                  {showInundacaoLayer && inundacaoTileUrl && (
                    <div className="absolute bottom-6 right-6 z-[1000] bg-white/95 backdrop-blur-sm p-3 rounded-lg border border-slate-200 shadow-lg pointer-events-auto w-56">
                      <h4 className="text-xs font-semibold text-slate-800 mb-2">Frequência de Água</h4>
                      <div className="flex flex-col gap-1">
                        <div 
                          className="h-3 w-full rounded border border-slate-300"
                          style={{ background: 'linear-gradient(to right, lightblue, blue, darkblue)' }}
                        ></div>
                        <div className="flex justify-between text-[10px] font-medium text-slate-600 mt-1">
                          <span>0% (Raro)</span>
                          <span>100% (Permanente)</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : activeTab === 'timeseries' ? (
          <div className="p-8 max-w-6xl mx-auto">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-slate-900">Séries Históricas</h2>
              <p className="text-slate-500 mt-1">Análise de séries temporais de precipitação e inundação</p>
            </div>
            {extractionComplete && basinGeojson ? (
              <TimeSeriesChart selectedBasinGeoJSON={basinGeojson} />
            ) : (
              <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200 text-center">
                <LineChart className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-900 mb-2">Nenhuma bacia selecionada</h3>
                <p className="text-slate-500">
                  Realize uma extração na aba "Nova Extração" para visualizar as séries históricas da bacia.
                </p>
                <button
                  onClick={() => setActiveTab('extract')}
                  className="mt-6 px-4 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg font-medium transition-colors inline-flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Ir para Nova Extração
                </button>
              </div>
            )}
          </div>
        ) : activeTab === 'catalog' ? (
          <div className="p-8 max-w-6xl mx-auto">
            <div className="flex justify-between items-start mb-8">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Catálogo de Dados</h2>
                <p className="text-slate-500 mt-1">Visualização das tabelas do banco de dados local</p>
              </div>
              <div className="flex items-center gap-3">
                <button 
                  onClick={handleDownloadDB}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg font-medium transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Baixar Metadados (DB)
                </button>
                {!confirmClear ? (
                  <button 
                    onClick={() => setConfirmClear(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg font-medium transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    Limpar Dados
                  </button>
                ) : (
                  <div className="flex items-center gap-2 bg-red-50 p-2 rounded-lg border border-red-100">
                    <span className="text-sm text-red-800 font-medium mr-2">Tem certeza?</span>
                    <button 
                      onClick={handleClearData}
                      disabled={isClearing}
                      className="px-3 py-1.5 bg-red-600 text-white hover:bg-red-700 rounded-md font-medium transition-colors text-sm disabled:opacity-50"
                    >
                      {isClearing ? 'Limpando...' : 'Sim, excluir tudo'}
                    </button>
                    <button 
                      onClick={() => setConfirmClear(false)}
                      disabled={isClearing}
                      className="px-3 py-1.5 bg-white text-slate-700 hover:bg-slate-50 border border-slate-200 rounded-md font-medium transition-colors text-sm disabled:opacity-50"
                    >
                      Cancelar
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-8">
              {/* bacia_metadata table */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-slate-500" />
                  <h3 className="font-semibold text-slate-800">Tabela: bacia_metadata</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="px-6 py-3">id</th>
                        <th className="px-6 py-3">nome_bacia</th>
                        <th className="px-6 py-3">geometria_geojson</th>
                        <th className="px-6 py-3">area_km2</th>
                        <th className="px-6 py-3">data_extracao</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bacias.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                            Nenhum registro encontrado. Execute uma extração primeiro.
                          </td>
                        </tr>
                      ) : (
                        bacias.map((bacia) => (
                          <tr key={bacia.id} className="border-b border-slate-100 hover:bg-slate-50">
                            <td className="px-6 py-4 font-medium text-slate-900">{bacia.id}</td>
                            <td className="px-6 py-4">{bacia.nome_bacia}</td>
                            <td className="px-6 py-4 font-mono text-xs text-slate-500 truncate max-w-[200px]">{bacia.geometria_geojson}</td>
                            <td className="px-6 py-4">{bacia.area_km2.toFixed(2)}</td>
                            <td className="px-6 py-4">{bacia.data_extracao}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* raster_data table */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-slate-500" />
                  <h3 className="font-semibold text-slate-800">Tabela: raster_data</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="px-6 py-3">id</th>
                        <th className="px-6 py-3">bacia_id</th>
                        <th className="px-6 py-3">tipo_dado</th>
                        <th className="px-6 py-3">fonte</th>
                        <th className="px-6 py-3">caminho_arquivo</th>
                        <th className="px-6 py-3">resolucao_m</th>
                        <th className="px-6 py-3 text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rasters.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="px-6 py-8 text-center text-slate-500">
                            Nenhum registro encontrado.
                          </td>
                        </tr>
                      ) : (
                        rasters.map((raster) => (
                          <tr key={raster.id} className="border-b border-slate-100 hover:bg-slate-50">
                            <td className="px-6 py-4 font-medium text-slate-900">{raster.id}</td>
                            <td className="px-6 py-4">{raster.bacia_id}</td>
                            <td className="px-6 py-4">
                              <span className={`px-2 py-1 rounded text-xs font-medium ${
                                raster.tipo_dado === 'MDT' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'
                              }`}>
                                {raster.tipo_dado}
                              </span>
                            </td>
                            <td className="px-6 py-4">{raster.fonte}</td>
                            <td className="px-6 py-4 font-mono text-xs text-slate-500">{raster.caminho_arquivo}</td>
                            <td className="px-6 py-4">{raster.resolucao_m}m</td>
                            <td className="px-6 py-4 text-right">
                              <button
                                onClick={() => window.location.href = `/api/export/raster/${raster.id}`}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-blue-600 rounded-md text-xs font-medium transition-colors"
                              >
                                <Download className="w-3.5 h-3.5" />
                                Baixar GeoTIFF
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        ) : activeTab === 'analysis' ? (
          <AnalysisTab 
            supabase={supabase} 
            selectedBaciaMetadata={selectedCustomBacia}
            selectedBaciaGeojson={basinGeojson}
            ivpcResultData={ivpcResultData}
          />
        ) : null}
      </div>
    </div>
  );
}

// Helper component to update map center when coordinates change
function MapUpdater({ lat, lng, geojson }: { lat: number, lng: number, geojson: any }) {
  const map = useMap();
  useEffect(() => {
    if (geojson) {
      const layer = L.geoJSON(geojson);
      map.fitBounds(layer.getBounds());
    } else {
      map.setView([lat, lng], map.getZoom());
    }
  }, [lat, lng, geojson, map]);
  return null;
}
