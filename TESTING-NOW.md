# 🎯 PRÓXIMOS PASSOS - Teste de Renderização de Polígonos

## ✅ O que foi feito nesta sessão:

1. **Corrigido Turf.js API** ✓ (Fixed 3 function calls com FeatureCollections)
2. **Testes unitários** ✓ (7/7 tests passing)
3. **Sistema de debug completo** ✓
   - `window.ivpcState` exposto globalmente
   - Logs detalhados em cada ponto de renderização
   - Script de debug para inspecionar camadas Leaflet
   - Guia DEBUGGING.md com checklist

---

## 🚀 AGORA: Teste de Renderização Real

### Passo 1: Testar no Navegador

```
1. Abra http://localhost:3000
2. Selecione "Bacia do Paraná"
3. Clique "Iniciar Extração Real"
4. Aguarde: "Consultando Earth Engine e SQLite..."
5. Abra DevTools (F12)
6. Vá para aba "Análise"
```

### Passo 2: Verificar Logs no Console

Procure por logs começando com:
- **`🔵 [IVPCMap]`** - Lifecycle
- **`🟢 [RENDER]`** - Renderização de monitored area
- **`🟠 [RENDER]`** - Renderização de blind spot
- **`🟢 [FEATURE]`** - Features em layer
- **`💾 [DEBUG]`** - Estado exposto

**Se você VER esses logs**: Pipeline está funcionando! ✓

**Se você NÃO VER**: Execute no console:
```javascript
// Copie e cole no console (F12)
console.log("ivpcState:", window.ivpcState);
```

---

## 🔍 Cenários de Teste

### Cenário 1: Polígonos aparecem! 🎉
**Ação**: Tome screenshot! Os logs e os polígonos visuais confirmam tudo funcionando.
- Valide cores: verde (#4ade80) e laranja (#f97316)
- Teste clique nos polígonos para popups
- Documente para portfolio

### Cenário 2: Logs aparecem, mas sem polígonos 🟡
**Diagnóstico**:
```javascript
// No console:
console.log("State:", window.ivpcState);
console.log("Layer visibility:", window.ivpcState.layerVisibility);
console.log("Monitored GeoJSON:", window.ivpcState.monitoredGeoJson);
console.log("Blind Spot GeoJSON:", window.ivpcState.blindSpotGeoJson);
```

**Possíveis causas**:
- `layerVisibility.monitored` ou `layerVisibility.blindSpot` = false
- `monitoredGeoJson` ou `blindSpotGeoJson` = null
- React-Leaflet não renderizando GeoJSON
- **Solução**: Ver DEBUGGING.md → Cenário 2

### Cenário 3: Erro de bacia/estações ❌
**Log esperado**:
```
❌ Bacia não possui geometria válida
❌ Sem estações
```

**Solução**:
- Aguardar extração completar
- Verificar se `basinGeojson` tem coordenadas
- Testar com IVPCMapDebug.tsx (mock data)

---

## 💡 Comando de Debug Rápido

Cole **EXATAMENTE** isso no console para verificar tudo:

```javascript
// Diagnóstico completo
console.log("=== IVPC MAP DEBUG ===");
console.log("1. Estações:", window.ivpcState?.estacoes);
console.log("2. Bacia existe:", window.ivpcState?.basinGeoJsonExists);
console.log("3. Visibility:", window.ivpcState?.layerVisibility);
console.log("4. Monitored features:", window.ivpcState?.monitoredGeoJson?.features?.length);
console.log("5. Blind spot features:", window.ivpcState?.blindSpotGeoJson?.features?.length);
console.log("6. Snapshot:", window.ivpcState?.getSnapshot?.());

// Listar todas as camadas SVG renderizadas
const paths = document.querySelectorAll('path[class*="leaflet-interactive"]');
console.log("7. Total paths SVG:", paths.length);
paths.forEach((p, i) => {
  const fill = p.getAttribute('fill');
  if (fill === '#4ade80') console.log(`   ✅ Path ${i}: AREA MONITORADA (verde)`);
  if (fill === '#f97316') console.log(`   ✅ Path ${i}: BLIND SPOT (laranja)`);
});
```

---

## 📋 Checklist de Validação

Quando os polígonos renderizarem, verificar:

- [ ] Polígono verde visível (monitored)
- [ ] Polígono laranja visível (blind spot)
- [ ] Cores corretas (verde #4ade80, laranja #f97316)
- [ ] Transparências visíveis (não totalmente opaco)
- [ ] Popups funcionam (click na área)
- [ ] Coordenadas coerentes com bacia
- [ ] Círculos de buffer ainda visíveis
- [ ] Marcadores de estações ainda visíveis
- [ ] Performance OK (mapa responsivo)

---

## 🛠️ Dados de Teste (Se quiser usar Mock)

Se a extração real não funcionar, pode usar `IVPCMapDebug.tsx`:

```javascript
// Mock data incorporado
const mockBasin = {
  type: "Polygon",
  coordinates: [
    [
      [-56.5, -27.0], [-52.5, -27.0],
      [-52.5, -23.0], [-56.5, -23.0],
      [-56.5, -27.0]
    ]
  ]
};

const mockEstacoes = [
  { latitude: -25.5, longitude: -54.6, nome: "Est 1" },
  { latitude: -26.0, longitude: -54.0, nome: "Est 2" }
];
```

---

## 🎯 Status Final

| Componente | Status | Observações |
|---|---|---|
| Turf.js API | ✅ Corrigido | 3 functions usando FeatureCollections |
| Unit Tests | ✅ 7/7 Passing | Pipeline + Rendering + Buffer logic |
| Build | ✅ 5.38s | Sem erros |
| Debug System | ✅ Completo | Logging, window.ivpcState, script |
| Visual Rendering | 🔍 Testando | **VOCÊ AQUI** |

---

## ❓ Se ainda não renderizar

1. Verifique DEBUGGING.md (guia completo)
2. Cole comando de debug rápido acima
3. Reporte com:
   - Screenshot do console (completo)
   - Output do `window.ivpcState.getSnapshot()`
   - Quantos paths SVG existem
   - Quais cores aparecem

---

**Última alteração**: commit 1548d6a
**Branch**: feature/ivpc-spatial-visualization
**Ready for**: Real-time browser testing
