//process.env.GOOGLE_APPLICATION_CREDENTIALS =
 // "./credentials/gee-service-account.json";


import { config } from "dotenv";
config({ override: true });

import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import fs from "fs";
import ee from "@google/earthengine";
import { createClient } from '@supabase/supabase-js';
import axios from 'axios';
import * as turf from '@turf/turf';
import { XMLParser } from 'fast-xml-parser';
import { GoogleGenAI } from '@google/genai';
import {ensureEERuntime} from "./src/ee/runtime/eeRuntime";
//import "dotenv/config";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

app.use((err: any, req: any, res: any, next: any) => {
  if (err instanceof SyntaxError && 'body' in err) {
    return res.status(400).json({ error: "JSON inválido" });
  }
  if (err.type === 'entity.too.large') {
    return res.status(413).json({ error: "O tamanho da geometria da bacia excede o limite do servidor." });
  }
  next(err);
});

// Supabase Client Configuration
let supabase: any = null;

function getSupabase() {
  if (!supabase) {
    const supabaseUrl = process.env.SUPABASE_URL || 'https://pnedbwdgcwlicitmfymz.supabase.co';
    const supabaseKey = process.env.SUPABASE_ANON_KEY || 'sb_publishable_LsKJ_gxuDVpQbh-i5WndqQ_PPyh7cJm';
    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Supabase is not configured. Please set SUPABASE_URL and SUPABASE_ANON_KEY environment variables.");
    }
    supabase = createClient(supabaseUrl, supabaseKey);
  }
  return supabase;
}

// Create data directory
const dataDir = path.join(process.cwd(), "dados");
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// API Routes
let isGeeAuthenticated = false;

const authenticateWithGEE = (credentials: any): Promise<void> => {
  return new Promise((resolve, reject) => {
    ee.data.authenticateViaPrivateKey(
      credentials,
      () => {
        ee.initialize(
          null,
          null,
          () => {
            isGeeAuthenticated = true;
            console.log("GEE Authenticated Successfully");
            resolve();
          },
          (e: any) => reject(new Error("Initialization error: " + e))
        );
      },
      (e: any) => reject(new Error("Authentication error: " + e))
    );
  });
};

// Auto-auth on startup
// Tenta em ordem: gee-key.json na raiz, arquivo em GOOGLE_APPLICATION_CREDENTIALS, ou variáveis de ambiente
let credentialsPath = path.join(process.cwd(), "gee-key.json");

if (!fs.existsSync(credentialsPath) && process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS.startsWith('./') 
    ? path.join(process.cwd(), process.env.GOOGLE_APPLICATION_CREDENTIALS)
    : process.env.GOOGLE_APPLICATION_CREDENTIALS;
}

if (fs.existsSync(credentialsPath)) {
  try {
    const keyObj = JSON.parse(fs.readFileSync(credentialsPath, "utf-8"));
    authenticateWithGEE(keyObj).catch((e) => {
      console.error(`Authentication with ${credentialsPath} failed:`, e);
    });
  } catch (e) {
    console.error(`Failed to parse credentials from ${credentialsPath}:`, e);
  }
} else if (process.env.GEE_SERVICE_ACCOUNT_JSON) {
  try {
    const credentials = JSON.parse(process.env.GEE_SERVICE_ACCOUNT_JSON);
    authenticateWithGEE(credentials).catch(console.error);
  } catch (e) {
    console.error("Failed to parse GEE_SERVICE_ACCOUNT_JSON environment variable:", e);
  }
} else if (process.env.GEE_PRIVATE_KEY && process.env.GEE_CLIENT_EMAIL) {
  const credentials = {
    private_key: String(process.env.GEE_PRIVATE_KEY).replace(/\\n/g, '\n'),
    client_email: process.env.GEE_CLIENT_EMAIL,
    project_id: process.env.GEE_PROJECT_ID || ""
  };
  authenticateWithGEE(credentials).catch(console.error);
} else {
  console.warn("⚠️ GEE credentials not found. Please configure GOOGLE_APPLICATION_CREDENTIALS, GEE_SERVICE_ACCOUNT_JSON, or GEE_PRIVATE_KEY + GEE_CLIENT_EMAIL");
}

app.get("/api/gee/status", (req, res) => {
  res.json({ authenticated: isGeeAuthenticated });
});

app.post("/api/gee/key", async (req, res) => {
  try {
    const keyData = req.body;
    if (!keyData || !keyData.private_key) {
      return res.status(400).json({ error: "Formato de chave inválido." });
    }
    
    await authenticateWithGEE(keyData);
    
    const keyPath = path.join(process.cwd(), "gee-key.json");
    fs.writeFileSync(keyPath, JSON.stringify(keyData, null, 2));
    res.json({ success: true, message: "Chave salva e autenticada com sucesso." });
  } catch (err: any) {
    res.status(500).json({ error: "Erro ao salvar a chave: " + err.message });
  }
});

app.post("/api/gee/auth", async (req, res) => {
  if (isGeeAuthenticated) {
    return res.json({ success: true, message: "Already authenticated" });
  }

  try {
    const keyPath = path.join(process.cwd(), "gee-key.json");
    if (!fs.existsSync(keyPath)) {
      return res.status(400).json({ error: "Chave GEE não encontrada no servidor." });
    }

    const keyObj = JSON.parse(fs.readFileSync(keyPath, "utf-8"));
    await authenticateWithGEE(keyObj);
    res.json({ success: true, message: "Authenticated successfully" });
  } catch (err: any) {
    res.status(500).json({ error: "Internal error: " + err.message });
  }
});

app.post("/api/extract", async (req, res) => {
  if (!isGeeAuthenticated) {
    return res.status(401).json({ error: "Google Earth Engine não está autenticado. Verifique as credenciais no servidor." });
  }

  const { lat, lng, basinName, level, geoJsonBacia } = req.body;

  if (!basinName) {
    return res.status(400).json({ error: "Missing parameters" });
  }

  const hydroLevel = level || 8;

  try {
    let bacia_geom;
    if (geoJsonBacia) {
      if (geoJsonBacia.type === 'FeatureCollection' && geoJsonBacia.features.length > 0) {
        bacia_geom = ee.Geometry(geoJsonBacia.features[0].geometry || geoJsonBacia.features[0]);
      } else if (geoJsonBacia.geometry) {
        bacia_geom = ee.Geometry(geoJsonBacia.geometry);
      } else {
        bacia_geom = ee.Geometry(geoJsonBacia);
      }
    } else {
      if (!lat || !lng) return res.status(400).json({ error: "Missing lat/lng" });
      const ponto_referencia = ee.Geometry.Point([parseFloat(lng), parseFloat(lat)]);
      const bacias = ee.FeatureCollection(`WWF/HydroSHEDS/v1/Basins/hybas_${hydroLevel}`);
      const bacia_feature = bacias.filterBounds(ponto_referencia).first();
      bacia_geom = bacia_feature.geometry();
    }

    // Extrair metadados físicos
    const area_bacia_ee = bacia_geom.area().divide(1e6);
    
    // Evaluate geometry and area
    bacia_geom.evaluate(async (geomGeojson: any, errorGeom: any) => {
      if (errorGeom) return res.status(500).json({ error: errorGeom });

      area_bacia_ee.evaluate(async (area_km2: number, errorArea: any) => {
        if (errorArea) return res.status(500).json({ error: errorArea });

        // Calculate dynamic scale to avoid GEE payload limits for huge basins
        // Max payload size is 48MB. We target around 2 million pixels to be safe
        // considering the bounding box can be larger than the polygon area.
        let calcScale = Math.sqrt((area_km2 * 1000000) / 2000000);
        calcScale = Math.max(30, Math.ceil(calcScale)); // Minimum 30m resolution

        const geom_geojson_str = JSON.stringify(geomGeojson);
        const data_extracao = new Date().toISOString().replace("T", " ").substring(0, 19);

        // Registrar bacia no Banco de Dados (Supabase)
        const { data: baciaData, error: baciaError } = await getSupabase()
          .from('bacias')
          .insert([{
            nome: basinName,
            geometria: geomGeojson,
            area_km2: area_km2
          }])
          .select()
          .single();

        if (baciaError) {
          console.error("Erro ao inserir bacia no Supabase:", baciaError);
          return res.status(500).json({ error: "Erro ao salvar bacia no banco de dados." });
        }

        const bacia_id = baciaData.id;

        // 4. Extração do MDT (Modelo Digital de Terreno) - SRTM 30m
        const mdt = ee.Image("USGS/SRTMGL1_003").clip(bacia_geom);
        const mdt_path = `dados/mdt_${bacia_id}.tif`;

        // 5. Extração de Dados Históricos de Inundação
        const historico_inundacao = ee.Image("JRC/GSW1_4/GlobalSurfaceWater").select("occurrence").clip(bacia_geom);
        const inundacao_path = `dados/inundacao_${bacia_id}.tif`;

        // 6. Rede Hidrográfica (MERIT Hydro - Upstream Drainage Area > 10 km2)
        const riosImg = ee.Image("MERIT/Hydro/v1_0_1").select('upa').clip(bacia_geom).gt(10);
        const riosMasked = riosImg.updateMask(riosImg);
        const riosVis = { palette: ['0000ff'] };

        // Gerar Map IDs para visualização no frontend
        const mdtVis = { min: 0, max: 2000, palette: ['006600', '002200', 'fff700', 'ab7634', 'c4d0ff', 'ffffff'] };
        const inundacaoMasked = historico_inundacao.updateMask(historico_inundacao.gt(0));
        const inundacaoVis = { min: 0, max: 100, palette: ['lightblue', 'blue', 'darkblue'] };

        mdt.getMap(mdtVis, (mapIdMdt: any, errMapMdt: any) => {
          const mdtTileUrl = mapIdMdt ? mapIdMdt.urlFormat : null;

          riosMasked.getMap(riosVis, (mapIdRios: any, errMapRios: any) => {
            const riosTileUrl = mapIdRios ? mapIdRios.urlFormat : null;

            inundacaoMasked.getMap(inundacaoVis, (mapIdInundacao: any, errMapInundacao: any) => {
              const inundacaoTileUrl = mapIdInundacao ? mapIdInundacao.urlFormat : null;

              // We will just save the metadata to DB. Downloading large TIFFs via Node.js requires getDownloadURL and fetching.
            // For demonstration, we will get the download URL and save the metadata.
            
            mdt.getDownloadURL({
              scale: calcScale,
              region: bacia_geom,
              format: "GEO_TIFF"
            }, async (mdtUrl: string, errMdt: any) => {
              if (errMdt) {
                console.error("Error getting MDT URL:", errMdt);
              }
              if (!errMdt) {
                await getSupabase().from('rasters').insert([{
                  bacia_id: bacia_id,
                  tipo_dado: "MDT",
                  fonte: "USGS/SRTMGL1_003",
                  caminho_url: mdt_path + " (URL: " + mdtUrl.split('?')[0].substring(0, 60) + "...)",
                  resolucao: calcScale
                }]);
              }

              historico_inundacao.getDownloadURL({
                scale: calcScale,
                region: bacia_geom,
                format: "GEO_TIFF"
              }, async (inundacaoUrl: string, errInundacao: any) => {
                if (!errInundacao) {
                  await getSupabase().from('rasters').insert([{
                    bacia_id: bacia_id,
                    tipo_dado: "Inundacao_Historica",
                    fonte: "JRC/GSW1_4/GlobalSurfaceWater",
                    caminho_url: inundacao_path + " (URL: " + inundacaoUrl.split('?')[0].substring(0, 60) + "...)",
                    resolucao: calcScale
                  }]);
                }

                riosImg.getDownloadURL({
                  scale: calcScale,
                  region: bacia_geom,
                  format: "GEO_TIFF"
                }, async (riosUrl: string, errRios: any) => {
                  if (!errRios) {
                    await getSupabase().from('rasters').insert([{
                      bacia_id: bacia_id,
                      tipo_dado: "Rede_Hidrografica",
                      fonte: "MERIT/Hydro/v1_0_1",
                      caminho_url: `dados/rios_${bacia_id}.tif` + " (URL: " + riosUrl.split('?')[0].substring(0, 60) + "...)",
                      resolucao: calcScale
                    }]);
                  }

                  // === BUSCA E RECORTE DE MUNICIPIOS E RISCOS ===
                  let urbanizacaoGeojson = null;
                  let riscoGeojson = null;
                  try {
                    let basinPoly: any = geomGeojson.type === 'FeatureCollection'
                      ? geomGeojson.features[0]
                      : (geomGeojson.type === 'Feature' ? geomGeojson : turf.feature(geomGeojson));
                    if (!basinPoly.geometry) {
                      if (basinPoly.type === 'MultiPolygon' || (basinPoly.coordinates && Array.isArray(basinPoly.coordinates[0]) && Array.isArray(basinPoly.coordinates[0][0]) && Array.isArray(basinPoly.coordinates[0][0][0]))) {
                        basinPoly = turf.multiPolygon(basinPoly.coordinates || basinPoly);
                      } else {
                        basinPoly = turf.polygon(basinPoly.coordinates || basinPoly);
                      }
                    }
                    
                    const promises = [];
                    for (let i = 0; i < 6; i++) {
                      promises.push(getSupabase().from('municipios_dados')
                        .select('code_muni, name_muni, abbrev_state, geojson_urbanizacao, geojson_risco')
                        .range(i * 1000, i * 1000 + 999));
                    }
                    const results = await Promise.all(promises);
                    const munData = results.flatMap(r => r.data || []);
                    
                    const basinBbox = turf.bbox(basinPoly);
                    const urbFeatures: any[] = [];
                    const riskFeatures: any[] = [];
                    
                    for (const row of munData) {
                      if (row.geojson_urbanizacao && row.geojson_urbanizacao.features) {
                        try {
                          const urbBbox = turf.bbox(row.geojson_urbanizacao);
                          if (urbBbox[0] <= basinBbox[2] && urbBbox[2] >= basinBbox[0] &&
                              urbBbox[1] <= basinBbox[3] && urbBbox[3] >= basinBbox[1]) {
                            for (const feat of row.geojson_urbanizacao.features) {
                              try {
                                const clipped = turf.intersect(turf.featureCollection([basinPoly, feat]));
                                if (clipped) {
                                  clipped.properties = { ...feat.properties, municipio: row.name_muni, uf: row.abbrev_state, code: row.code_muni, tipo: 'urbanizacao' };
                                  urbFeatures.push(clipped);
                                }
                              } catch(e) {}
                            }
                          }
                        } catch(e) {}
                      }
                      
                      if (row.geojson_risco && row.geojson_risco.features) {
                        try {
                          const riskBbox = turf.bbox(row.geojson_risco);
                          if (riskBbox[0] <= basinBbox[2] && riskBbox[2] >= basinBbox[0] &&
                              riskBbox[1] <= basinBbox[3] && riskBbox[3] >= basinBbox[1]) {
                            for (const feat of row.geojson_risco.features) {
                              try {
                                const clipped = turf.intersect(turf.featureCollection([basinPoly, feat]));
                                if (clipped) {
                                  clipped.properties = { ...feat.properties, municipio: row.name_muni, uf: row.abbrev_state, code: row.code_muni, tipo: 'risco' };
                                  riskFeatures.push(clipped);
                                }
                              } catch(e) {} // ignore invalid geoms
                            }
                          }
                        } catch(e) {} // ignore invalid geoms
                      }
                    }
                    if (urbFeatures.length > 0) urbanizacaoGeojson = turf.featureCollection(urbFeatures);
                    if (riskFeatures.length > 0) riscoGeojson = turf.featureCollection(riskFeatures);
                  } catch (e) {
                    console.error("Erro no processamento territorial de municipios:", e);
                  }

                  res.json({
                    success: true,
                    bacia_id,
                    area_km2,
                    geomGeojson,
                    mdtTileUrl,
                    riosTileUrl,
                    inundacaoTileUrl,
                    urbanizacaoGeojson,
                    riscoGeojson,
                    message: `Sucesso! Bacia mapeada (${area_km2.toFixed(2)} km²). ${urbanizacaoGeojson ? 'Área urbana e risco detectada.' : 'Sem áreas urbanas registradas na bacia.'}`
                  });
                });
              });
            });
            });
          });
        });
      });
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/catalog/bacias", async (req, res) => {
  try {
    const { data, error } = await getSupabase().from('bacias').select('*');
    if (error) throw error;
    
    // Defina o tipo para os itens de 'data'
    type Bacia = {
      id: number;
      nome: string;
      geometria: object;
      area_km2: number;
      data_extracao: string;
    };

    // Mapear para o formato esperado pelo frontend (se necessário)
    const formattedData = data.map((b: Bacia) => ({
      id: b.id,
      nome_bacia: b.nome,
      geometria_geojson: JSON.stringify(b.geometria),
      area_km2: b.area_km2,
      data_extracao: b.data_extracao
    }));
    
    res.json(formattedData);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/catalog/rasters", async (req, res) => {
  try {
    const { data, error } = await getSupabase().from('rasters').select('*');
    if (error) throw error;
    
    // Defina o tipo para os itens de 'data'
    type Raster = {
      id: number;
      bacia_id: number;
      tipo_dado: string;
      fonte: string;
      caminho_url: string;
      resolucao: number;
    };

    // Mapear para o formato esperado pelo frontend
    const formattedData = data.map((r: Raster) => ({
      id: r.id,
      bacia_id: r.bacia_id,
      tipo_dado: r.tipo_dado,
      fonte: r.fonte,
      caminho_arquivo: r.caminho_url,
      resolucao_m: r.resolucao
    }));
    
    res.json(formattedData);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.delete("/api/catalog/clear", async (req, res) => {
  try {
    // Deleta todas as bacias. O ON DELETE CASCADE no banco apagará os rasters.
    const { error } = await getSupabase()
      .from('bacias')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Deleta tudo
      
    if (error) throw error;
    
    const dataDir = path.join(process.cwd(), "dados");
    if (fs.existsSync(dataDir)) {
      fs.readdirSync(dataDir).forEach(file => {
        fs.unlinkSync(path.join(dataDir, file));
      });
    }
    
    res.json({ success: true, message: "Dados limpos com sucesso." });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/timeseries', async (req, res) => {
  if (!isGeeAuthenticated) {
    return res.status(401).json({ error: "Google Earth Engine não está autenticado. Verifique as credenciais no servidor." });
  }

  const { geoJson, startDate, endDate } = req.body;

  if (!geoJson || !startDate || !endDate) {
    return res.status(400).json({ error: 'Parâmetros ausentes (geoJson, startDate, endDate)' });
  }

  try {
    // 1. Converte o GeoJSON do frontend para ee.Geometry
    const feature = ee.Feature(geoJson.features ? geoJson.features[0] : geoJson);
    const geometry = feature.geometry();

    // 2. Extração de Precipitação Mensal (TerraClimate)
    const precipCollection = ee.ImageCollection('IDAHO_EPSCOR/TERRACLIMATE')
      .filterBounds(geometry)
      .filterDate(startDate, endDate)
      .select('pr'); // pr = Precipitation (mm)

    const precipData = precipCollection.map(function(image: any) {
      const date = image.date().format('YYYY-MM');
      const mean = image.reduceRegion({
        reducer: ee.Reducer.mean(),
        geometry: geometry,
        scale: 4000, // Escala nativa do TerraClimate (~4km)
        maxPixels: 1e10
      });
      return ee.Feature(null, { date: date, precip_mm: mean.get('pr') });
    });

    // 3. Extração de Área Inundada Mensal (NDWI via Landsat 8)
    const l8Collection = ee.ImageCollection('LANDSAT/LC08/C02/T1_L2')
      .filterBounds(geometry)
      .filterDate(startDate, endDate);

    const maskClouds = function(image: any) {
      const qa = image.select('QA_PIXEL');
      const cloudBitMask = 1 << 3;
      const cirrusBitMask = 1 << 4;
      const mask = qa.bitwiseAnd(cloudBitMask).eq(0)
        .and(qa.bitwiseAnd(cirrusBitMask).eq(0));
      return image.updateMask(mask);
    };

    const start = ee.Date(startDate);
    const end = ee.Date(endDate);
    const numMonths = end.difference(start, 'month').round();
    const months = ee.List.sequence(0, numMonths.subtract(1));

    const waterData = ee.FeatureCollection(months.map(function(n: any) {
      const mStart = start.advance(n, 'month');
      const mEnd = mStart.advance(1, 'month');
      const dateStr = mStart.format('YYYY-MM');

      const col = l8Collection.filterDate(mStart, mEnd);
      
      const dummyImage = ee.Image.constant([0, 0, 0]).rename(['SR_B3', 'SR_B5', 'QA_PIXEL']).updateMask(0);
      const safeCol = ee.ImageCollection(ee.Algorithms.If(col.size().gt(0), col, ee.ImageCollection([dummyImage])));
      
      const area = safeCol.map(maskClouds).median().clip(geometry)
        .normalizedDifference(['SR_B3', 'SR_B5']).rename('ndwi')
        .gt(0)
        .multiply(ee.Image.pixelArea())
        .reduceRegion({
          reducer: ee.Reducer.sum(),
          geometry: geometry,
          scale: 500, // Reduced scale to avoid timeout
          maxPixels: 1e13
        }).get('ndwi');

      return ee.Feature(null, { date: dateStr, water_area_km2: area });
    }));

    // 4. Executa no GEE e traz para o Node.js
    // Usamos Promessas para avaliar paralelamente e ganhar tempo
    console.log(`Iniciando extração GEE para datas ${startDate} a ${endDate}...`);
    const [precipList, waterList] = await Promise.all([
      new Promise<any>((resolve, reject) => precipData.evaluate((data: any, err: any) => err ? reject(err) : resolve(data))),
      new Promise<any>((resolve, reject) => waterData.evaluate((data: any, err: any) => err ? reject(err) : resolve(data)))
    ]);
    console.log(`Extração concluída. Precipitação: ${precipList?.features?.length || 0} meses. Água: ${waterList?.features?.length || 0} meses.`);

    // 5. Mescla os dados pelo Mês/Ano para o Frontend
    const chartData: Record<string, any> = {};

    // Adiciona Precipitação
    if (precipList && precipList.features) {
      precipList.features.forEach((f: any) => {
        chartData[f.properties.date] = { 
          date: f.properties.date, 
          precip_mm: f.properties.precip_mm || 0 
        };
      });
    }

    // Adiciona Área de Água
    if (waterList && waterList.features) {
      waterList.features.forEach((f: any) => {
        let area = f.properties.water_area_km2;
        if (area === null || area === undefined) area = 0;
        else area = area / 1e6;

        if (chartData[f.properties.date]) {
          chartData[f.properties.date].water_area_km2 = area;
        } else {
          chartData[f.properties.date] = {
            date: f.properties.date,
            precip_mm: 0,
            water_area_km2: area
          };
        }
      });
    }

    // Converte o dicionário mesclado em um Array ordenado
    const finalResult = Object.values(chartData).sort((a: any, b: any) => a.date.localeCompare(b.date));

    res.json(finalResult);

  } catch (error: any) {
    console.error('Erro na extração de série temporal:', error);
    res.status(500).json({ error: 'Erro ao processar dados no Google Earth Engine', details: error.message });
  }
});

// Nova Rota para gerar a Camada Visual (O Mapa Interativo)
app.post('/api/ndwi-layer', async (req, res) => {
  if (!isGeeAuthenticated) {
    return res.status(401).json({ error: "Google Earth Engine não está autenticado. Verifique as credenciais no servidor." });
  }

  const { geoJson, targetMonth } = req.body;

  try {
    let geometry;
    if (geoJson.features && geoJson.features.length > 0) {
      geometry = ee.Feature(geoJson.features[0]).geometry();
    } else {
      geometry = ee.Geometry(geoJson);
    }
    
    // Define o início e o fim do mês selecionado pelo usuário
    const startDate = ee.Date(targetMonth + '-01');
    const endDate = startDate.advance(1, 'month');

    // Usa a coleção Landsat 8 (muito robusta para histórico longo)
    const collection = ee.ImageCollection('LANDSAT/LC08/C02/T1_L2')
      .filterBounds(geometry)
      .filterDate(startDate, endDate);

    const dummyImage = ee.Image.constant([0, 0, 0]).rename(['SR_B3', 'SR_B5', 'QA_PIXEL']).updateMask(0);
    const safeCol = ee.ImageCollection(ee.Algorithms.If(collection.size().gt(0), collection, ee.ImageCollection([dummyImage])));

    // Função de máscara de nuvens Landsat 8
    const maskClouds = function(image: any) {
      const qa = image.select('QA_PIXEL');
      const cloudBitMask = 1 << 3;
      const cirrusBitMask = 1 << 4;
      const mask = qa.bitwiseAnd(cloudBitMask).eq(0)
        .and(qa.bitwiseAnd(cirrusBitMask).eq(0));
      return image.updateMask(mask);
    };

    // Aplica máscara, calcula mediana do mês e corta para a bacia
    const monthlyImage = safeCol.map(maskClouds).median().clip(geometry);

    // Calcula o NDWI: (Green - NIR) / (Green + NIR) -> (B3 - B5) no Landsat 8
    const ndwi = monthlyImage.normalizedDifference(['SR_B3', 'SR_B5']).rename('NDWI');

    // Isola apenas a água (NDWI > 0)
    const waterMask = ndwi.gt(0).selfMask(); 

    // Prepara a visualização (Azul escuro, semi-transparente)
    const visParams = { min: 0, max: 1, palette: ['0000FF'] };

    // Pede ao GEE a URL dos Tiles
    waterMask.getMap(visParams, (mapObj: any, err: any) => {
      if (err) return res.status(500).json({ error: err });
      res.json({ urlFormat: mapObj.urlFormat }); // Retorna a URL dinâmica para o Frontend!
    });

  } catch (error: any) {
    res.status(500).json({ error: 'Erro ao gerar mapa NDWI: ' + error.message });
  }
});

// Rota para download do banco de dados das bacias
app.get("/api/export/db", async (req, res) => {
  try {
    const { data: bacias, error: baciasError } = await getSupabase().from('bacias').select('*');
    const { data: rasters, error: rastersError } = await getSupabase().from('rasters').select('*');

    if (baciasError || rastersError) {
      throw new Error("Erro ao buscar dados do Supabase");
    }

    const exportData = {
      bacia_metadata: bacias,
      raster_data: rasters
    };

    let filename = "bacias_extraidas.json";
    if (bacias && bacias.length > 0) {
      const sanitizedName = bacias[0].nome.replace(/[^a-zA-Z0-9_\-]/g, '_');
      if (bacias.length === 1) {
        filename = `bacia_${sanitizedName}.json`;
      } else {
        filename = `bacias_${sanitizedName}_e_outros.json`;
      }
    }

    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.setHeader("Content-Type", "application/json");
    res.send(JSON.stringify(exportData, null, 2));
  } catch (error: any) {
    res.status(500).json({ error: "Erro ao exportar banco de dados: " + error.message });
  }
});

// Rota para exportar CSV da série temporal
app.post("/api/export/csv", (req, res) => {
  try {
    const { data } = req.body;
    if (!data || !Array.isArray(data) || data.length === 0) {
      return res.status(400).json({ error: "Dados inválidos para exportação CSV." });
    }

    // Extrair cabeçalhos dinamicamente das chaves do primeiro objeto
    const headers = Object.keys(data[0]);
    const csvRows = [];
    
    // Adicionar cabeçalho
    csvRows.push(headers.join(","));
    
    // Adicionar linhas
    for (const row of data) {
      const values = headers.map(header => {
        const val = row[header];
        // Escapar aspas e tratar strings com vírgulas
        if (typeof val === 'string') {
          return `"${val.replace(/"/g, '""')}"`;
        }
        return val;
      });
      csvRows.push(values.join(","));
    }
    
    const csvString = csvRows.join("\n");
    
    res.setHeader("Content-Disposition", 'attachment; filename="serie_historica.csv"');
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.send(csvString);
  } catch (error: any) {
    res.status(500).json({ error: "Erro ao exportar CSV: " + error.message });
  }
});

// Rota para exportar rasters físicos
app.get("/api/export/raster/:id", async (req, res) => {
  if (!isGeeAuthenticated) {
    return res.status(401).json({ error: "Google Earth Engine não está autenticado." });
  }

  try {
    const rasterId = req.params.id;
    
    const { data: raster, error: rasterError } = await getSupabase()
      .from('rasters')
      .select('*')
      .eq('id', rasterId)
      .single();
      
    if (rasterError || !raster) {
      return res.status(404).json({ error: "Raster não encontrado no banco de dados." });
    }

    const { data: bacia, error: baciaError } = await getSupabase()
      .from('bacias')
      .select('*')
      .eq('id', raster.bacia_id)
      .single();
      
    if (baciaError || !bacia) {
      return res.status(404).json({ error: "Bacia não encontrada." });
    }

    const bacia_geom = ee.Geometry(bacia.geometria);
    let imageToExport;

    if (raster.tipo_dado === "MDT") {
      imageToExport = ee.Image("USGS/SRTMGL1_003").clip(bacia_geom);
    } else if (raster.tipo_dado === "Inundacao_Historica") {
      imageToExport = ee.Image("JRC/GSW1_4/GlobalSurfaceWater").select("occurrence").clip(bacia_geom);
    } else if (raster.tipo_dado === "Rede_Hidrografica") {
      const riosImg = ee.Image("MERIT/Hydro/v1_0_1").select('upa').clip(bacia_geom).gt(10);
      imageToExport = riosImg.updateMask(riosImg);
    } else {
      return res.status(400).json({ error: "Tipo de raster não suportado." });
    }

    imageToExport.getDownloadURL({
      scale: raster.resolucao || 30,
      crs: 'EPSG:4326',
      region: bacia_geom
    }, (url: string, error: any) => {
      if (error) {
        return res.status(500).json({ error: "Erro ao gerar URL de download no GEE: " + error });
      }
      res.redirect(url);
    });
  } catch (error: any) {
    res.status(500).json({ error: "Erro interno: " + error.message });
  }
});

// Rota para gerar link de download do GEE (Alternativa Escalável)
app.post("/api/export/gee-raster", async (req, res) => {
  if (!isGeeAuthenticated) {
    return res.status(401).json({ error: "Google Earth Engine não está autenticado." });
  }

  try {
    const { geoJson, targetMonth, type } = req.body;

    if (!geoJson || !targetMonth) {
      return res.status(400).json({ error: "Parâmetros ausentes." });
    }

    let geometry;
    if (geoJson.features && geoJson.features.length > 0) {
      geometry = ee.Feature(geoJson.features[0]).geometry();
    } else {
      geometry = ee.Geometry(geoJson);
    }
    const [year, month] = targetMonth.split('-');
    const startDate = ee.Date.fromYMD(Number(year), Number(month), 1);
    const endDate = startDate.advance(1, 'month');

    let imageToExport;

    if (type === 'ndwi') {
      const collection = ee.ImageCollection("COPERNICUS/S2_SR_HARMONIZED")
        .filterBounds(geometry)
        .filterDate(startDate, endDate)
        .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 20));

      const image = collection.median().clip(geometry);
      const ndwi = image.normalizedDifference(['B3', 'B8']).rename('NDWI');
      imageToExport = ndwi;
    } else {
      return res.status(400).json({ error: "Tipo de raster não suportado para exportação direta do GEE ainda." });
    }

    imageToExport.getDownloadURL({
      scale: 30,
      crs: 'EPSG:4326',
      region: geometry
    }, (url: string, error: any) => {
      if (error) {
        return res.status(500).json({ error: "Erro ao gerar URL de download no GEE: " + error });
      }
      res.json({ downloadUrl: url });
    });
  } catch (error: any) {
    res.status(500).json({ error: "Erro interno: " + error.message });
  }
});

// Rota para buscar estações de monitoramento (ANA e INMET) dentro de uma bacia
app.post("/api/estacoes", async (req, res) => {
  try {
    const { geometria } = req.body;
    if (!geometria) {
      return res.status(400).json({ error: "Geometria da bacia não fornecida." });
    }

    const estacoes: any[] = [];

    // 1. Fetch INMET (Estações Automáticas)
    try {
      const inmetRes = await axios.get("https://apitempo.inmet.gov.br/estacoes/T");
      const inmetData = inmetRes.data;
      if (Array.isArray(inmetData)) {
        inmetData.forEach((est: any) => {
          if (est.VL_LATITUDE && est.VL_LONGITUDE) {
            estacoes.push(turf.point([parseFloat(est.VL_LONGITUDE), parseFloat(est.VL_LATITUDE)], {
              origem: "INMET",
              nome: est.DC_NOME,
              codigo: est.CD_ESTACAO,
              tipo: "Meteorológica"
            }));
          }
        });
      }
    } catch (e: any) {
      console.error("Erro ao buscar estações do INMET:", e.message);
    }

    // 2. Fetch ANA (Estações Telemétricas)
    try {
      const anaRes = await axios.get("http://telemetriaws1.ana.gov.br/ServiceANA.asmx/ListaEstacoesTelemetricas?statusEquipamento=1", {
        timeout: 10000 // 10 seconds timeout for unstable API
      });
      const parser = new XMLParser();
      const anaData = parser.parse(anaRes.data);
      const estacoesAna = anaData?.DataTable?.diffgram?.DocumentElement?.Estacoes || [];
      const estacoesArray = Array.isArray(estacoesAna) ? estacoesAna : [estacoesAna];

      estacoesArray.forEach((est: any) => {
        if (est.Latitude && est.Longitude) {
          estacoes.push(turf.point([parseFloat(est.Longitude), parseFloat(est.Latitude)], {
            origem: "ANA",
            nome: est.Nome,
            codigo: est.Codigo,
            tipo: est.TipoEstacao === 1 ? "Fluviométrica" : "Pluviométrica"
          }));
        }
      });
    } catch (e: any) {
      if (e.response && (e.response.status >= 500 && e.response.status <= 504)) {
        // Ignora silenciosamente erros 5xx, pois a API da ANA é instável
        console.warn(`Aviso: API da ANA retornou HTTP ${e.response.status}. Ignorando estações da ANA.`);
      } else if (e.code === 'ECONNABORTED' || (e.message && e.message.includes('timeout'))) {
        console.warn(`Aviso: Timeout ao buscar estações da ANA. Ignorando estações da ANA.`);
      } else {
        console.error("Erro ao buscar estações da ANA:", e.message);
      }
    }

    // 3. Filtragem Espacial com Turf.js
    const points = turf.featureCollection(estacoes);
    const searchPolygon = geometria.type === "Feature" ? geometria : turf.feature(geometria);
    
    // Filtra os pontos que estão dentro do polígono da bacia
    const filtered = turf.pointsWithinPolygon(points as any, searchPolygon as any);

    // Formata a resposta para o frontend
    const resultado = filtered.features.map(f => ({
      ...f.properties,
      latitude: f.geometry.coordinates[1],
      longitude: f.geometry.coordinates[0]
    }));

    res.json(resultado);

  } catch (error: any) {
    console.error("Erro na rota /api/estacoes:", error);
    res.status(500).json({ error: "Erro interno ao processar estações." });
  }
});

// Rota para buscar dados de telemetria em tempo real de uma estação específica
app.get("/api/telemetria/:orgao/:codigo", async (req, res) => {
  const { orgao, codigo } = req.params;
  
  try {
    if (orgao === 'INMET') {
      const today = new Date().toISOString().split('T')[0];
      const url = `https://apitempo.inmet.gov.br/estacao/dados/${today}/${today}/${codigo}`;
      
      const response = await axios.get(url);
      const data = response.data;
      
      if (!data || !Array.isArray(data) || data.length === 0 || data[0].DC_NOME === null) {
        return res.json({ status: 'offline', mensagem: 'Sem transmissão nas últimas 24h' });
      }

      // Encontra o último registro válido (do mais recente para o mais antigo)
      const lastRecord = [...data].reverse().find((d: any) => d.TEM_INS !== null || d.CHUVA !== null);
      
      if (!lastRecord) {
        return res.json({ status: 'offline', mensagem: 'Sem transmissão nas últimas 24h' });
      }
      
      return res.json({
        codigo,
        orgao,
        data_leitura: `${lastRecord.DT_MEDICAO} às ${lastRecord.HR_MEDICAO.substring(0,2)}:${lastRecord.HR_MEDICAO.substring(2,4)}`,
        nivel_cm: null,
        vazao_m3s: null,
        chuva_mm: lastRecord.CHUVA ? parseFloat(lastRecord.CHUVA) : null,
        temperatura_c: lastRecord.TEM_INS ? parseFloat(lastRecord.TEM_INS) : null,
        status: 'online'
      });

    } else if (orgao === 'ANA') {
      const codigoFormatado = codigo.toString().padStart(8, '0');
      const url = `http://telemetriaws1.ana.gov.br/ServiceANA.asmx/DadosTempoReal?codEstacao=${codigoFormatado}`;
      const response = await axios.get(url);
      
      const parser = new XMLParser();
      const parsed = parser.parse(response.data);
      
      // Correção do caminho do XML gerado pelo webservice da ANA
      const dadosAna = parsed?.DataTable?.['diffgr:diffgram']?.DocumentElement?.DadosTempoReal;

      if (!dadosAna) {
        return res.json({ status: 'offline', mensagem: 'Sem transmissão nas últimas 24h' });
      }

      const records = Array.isArray(dadosAna) ? dadosAna : [dadosAna];
      if (records.length === 0) {
        return res.json({ status: 'offline', mensagem: 'Sem transmissão nas últimas 24h' });
      }

      // A ANA geralmente retorna o mais recente primeiro ou precisamos pegar o primeiro válido
      const lastRecord = records[0]; 

      // Formatação de data da ANA (vem como YYYY-MM-DDTHH:mm:ss)
      let dataFormatada = lastRecord.Horario;
      if (dataFormatada && dataFormatada.includes('T')) {
        const [data, hora] = dataFormatada.split('T');
        const [ano, mes, dia] = data.split('-');
        dataFormatada = `${dia}/${mes}/${ano} às ${hora.substring(0,5)}`;
      }

      return res.json({
        codigo,
        orgao,
        data_leitura: dataFormatada,
        nivel_cm: lastRecord.Nivel ? parseFloat(lastRecord.Nivel) : null,
        vazao_m3s: lastRecord.Vazao ? parseFloat(lastRecord.Vazao) : null,
        chuva_mm: lastRecord.Chuva ? parseFloat(lastRecord.Chuva) : null,
        temperatura_c: null,
        status: 'online'
      });

    } else {
      return res.status(400).json({ error: 'Órgão inválido' });
    }
  } catch (error: any) {
    // Não logar erro 404 para INMET, pois é esperado quando não há dados no dia
    if (orgao === 'INMET' && error.response && error.response.status === 404) {
      // Silencioso
    } else {
      console.error(`Erro ao buscar telemetria para ${orgao} ${codigo}:`, error.message);
    }
    return res.json({ status: 'offline', mensagem: 'Sem transmissão nas últimas 24h' });
  }
});

// --- Rota para gerar Camada Visual de Asset do GEE ---
app.post("/api/analise/asset-layer", async (req, res) => {
  if (!isGeeAuthenticated) {
    return res.status(401).json({ error: "GEE não autenticado." });
  }

  const { assetId } = req.body;
  if (!assetId) {
    return res.status(400).json({ error: "Falta o assetId da imagem pré-processada" });
  }

  try {
    const image = ee.Image(assetId);
    
    const visParams = { 
      min: 10000, 
      max: 30000, 
      palette: ['#fee08b', '#fdae61', '#f46d43', '#d53e4f', '#9e0142', '#5e4fa2'] // Yellow to Dark Purple
    };

    image.getMap(visParams, (mapObj: any, err: any) => {
      if (err) return res.status(500).json({ error: "Erro ao gerar layer do asset: " + err });
      res.json({ urlFormat: mapObj.urlFormat });
    });
  } catch (err: any) {
    res.status(500).json({ error: "Exception GEE Asset: " + err.message });
  }
});

// --- Rota do GEE para Análise Espacial do IVPC ---
app.post("/api/analise/ivpc", async (req, res) => {
  if (!isGeeAuthenticated) {
    return res.status(401).json({ error: "GEE não autenticado." });
  }

  const { geoJson, estacoes } = req.body;
  if (!geoJson) {
    return res.status(400).json({ error: "Falta o geoJson da bacia" });
  }

  try {
    let parsedGeoJson = geoJson;
    let parseError = null;
    while (typeof parsedGeoJson === 'string') {
      try {
        parsedGeoJson = JSON.parse(parsedGeoJson);
      } catch (e: any) {
        parseError = e.message;
        break; // If it fails to parse, stop looping
      }
    }
    
    if (typeof parsedGeoJson === 'string') {
        throw new Error("Failed to parse geoJson string. JSON parse error: " + parseError + ". First 100 chars: " + parsedGeoJson.slice(0, 100) + ". Last 50 chars: " + parsedGeoJson.slice(-50));
    }
    console.log("typeof parsedGeoJson:", typeof parsedGeoJson);
    console.log("is array:", Array.isArray(parsedGeoJson));
    if (typeof parsedGeoJson === 'string') {
        console.log("StartsWith:", parsedGeoJson.slice(0, 10));
    }
    
    let geometry;
    let basinPoly: any;
    if (parsedGeoJson.features && parsedGeoJson.features.length > 0) {
      geometry = ee.Feature(parsedGeoJson.features[0]).geometry();
      const geomType = parsedGeoJson.features[0].geometry.type;
      if (geomType === 'MultiPolygon') {
        basinPoly = turf.multiPolygon(parsedGeoJson.features[0].geometry.coordinates);
      } else {
        basinPoly = turf.polygon(parsedGeoJson.features[0].geometry.coordinates);
      }
    } else {
      console.log("Creating EE geometry from object whose keys are:", Object.keys(parsedGeoJson));
      try {
        geometry = ee.Geometry(parsedGeoJson);
      } catch (geomErr: any) {
        console.error("EE Geometry failed!", geomErr.message);
        throw geomErr;
      }
      if (parsedGeoJson.type === 'MultiPolygon' || (parsedGeoJson.coordinates && Array.isArray(parsedGeoJson.coordinates[0]) && Array.isArray(parsedGeoJson.coordinates[0][0]) && Array.isArray(parsedGeoJson.coordinates[0][0][0]))) {
        basinPoly = turf.multiPolygon(parsedGeoJson.coordinates || parsedGeoJson);
      } else {
        basinPoly = turf.polygon(parsedGeoJson.coordinates || parsedGeoJson);
      }
    }

    // --- Remoção do gargalo de OOM e Timeout ---
    // A extração e o processamento local de > 5000 JSONs pesados do Supabase e a
    // intersecção via Turf causam falha e Timeout (504 Gateway Timeout) na Cloud.
    // Como solução rápida e nativa, usaremos o dataset WorldPop para a Densidade 
    // Populacional (DasyPop) e omitiremos a máscara de risco IBGE (usando o 
    // modo metodológico "sem_ibge"), baseando o Risco Físico no MDE + JRC Surface Water.
    
    // Pilar A: Máscara Física Consolidada
    const BASE_PROJ = ee.Projection('EPSG:4326').atScale(30);

    const mdt = ee.Image("USGS/SRTMGL1_003").clip(geometry);
    const slope = ee.Terrain.slope(mdt);
    const declividadeMask = slope.lt(5);
    const waterOcc = ee.Image("JRC/GSW1_4/GlobalSurfaceWater").select('occurrence').unmask(0).clip(geometry);
    const jrcMask = waterOcc.gt(0);
    
    let ibgeRiskMask = ee.Image.constant(0).clip(geometry);
    let modo_metodologico = "sem_ibge"; // Fallback por default

    // Bloco 1 - Elegibilidade Espacial
    // Risco físico = (Declividade baixa AND Histórico de água) OR Áreas de risco IBGE (vazio aqui)
    const physicalHazardMask = declividadeMask.and(jrcMask).or(ibgeRiskMask);

    let distanceImg;
    if (estacoes && estacoes.length > 0) {
      const stationFeatures = estacoes.map((e: any) => ee.Feature(ee.Geometry.Point([parseFloat(e.longitude), parseFloat(e.latitude)])));
      const fcEstacoes = ee.FeatureCollection(stationFeatures);
      distanceImg = fcEstacoes.distance(50000);
    } else {
      distanceImg = ee.Image.constant(50000).clip(geometry);
    }
    
    const blindSpotMask = distanceImg.gt(10000);
    const ivpcMask = physicalHazardMask.and(blindSpotMask);

    // Pilar B: Sensibilidade (Antiga Dasimetria Binária nativa do GEE)
    const worldCover = ee.ImageCollection("ESA/WorldCover/v200").first().select("Map");
    const builtUp = worldCover.eq(50).selfMask().clip(geometry);

    // Substitui a dasimetria JS pelo dataset WorldPop disponível na grade do GEE (População global estimativa)
    const worldPop = ee.ImageCollection("WorldPop/GP/100m/pop")
      .filter(ee.Filter.date('2020-01-01', '2021-01-01'))
      .sum()
      .clip(geometry)
      .unmask(0);
      
    const dasyPop = worldPop.updateMask(builtUp);

    // Bloco 2 - Exposição
    const distanceNormalized = distanceImg.unitScale(10000, 30000).clamp(0, 1);
    const exposureScore = distanceNormalized.updateMask(ivpcMask);
    
    // Scale adaptativo baseado na extensão para evitar Timeouts no GEE (ex: Bacia do Paraná)
    const bounds = turf.bbox(basinPoly);
    const boundsArea = (bounds[2] - bounds[0]) * (bounds[3] - bounds[1]);
    let statsScale = 100;
    if (boundsArea > 100) statsScale = 500;
    if (boundsArea > 500) statsScale = 2000;

    // Bloco 3 - Sensibilidade
    const popStats = dasyPop.reduceRegion({
      reducer: ee.Reducer.percentile([95]),
      geometry: geometry,
      scale: statsScale,
      maxPixels: 1e11,
      bestEffort: true,
      tileScale: 4
    });
    const p95_val = popStats.values().get(0);
    const p95_safe = ee.Algorithms.If(ee.Algorithms.IsEqual(p95_val, null), 1, p95_val);
    const p95 = ee.Algorithms.If(ee.Algorithms.IsEqual(p95_safe, 0), 1, p95_safe);
    const populationNormalized = dasyPop.divide(ee.Number(p95)).clamp(0, 1); 
    const sensitivityScore = populationNormalized.updateMask(ivpcMask);

    // Bloco 4 - Score Final IVPC
    const ivpc = exposureScore.multiply(0.5).add(sensitivityScore.multiply(0.5)).updateMask(ivpcMask);
    
    // Preparar camada visual
    const visualLayer = ivpc.updateMask(ivpcMask);
    const visParams = { 
      min: 0, 
      max: 1, 
      palette: ['#fee08b', '#fdae61', '#f46d43', '#d53e4f', '#9e0142']
    };

    // Estatísticas Absolutas
    const pixelAreaKm2 = ee.Image.pixelArea().divide(1e6);
    const areaTotal = geometry.area().divide(1e6);
    
    const urbanTotalArea = builtUp.multiply(pixelAreaKm2).reduceRegion({
      reducer: ee.Reducer.sum(),
      geometry: geometry,
      scale: statsScale,
      maxPixels: 1e11,
      bestEffort: true,
      tileScale: 4
    });

    const urbanBlindSpotArea = builtUp.and(blindSpotMask).multiply(pixelAreaKm2).reduceRegion({
      reducer: ee.Reducer.sum(),
      geometry: geometry,
      scale: statsScale,
      maxPixels: 1e11,
      bestEffort: true,
      tileScale: 4
    });

    const urbanMonitoredArea = builtUp.and(blindSpotMask.not()).multiply(pixelAreaKm2).reduceRegion({
      reducer: ee.Reducer.sum(),
      geometry: geometry,
      scale: statsScale,
      maxPixels: 1e11,
      bestEffort: true,
      tileScale: 4
    });

    const urbanEligibleArea = builtUp.and(ivpcMask).multiply(pixelAreaKm2).reduceRegion({
      reducer: ee.Reducer.sum(),
      geometry: geometry,
      scale: statsScale,
      maxPixels: 1e11,
      bestEffort: true,
      tileScale: 4
    });

    const popRiskF = dasyPop.updateMask(ivpcMask).reduceRegion({
      reducer: ee.Reducer.sum(),
      geometry: geometry,
      scale: statsScale,
      maxPixels: 1e11,
      bestEffort: true,
      tileScale: 4
    });

    const maxDistF = distanceImg.updateMask(ivpcMask).reduceRegion({
      reducer: ee.Reducer.max(),
      geometry: geometry,
      scale: statsScale,
      maxPixels: 1e11,
      bestEffort: true,
      tileScale: 4
    });

    const ivpcStats = ivpc.reduceRegion({
      reducer: ee.Reducer.mean(),
      geometry: geometry,
      scale: statsScale,
      maxPixels: 1e11,
      bestEffort: true,
      tileScale: 4
    });

    visualLayer.getMap(visParams, async (mapObj: any, err: any) => {
      if (err) return res.status(500).json({ error: "Map GEE Error: " + err });

      try {
        const getMapUrl = (img: any, vis: any): Promise<string> => {
          return new Promise((resolve, reject) => {
            img.getMap(vis, (m: any, e: any) => e ? reject(e) : resolve(m.urlFormat));
          });
        };

        const [urlFisico, urlCego, urlSensib, urlIvpcFinal, urlHotspots] = await Promise.all([
          getMapUrl(physicalHazardMask.selfMask(), { palette: ['#0000ff'] }),
          getMapUrl(blindSpotMask.selfMask(), { palette: ['#ff0000'] }),
          getMapUrl(sensitivityScore.selfMask(), { palette: ['#ff9900'] }),
          getMapUrl(ivpc, { min: 0, max: 1, palette: ['#fee08b', '#f46d43', '#d73027', '#a50026'] }),
          getMapUrl(ivpc.updateMask(ivpc.gt(0.6)), { min: 0.6, max: 1, palette: ['#ff0000', '#800000'] })
        ]);

        const combinedStats = ee.Dictionary({
          aT: areaTotal,
          uTotal: urbanTotalArea.values().get(0),
          uBlind: urbanBlindSpotArea.values().get(0),
          uMonitored: urbanMonitoredArea.values().get(0),
          uEligible: urbanEligibleArea.values().get(0),
          pRF: popRiskF.values().get(0),
          mDF: maxDistF.values().get(0),
          iF: ivpcStats.values().get(0)
        });

        const statsResult = await new Promise<any>((resolve, reject) => {
          combinedStats.evaluate((d: any, e: any) => e ? reject(e) : resolve(d));
        });

        const areaTotalNum = statsResult.aT || 0;
        const uTotalNum = statsResult.uTotal || 0;
        const uBlindNum = statsResult.uBlind || 0;
        const uMonitoredNum = statsResult.uMonitored || 0;
        const uEligibleNum = statsResult.uEligible || 0;
        const popRiskNum = statsResult.pRF || 0;
        const distMaxNum = statsResult.mDF || 0;
        const ivpcSocioambientalNum = statsResult.iF || 0;

        res.json({
          urlFormat: mapObj.urlFormat,
          socialUrlFormat: mapObj.urlFormat, // Usando a mesma camada visual de AHP
          modoMetodologico: modo_metodologico,
          mapUrls: { fisico: urlFisico, cego: urlCego, sensib: urlSensib, ivpc: urlIvpcFinal, hotspots: urlHotspots },
          stats: {
            areaTotal: areaTotalNum,
            urbanTotalArea: uTotalNum,
            urbanBlindSpotArea: uBlindNum,
            urbanMonitoredArea: uMonitoredNum,
            urbanEligibleArea: uEligibleNum,
            popTotalPontoCego: Math.floor(popRiskNum as number), 
            popIdososCriancas: Math.floor((popRiskNum as number) / 3), // Domícilios em risco
            distMax: distMaxNum,
            indiceInfraestrutura: ivpcSocioambientalNum,
            ivpcSocioambiental: ivpcSocioambientalNum,
            qtdEstacoes: estacoes ? estacoes.length : 0
          }
        });
      } catch (evalErr) {
        res.status(500).json({ error: "Stats GEE Error: " + evalErr });
      }
    });

  } catch (error: any) {
    res.status(500).json({ error: "Erro na análise IVPC: " + error.message });
  }
});

// --- Rota Heurística para Gerar Relatório Técnico sem IA ---
app.post("/api/analise/report", async (req, res) => {
  const { nomeBacia, stats } = req.body;
  if (!stats) return res.status(400).json({ error: "Stats necessárias" });

  try {
    const areaTotalKm2 = stats.areaTotal;
    const areaUrbanaRiscoKm2 = stats.areaUrbInundavel;
    const areaPontoCegoKm2 = stats.areaPontoCego;
    const porcentagemRisco = areaUrbanaRiscoKm2 > 0 ? (areaPontoCegoKm2 / areaUrbanaRiscoKm2) * 100 : 0;
    const distanciaMaxKm = stats.distMax / 1000;

    // 1. Lógica de Diagnóstico (Heurística de Risco)
    let diagnostico = "";
    let icone = "";
    
    if (porcentagemRisco >= 40) {
        icone = "🔴";
        diagnostico = `**Risco Crítico:** A bacia de ${nomeBacia} apresenta uma vulnerabilidade severa. Com ${porcentagemRisco.toFixed(1)}% da área urbana inundável localizada fora do raio de cobertura das estações, a capacidade de alerta precoce da Defesa Civil está severamente comprometida.`;
    } else if (porcentagemRisco >= 15 && porcentagemRisco < 40) {
        icone = "🟠";
        diagnostico = `**Risco Moderado:** A bacia de ${nomeBacia} possui vulnerabilidade intermediária. Embora haja monitoramento em parte do território, uma fração significativa (${porcentagemRisco.toFixed(1)}%) da malha urbana suscetível a inundações encontra-se em pontos cegos.`;
    } else {
        icone = "🟢";
        diagnostico = `**Risco Baixo:** A bacia de ${nomeBacia} apresenta boa cobertura de monitoramento. Apenas ${porcentagemRisco.toFixed(1)}% da área urbana inundável está em pontos cegos, indicando uma rede de alerta precoce relativamente eficaz.`;
    }

    // 2. Lógica de Recomendação de Políticas Públicas
    let recomendacao = "";
    if (distanciaMaxKm > 30) {
        recomendacao = `- **Ação Prioritária (ANA/CEMADEN):** Recomenda-se a instalação urgente de estações fluviométricas de telemetria nas sub-bacias que estão a mais de 30 km da rede atual (áreas em tons roxos no mapa).
- **Medida Mitigatória:** Implementação de sistemas de alerta comunitário e monitoramento participativo nas zonas urbanas mais afastadas.`;
    } else if (distanciaMaxKm > 15) {
        recomendacao = `- **Ação Estratégica:** Sugere-se a expansão gradual da rede de monitoramento, priorizando a instalação de réguas linimétricas nas áreas urbanas (em tons laranjas e vermelhos no mapa) não cobertas.
- **Defesa Civil:** Reforçar rotas de fuga nas áreas com tempo de resposta comprometido pela distância das estações.`;
    } else {
        recomendacao = `- **Manutenção:** Manter a operação e calibragem constante das estações já existentes.
- **Prevenção:** Focar esforços no ordenamento territorial para evitar a expansão da mancha urbana para áreas de inundação (banda do JRC).`;
    }

    // 3. Construção do Template Markdown Final
    const reportMarkdown = `### ${icone} Diagnóstico de Risco Hídrico
${diagnostico}

### 📊 Métricas de Exposição Calculadas
- **Área Total da Bacia:** ${areaTotalKm2.toFixed(2)} km²
- **Área Urbana em Risco de Inundação:** ${areaUrbanaRiscoKm2.toFixed(2)} km²
- **Vulnerabilidade de Ponto Cego:** ${areaPontoCegoKm2.toFixed(2)} km² *(Área urbana inundável sem monitoramento a >10km)*
- **Proporção de Risco Não Monitorado:** ${porcentagemRisco.toFixed(1)}%
- **Distância Máxima Crítica:** ${distanciaMaxKm.toFixed(1)} km

### 💡 Recomendações para Tomada de Decisão
${recomendacao}`;

    res.json({ report: reportMarkdown });
  } catch (error: any) {
    res.status(500).json({ error: "Erro na geração do relatório heurístico: " + error.message });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  await ensureEERuntime();

  async function bootstrap() {

  try {

    await ensureEERuntime();

    app.listen(
      PORT,
      () => {

        console.log(
          `Server running on port ${PORT}`
        );
      }
    );

  } catch (error) {

    console.error(
      "Failed to initialize Earth Engine:",
      error
    );

    process.exit(1);
  }
}

bootstrap();

  //app.listen(PORT, "0.0.0.0", () => {
  //  console.log(`Server running on http://localhost:${PORT}`);
  //});
}

startServer();
