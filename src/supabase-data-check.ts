// Script para verificar dados salvos no Supabase
// Execute no console do navegador em http://localhost:3000

async function checkSupabaseData() {
  console.log("🔍 Verificando dados no Supabase...");

  try {
    const response = await fetch("/api/analises?basin_id=paraná");
    const data = await response.json();

    console.log("✓ Resposta do Supabase:", data);

    if (data && data.length > 0) {
      console.log("✓ Dados encontrados! Últimas análises:", data.slice(0, 3));
      return data[0];
    } else {
      console.log("⚠️ Nenhuma análise salva para Paraná");
      return null;
    }
  } catch (e) {
    console.error("❌ Erro ao buscar dados:", e);
    return null;
  }
}

// Executar
checkSupabaseData().then((data) => {
  if (data) {
    console.log("\n📊 Dados da análise:");
    console.log({
      basinName: data.basin_name,
      urbanTotalArea: data.urban_total_area,
      blindSpotPercentage: data.blind_spot_percentage,
      estacoes: data.estacoes?.length || 0,
    });
  }
});
