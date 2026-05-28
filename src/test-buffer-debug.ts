// Test file para debug de buffers Turf.js
// Execute no browser console para testar se a lógica de union funciona

async function testTurfBuffers() {
  const turf = await import("@turf/turf");

  // Mock data: 3 estações na Bacia do Paraná
  const estacoes = [
    { latitude: -25.5, longitude: -54.6, nome: "Est 1" },
    { latitude: -26.0, longitude: -54.0, nome: "Est 2" },
    { latitude: -25.0, longitude: -55.0, nome: "Est 3" },
  ];

  // Mock bacia: rio Paraná
  const basinGeojson = {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        geometry: {
          type: "Polygon",
          coordinates: [
            [
              [-56.0, -26.5],
              [-53.0, -26.5],
              [-53.0, -24.0],
              [-56.0, -24.0],
              [-56.0, -26.5],
            ],
          ],
        },
        properties: { name: "Rio Paraná" },
      },
    ],
  };

  console.log("🧪 TESTE: Turf.js Buffer Logic");
  console.log("Estações:", estacoes.length);
  console.log("Basin:", basinGeojson.features[0].geometry.type);

  try {
    // 1. Criar buffers
    const buffers = estacoes.map((est) => {
      const point = turf.point([est.longitude, est.latitude]);
      const buf = turf.buffer(point, 10, { units: "kilometers" });
      console.log(`  ✓ Buffer para ${est.nome}:`, buf.geometry?.type);
      return buf;
    });

    // 2. Union - versão corrigida
    let unionedBuffer = buffers[0];
    console.log(`📍 Buffer 0 como base:`, unionedBuffer.geometry?.type);

    for (let i = 1; i < buffers.length; i++) {
      try {
        const newUnion = turf.union(unionedBuffer, buffers[i]);
        if (newUnion && newUnion.geometry) {
          unionedBuffer = newUnion;
          console.log(
            `✓ Union ${i} bem-sucedido:`,
            unionedBuffer.geometry?.type
          );
        } else {
          console.warn(`⚠️ Union ${i} retornou resultado inválido`);
        }
      } catch (e) {
        console.warn(`⚠️ Erro ao fazer union ${i}:`, (e as Error).message);
      }
    }

    console.log("✓ Buffers unidos:", unionedBuffer.geometry?.type);

    // 3. Intersect com bacia
    const basinFeature = basinGeojson.features[0];
    const monitoredArea = turf.intersect(basinFeature, unionedBuffer);
    console.log("✓ Área monitorada:", monitoredArea?.geometry?.type);

    // 4. Difference (blind spot)
    const blindSpotArea = turf.difference(basinFeature, unionedBuffer);
    console.log("✓ Blind spot:", blindSpotArea?.geometry?.type);

    // 5. Resultados
    console.log("\n✅ TESTE COMPLETO!");
    console.log({
      unionedBufferType: unionedBuffer.geometry?.type,
      monitoredAreaType: monitoredArea?.geometry?.type,
      blindSpotAreaType: blindSpotArea?.geometry?.type,
      hasMonitoredGeometry: !!monitoredArea?.geometry,
      hasBlindSpotGeometry: !!blindSpotArea?.geometry,
    });

    return {
      success: true,
      unionedBuffer,
      monitoredArea,
      blindSpotArea,
    };
  } catch (error) {
    console.error("❌ ERRO NO TESTE:", error);
    return { success: false, error };
  }
}

// Execute
testTurfBuffers().then((result) => console.log("RESULTADO FINAL:", result));
