# IVPC Map Debugging - Instruções de Renderização

## Status Atual ✅

- **Turf.js API**: Corrigida e testada (2/2 testes passando)
- **Pipeline de Cálculo**: Funcionando (validado por unit tests)
- **Problema Atual**: Polígonos verde (monitored) e laranja (blind spot) NÃO renderizam visualmente no mapa
- **Sintoma**: Apenas círculos e marcadores de estações aparecem

## Diagnóstico Passo a Passo

### 1️⃣ Verificar no Console do Navegador (F12)

Abra o navegador em `http://localhost:3000` e siga estes passos:

#### Passo 1.1: Verificar Logs do Componente

1. Abra DevTools: **F12**
2. Vá para a aba **Console**
3. Selecione "Bacia do Paraná"
4. Clique "Iniciar Extração Real"
5. Navegue para a aba **Análise**
6. Procure por logs começando com **`🔵 [IVPCMap]`**

Você deve ver algo assim:
```
🔵 [IVPCMap] useEffect iniciado
Buffer 0: Est 1... -> type: Polygon
Buffer 1: Est 2... -> type: Polygon
✅ Union bem-sucedido: MultiPolygon
✅ Monitored Area: Polygon
✅ Blind Spot Area: MultiPolygon
Setando monitoredGeoJson com: {type, features}
🟢 [IVPCMap] Cálculo concluído com sucesso
```

**Se você VÊ esses logs**: O cálculo está funcionando! Vá para Passo 2.
**Se você NÃO VÊ esses logs**: Execute o comando de debug abaixo.

#### Passo 1.2: Carregar Script de Debug

Cole EXATAMENTE este comando no console:

```javascript
// Carregar script de debug
fetch('/src/debug/ivpc-map-debug.js')
  .then(r => r.text())
  .then(code => eval(code))
  .catch(e => console.error('Erro ao carregar debug:', e))
```

Se isso falhar, execute diretamente no console:

```javascript
// Verificação manual de camadas renderizadas
const paths = document.querySelectorAll('path[class*="leaflet-interactive"]');
console.log(`Total de paths SVG: ${paths.length}`);
paths.forEach((p, i) => {
  const fill = p.getAttribute('fill');
  console.log(`Path ${i}: fill="${fill}"`);
});
```

### 2️⃣ Verificar Estrutura de Dados

Procure por ERROS no console. Possíveis erros:

- **"❌ Bacia não possui geometria válida"** 
  - Problema: `basinGeojson` é null ou não tem coordenadas
  - Solução: Verificar se extração completou
  
- **"❌ Sem estações"**
  - Problema: `estacoes` não carregou
  - Solução: Verificar se API `/api/estacoes` está respondendo

### 3️⃣ Verificar Visibilidade de Camadas

No console, execute:

```javascript
// Verificar se as camadas estão visíveis
console.log("🎨 Verificando camadas...");

// Procurar por paths SVG com cores esperadas
const paths = document.querySelectorAll('path[class*="leaflet-interactive"]');
console.log(`Total de paths: ${paths.length}`);

// Cores esperadas (em hex)
const expectedFills = {
  "blue": "#2563eb",    // Basin boundary
  "green": "#4ade80",   // Monitored areas
  "orange": "#f97316",  // Blind spots
};

paths.forEach((p, i) => {
  const fill = p.getAttribute('fill');
  const stroke = p.getAttribute('stroke');
  const strokeWidth = p.getAttribute('stroke-width');
  const opacity = p.getAttribute('opacity') || '1';
  
  if (fill === expectedFills.green) {
    console.log(`✅ [${i}] ÁREA MONITORADA (verde) encontrada!`);
  } else if (fill === expectedFills.orange) {
    console.log(`✅ [${i}] BLIND SPOT (laranja) encontrado!`);
  } else {
    console.log(`  [${i}] fill="${fill}", stroke="${stroke}", opacity="${opacity}"`);
  }
});
```

### 4️⃣ Testar com Dados Mock

Se nenhum polígono aparecer mesmo com logs corretos:

1. Abra o arquivo: `/src/components/IVPCMapDebug.tsx`
2. Este componente tem dados mock incorporados
3. Teste importando e renderizando este componente

### 5️⃣ Verificar React State

Se o componente está caindo silenciosamente:

```javascript
// No console, verifique se há erros silenciosos
console.table({
  basinGeoJsonExists: !!document.querySelector('[data-geojson-id="basin"]'),
  monitoredGeoJsonExists: !!document.querySelector('[data-geojson-id="monitored"]'),
  blindSpotGeoJsonExists: !!document.querySelector('[data-geojson-id="blindspot"]'),
  totalSVGPaths: document.querySelectorAll('path').length,
  totalCircles: document.querySelectorAll('circle').length,
  totalMarkers: document.querySelectorAll('img[src*="marker"]').length,
});
```

## Cenários Esperados

### Cenário 1: Tudo Funciona ✅
- Polígonos verde e laranja aparecem no mapa
- Console mostra todos os logs `🔵 [IVPCMap]`
- Cores e transparências corretas
- **AÇÃO**: Celebrar! Tirar screenshot para validação

### Cenário 2: Logs Aparecem mas Sem Polígonos 🟡
- Console mostra logs de sucesso
- Mas polígonos não aparecem visualmente
- **CAUSA PROVÁVEL**: Problema de renderização React-Leaflet
- **AÇÃO**:
  1. Verificar se `layerVisibility.monitored` e `layerVisibility.blindSpot` são true
  2. Testar com IVPCMapDebug.tsx (componente mock)
  3. Verificar console por erros de React

### Cenário 3: Erro de Geometria ❌
- Console mostra "❌ Bacia não possui geometria válida"
- **CAUSA PROVÁVEL**: Extração não completou ou basinGeojson é null
- **AÇÃO**:
  1. Aguardar extração completar ("Consultando Earth Engine...")
  2. Verificar se há erros na extração
  3. Se persistir, reenviar dados do Supabase

### Cenário 4: Sem Estações ❌
- Console mostra "❌ Sem estações"
- **CAUSA PROVÁVEL**: Falha ao carregar `/api/estacoes`
- **AÇÃO**:
  1. Verificar se backend está rodando
  2. Testar URL diretamente: `curl http://localhost:3001/api/estacoes`
  3. Verificar logs do servidor

## Testes Automatizados que Já Passaram ✅

```bash
npm run test -- tests/unit/turfBufferLogic.test.ts
# ✓ 5/5 testes passaram

npm run test -- tests/unit/IVPCMap.rendering.test.ts
# ✓ 2/2 testes passaram
```

O pipeline Turf.js está **100% funcional**. O problema está na renderização visual.

## Próximas Ações

### Se polígonos NÃO renderizam:

1. **Coletar console logs** (F12 → Console → Screenshot ou copy)
2. **Usar ferramenta debug** disponível como `ivpcDebug.*`
3. **Testar IVPCMapDebug.tsx** com dados mock
4. **Verificar Network tab** para erros de carregamento

### Se polígonos renderizam:

1. ✅ Validar cores e transparências
2. ✅ Testar interatividade (click, hover)
3. ✅ Verificar metricas (blind spot %, area)
4. ✅ Tirar screenshots para portfolio
5. ✅ Fazer commit com sucesso

## Contato com Desenvolvimento

Se os polígonos não renderizarem após seguir estas etapas:

1. Coletar:
   - Screenshot da aba Console (completa)
   - Aba Network (após extrair dados)
   - Aba Elements → Inspecionar `<path>` elementos SVG

2. Reportar com contexto:
   - Qual bacia foi selecionada
   - Se logs `🔵 [IVPCMap]` aparecem
   - Que cores de fill aparecem nos paths
   - Valor de `layerVisibility`

---

**Last Updated**: 2024
**Status**: Turf.js ✅ | Rendering 🔍 | Visual 🟡
