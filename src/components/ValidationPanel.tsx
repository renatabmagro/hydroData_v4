import React, { useState, useEffect } from "react";
import { CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { runValidationPipeline, canRunValidation } from "../services/validationPipeline";
import { getExtractedData } from "../services/extractedDataStore";

// ========================================
// TYPES
// ========================================

interface ValidationReport {
  FIS: number | null;
  INU: number | null;
  PLU: number | null;
  MUN: number | null;
  IQA: number | null;
  status: "Aprovado" | "Pendente de Revisão";
}

interface ValidationPanelProps {
  auditReport?: ValidationReport | null;
  isAuditing?: boolean;
  canRunValidation?: boolean;
  onRunValidation?: () => void;
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
      `
      }
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
        `
        }
      >
        {value !== null
          ? value.toFixed(2)
          : "--"}
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
  auditReport: initialReport = null,
  isAuditing: initialIsAuditing = false,
  canRunValidation: initialCanRun = true,
  onRunValidation,
}: ValidationPanelProps) {
  // ✅ NOVO: Gerenciar estado interno de validação
  const [auditReport, setAuditReport] = useState<ValidationReport | null>(
    initialReport
  );
  const [isAuditing, setIsAuditing] = useState(initialIsAuditing);
  const [canValidate, setCanValidate] = useState(initialCanRun);
  const [validationError, setValidationError] = useState<string | null>(null);

  // ✅ Verificar se há dados extraídos ao montar
  useEffect(() => {
    const checkValidationStatus = () => {
      const canRun = canRunValidation();
      setCanValidate(canRun);

      if (!canRun) {
        const extracted = getExtractedData();
        console.log("⚠️ [VALIDATION] Dados insuficientes para validação:", {
          basinGeojson: !!extracted.basinGeojson,
          mdtTileUrl: !!extracted.mdtTileUrl,
          estacoes: extracted.estacoes?.length,
        });
      }
    };

    // Verificar imediatamente e depois a cada 2 segundos (enquanto extração está em progresso)
    checkValidationStatus();
    const interval = setInterval(checkValidationStatus, 2000);

    return () => clearInterval(interval);
  }, []);

  // ✅ Handler para executar validação
  const handleValidationClick = async () => {
    setIsAuditing(true);
    setValidationError(null);

    try {
      console.log("🔵 [VALIDATION PANEL] Iniciando validação...");

      const scores = await runValidationPipeline();

      setAuditReport({
        FIS: scores.FIS,
        INU: scores.INU,
        PLU: scores.PLU,
        MUN: scores.MUN,
        IQA: scores.IQA,
        status: scores.status,
      });

      console.log("✅ [VALIDATION PANEL] Validação concluída com sucesso");
    } catch (error: any) {
      const message =
        error instanceof Error
          ? error.message
          : "Erro desconhecido na validação";
      setValidationError(message);
      console.error("❌ [VALIDATION PANEL] Erro:", error);
    } finally {
      setIsAuditing(false);
    }
  };

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
            onClick={handleValidationClick}
            disabled={isAuditing || !canValidate}
            className={
              `
              px-5 py-3 rounded-xl font-medium text-white transition-all
              ${
                isAuditing || !canValidate
                  ? "bg-slate-400 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700"
              }
            `
            }
          >
            {isAuditing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin inline mr-2" />
                Executando validação...
              </>
            ) : !canValidate ? (
              <>
                <AlertCircle className="w-4 h-4 inline mr-2" />
                Extraia dados primeiro
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4 inline mr-2" />
                Executar Validação
              </>
            )}
          </button>

        </div>

      </div>

      {/* ERROR STATE */}
      {validationError && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-5 text-red-800">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-semibold">Erro na Validação</h3>
              <p className="text-sm mt-1">{validationError}</p>
            </div>
          </div>
        </div>
      )}

      {/* EMPTY STATE */}
      {!auditReport && !validationError && (

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
                  FIS — Disponibilidade da fisiografia
                </span>

                <span className="font-semibold">
                  {auditReport.FIS !== null
                    ? auditReport.FIS.toFixed(2)
                    : "--"}
                </span>

              </div>

              <div className="flex justify-between border-b pb-2">

                <span className="text-slate-600">
                  INU — Integridade operacional do raster
                </span>

                <span className="font-semibold">
                  {auditReport.INU !== null
                    ? auditReport.INU.toFixed(2)
                    : "--"}
                </span>

              </div>

              <div className="flex justify-between border-b pb-2">

                <span className="text-slate-600">
                  PLU — Coerência espacial das estações
                </span>

                <span className="font-semibold">
                  {auditReport.PLU !== null
                    ? auditReport.PLU.toFixed(2)
                    : "Sem estações"}
                </span>

              </div>

              <div className="flex justify-between border-b pb-2">

                <span className="text-slate-600">
                  MUN — Disponibilidade dos dados municipais
                </span>

                <span className="font-semibold">
                  {auditReport.MUN !== null
                    ? auditReport.MUN.toFixed(2)
                    : "--"}
                </span>

              </div>

              {/* STATUS */}
              <div className="flex justify-between pt-2 border-t mt-4">

                <span className="text-lg font-bold text-slate-800">
                  Status
                </span>

                <span
                  className={
                    auditReport.status === "Aprovado"
                      ? "text-green-700 font-bold"
                      : "text-yellow-700 font-bold"
                  }
                >
                  {auditReport.status}
                </span>

              </div>

              {/* IQA */}
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

          {/* INFO */}
          <div className="bg-slate-50 rounded-2xl border border-slate-200 p-6 text-sm text-slate-600 space-y-3">

            <p className="font-semibold text-slate-800">
              Como os índices são obtidos:
            </p>

            <p>
              <strong>FIS:</strong> Verifica a disponibilidade operacional da geometria da bacia, MDT e rede hidrográfica.
            </p>

            <p>
              <strong>INU:</strong> Verifica apenas a disponibilidade e integridade mínima do raster histórico de inundação.
            </p>

            <p>
              <strong>PLU:</strong> Mede a coerência espacial das estações em relação ao polígono da bacia.
            </p>

            <p>
              <strong>MUN:</strong> Verifica a disponibilidade dos dados urbanos, populacionais e de risco.
            </p>

            <p>
              <strong>IQA:</strong> Representa a qualidade operacional da extração geoespacial.
            </p>

          </div>

        </>

      )}

    </div>

  );
}
