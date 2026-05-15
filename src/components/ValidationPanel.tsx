// ========================================
// TYPES
// ========================================

interface ValidationReport {
  FIS: number | null;
  INU: number | null;
  PLU: number | null;
  MUN: number | null;
  IQA: number | null;
}

interface ValidationPanelProps {
  auditReport: ValidationReport | null;
  isAuditing: boolean;
  canRunValidation?: boolean;
  onRunValidation: () => void;
}

// ========================================
// METRIC CARD
// ========================================

interface MetricCardProps {
  title: string;
  value: number | null;
  highlight?: boolean;
}

function MetricCard({
  title,
  value,
  highlight = false,
}: MetricCardProps) {
  const getColor = () => {
    if (value === null) {
      return "bg-slate-100 border-slate-200";
    }

    if (value >= 0.9) {
      return "bg-green-100 border-green-300";
    }

    if (value >= 0.7) {
      return "bg-yellow-100 border-yellow-300";
    }

    return "bg-red-100 border-red-300";
  };

  const getTextColor = () => {
    if (value === null) {
      return "text-slate-400";
    }

    if (value >= 0.9) {
      return "text-green-700";
    }

    if (value >= 0.7) {
      return "text-yellow-700";
    }

    return "text-red-700";
  };

  return (
    <div
      className={
        `
        rounded-2xl border p-5 shadow-sm transition-all
        ${getColor()}
        ${highlight ? "ring-2 ring-blue-500 scale-105" : ""}
      `}
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-slate-600">
          {title}
        </span>

        {highlight && (
          <span className="text-xs px-2 py-1 rounded-full bg-blue-600 text-white">
            FINAL
          </span>
        )}
      </div>

      <div
        className={
          `
          text-4xl font-bold mt-4
          ${getTextColor()}
        `}
      >
        {value !== null ? value.toFixed(2) : "--"}
      </div>

      <div className="mt-2 text-xs text-slate-500">
        {value === null
          ? "Sem dados"
          : value >= 0.9
          ? "Excelente"
          : value >= 0.7
          ? "Moderado"
          : "Baixa qualidade"}
      </div>
    </div>
  );
}

// ========================================
// VALIDATION PANEL
// ========================================

export default function ValidationPanel({
  auditReport,
  isAuditing,
  canRunValidation = false,
  onRunValidation,
}: ValidationPanelProps) {
  return (
    <div className="space-y-6">

      {/* HEADER */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">

          <div>
            <h2 className="text-2xl font-bold text-slate-800">
              Validação Geoespacial da Extração
            </h2>
          </div>

          <button
            onClick={onRunValidation}
            disabled={isAuditing || !canRunValidation}
            className={
              `
              px-5 py-3 rounded-xl font-medium text-white transition-all
              ${
                isAuditing || !canRunValidation
                  ? "bg-slate-400 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700"
              }
            `}
          >
            {isAuditing
              ? "Executando validação..."
              : "Executar Validação"}
          </button>

        </div>
      </div>

      {/* EMPTY STATE */}
      {!auditReport && (
        <div className="bg-slate-50 border border-dashed border-slate-300 rounded-2xl p-10 text-center">

          <div className="text-slate-500 text-lg">
            Nenhuma validação executada.
          </div>

          <div className="text-slate-400 text-sm mt-2">
            Execute a extração na aba "Nova Extração" para habilitar a validação geoespacial.
          </div>

        </div>
      )}

      {/* RESULTS */}
      {auditReport && (
        <>
          {/* SCORE CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">

            <MetricCard
              title="FIS"
              value={auditReport.FIS}
            />

            <MetricCard
              title="INU"
              value={auditReport.INU}
            />

            <MetricCard
              title="PLU"
              value={auditReport.PLU}
            />

            <MetricCard
              title="MUN"
              value={auditReport.MUN}
            />

            <MetricCard
              title="IQA"
              value={auditReport.IQA}
              highlight
            />

          </div>

          {/* DETAILS */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">

            <h3 className="text-xl font-semibold text-slate-800 mb-4">
              Relatório de Auditoria
            </h3>

            <div className="space-y-3 text-sm">

              <div className="flex justify-between border-b pb-2">
                <span className="text-slate-600">
                  FIS — Integridade geométrica da bacia
                </span>

                <span className="font-semibold">
                  {auditReport.FIS !== null
                    ? auditReport.FIS.toFixed(2)
                    : "--"}
                </span>
              </div>

              <div className="flex justify-between border-b pb-2">
                <span className="text-slate-600">
                  INU — Validação de pixels de inundação
                </span>

                <span className="font-semibold">
                  {auditReport.INU !== null
                    ? auditReport.INU.toFixed(2)
                    : "--"}
                </span>
              </div>

              <div className="flex justify-between border-b pb-2">
                <span className="text-slate-600">
                  PLU — Recuperação de estações pluviométricas
                </span>

                <span className="font-semibold">
                  {auditReport.PLU !== null
                    ? auditReport.PLU.toFixed(2)
                    : "Sem estações"}
                </span>
              </div>

              <div className="flex justify-between border-b pb-2">
                <span className="text-slate-600">
                  MUN — Área urbana extraída
                </span>

                <span className="font-semibold">
                  {auditReport.MUN !== null
                    ? auditReport.MUN.toFixed(2)
                    : "--"}
                </span>
              </div>

              <div className="flex justify-between pt-4">
                <span className="text-lg font-bold text-slate-800">
                  IQA Final
                </span>

                <span className="text-2xl font-bold text-blue-700">
                  {auditReport.IQA !== null
                    ? auditReport.IQA.toFixed(2)
                    : "--"}
                </span>
              </div>

            </div>
          </div>

          <div className="bg-slate-50 rounded-2xl border border-slate-200 p-6 text-sm text-slate-600 space-y-3">
            <p className="font-semibold text-slate-800">Como os índices são obtidos:</p>
            <p>
              <strong>FIS</strong> compara a área da bacia original selecionada com a área da bacia extraída, validando a integridade geométrica.
            </p>
            <p>
              <strong>INU</strong> analisa a proporção de pixels de inundação válidos no raster de frequência de água em relação ao total esperado.
            </p>
            <p>
              <strong>PLU</strong> verifica se as estações pluviométricas esperadas foram recuperadas corretamente na extração.
            </p>
            <p>
              <strong>MUN</strong> avalia a correspondência entre a área urbana original esperada e a área urbana extraída no contexto da bacia.
            </p>
          </div>
        </>
      )}
    </div>
  );
}
