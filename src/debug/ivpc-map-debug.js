/**
 * IVPC Map Debug Script
 * =====================
 * Cole este script no Console do Navegador (F12) para debugar a renderização
 * 
 * Objetivo: Capturar o estado React do componente e verificar:
 * 1. Se basinGeojson chegou ao componente
 * 2. Se estacoes chegou ao componente  
 * 3. Se monitoredGeoJson está sendo calculado
 * 4. Se blindSpotGeoJson está sendo calculado
 * 5. Se layerVisibility permite renderização
 * 6. Se os dados chegam ao React-Leaflet GeoJSON
 */

console.log("🔍 [IVPC DEBUG] Iniciando diagnóstico de renderização...");

// 1. Verificar se React DevTools está disponível
if (window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
  console.log("✅ React DevTools disponível");
} else {
  console.warn("⚠️ React DevTools não encontrado");
}

// 2. Função para encontrar instâncias de componentes React
function findReactComponent(el) {
  for (let key in el) {
    if (key.startsWith("__react")) {
      const fiber = el[key];
      console.log("🔍 Fiber encontrado:", fiber);
      return fiber;
    }
  }
  return null;
}

// 3. Procurar pelo MapContainer (elemento root do mapa)
const mapContainer = document.querySelector('[class*="leaflet"]') || document.querySelector('.leaflet-container');
if (mapContainer) {
  console.log("✅ Leaflet map container encontrado:", mapContainer);
  
  // Verificar camadas visíveis
  const geoJsonLayers = mapContainer.querySelectorAll('path[class*="leaflet-interactive"]');
  console.log(`📊 Caminhos SVG encontrados: ${geoJsonLayers.length}`);
  
  if (geoJsonLayers.length > 0) {
    geoJsonLayers.forEach((layer, i) => {
      const fill = layer.getAttribute('fill');
      const style = window.getComputedStyle(layer);
      console.log(`  Path ${i}: fill="${fill}", opacity=${style.opacity}`);
    });
  }
} else {
  console.warn("❌ Leaflet map container NÃO encontrado");
}

// 4. Verificar localStorage de debug
const debug = localStorage.getItem("ivpc-debug");
if (debug) {
  console.log("🐛 Debug data em localStorage:", JSON.parse(debug));
} else {
  console.log("ℹ️ Nenhum debug data em localStorage");
}

// 5. Verificar se há console.logs do componente
console.log("\n📋 [VERIFICAÇÃO] Procure por logs começando com:");
console.log("  - '🔵 [IVPCMap]' - Ciclo de vida");
console.log("  - 'Buffer' - Criação de buffers");
console.log("  - 'Union' - Operação de união");
console.log("  - 'Setando' - Atualização de estado");
console.log("  - '🟢 [IVPCMap]' - Conclusão");

// 6. Exportar função para verificar estado React
window.ivpcDebug = {
  // Listar todas as geojsons renderizadas
  listGeoJsonLayers: () => {
    const paths = document.querySelectorAll('path[class*="leaflet-interactive"]');
    const result = {
      total: paths.length,
      paths: Array.from(paths).map((p, i) => ({
        index: i,
        fill: p.getAttribute('fill'),
        opacity: window.getComputedStyle(p).opacity,
        strokeWidth: p.getAttribute('stroke-width'),
        classNames: p.getAttribute('class'),
      })),
    };
    console.table(result.paths);
    return result;
  },

  // Capturar próximo setState do IVPCMap
  watchStateUpdates: () => {
    console.log("🔍 Aguardando atualizações de estado... (verifique console)");
    // Os logs do componente vão aparecer automaticamente
  },

  // Verificar cores esperadas
  checkColors: () => {
    const expectedColors = {
      blue: "#2563eb", // Basin boundary
      green: "#4ade80", // Monitored
      orange: "#f97316", // Blind spot
    };
    console.table(expectedColors);
    const paths = document.querySelectorAll('path[class*="leaflet-interactive"]');
    console.log(`Procurando ${paths.length} paths por cores...`);
    paths.forEach((p, i) => {
      const fill = p.getAttribute('fill');
      if (fill === expectedColors.green) {
        console.log(`✅ Path ${i} É A ÁREA MONITORADA (verde)`);
      }
      if (fill === expectedColors.orange) {
        console.log(`✅ Path ${i} É O BLIND SPOT (laranja)`);
      }
    });
  },

  // Forçar re-render (experimental)
  forceCheck: () => {
    console.log("🔄 Verificando estado atual do mapa...");
    window.ivpcDebug.listGeoJsonLayers();
    window.ivpcDebug.checkColors();
  },
};

console.log("\n💡 [COMANDOS DISPONÍVEIS]");
console.log("  ivpcDebug.listGeoJsonLayers() - Listar todas as camadas renderizadas");
console.log("  ivpcDebug.watchStateUpdates() - Ficar atento a atualizações");
console.log("  ivpcDebug.checkColors()       - Procurar por cores de blind spot/monitored");
console.log("  ivpcDebug.forceCheck()        - Verificação rápida");

console.log("\n✅ Debug script carregado! Use ivpcDebug.* para inspecionar");
