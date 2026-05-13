import { useAnalysis }
from "../hooks/useAnalysis";

import { useAnalysisStore }
from "../state/analysis.store";

export default function DashboardPage() {

  const { runAnalysis } =
    useAnalysis();

  const {
    isRunning,
    result,
    error
  } = useAnalysisStore();

  return (

    <div className="p-8 space-y-6">

      <div>
        <h1 className="text-3xl font-bold">
          IVPC Platform
        </h1>

        <p className="text-gray-500">
          Integrated Vulnerability Platform
        </p>
      </div>

      <button
        onClick={runAnalysis}
        className="
          px-4
          py-2
          rounded-lg
          bg-black
          text-white
        "
      >
        Run Analysis
      </button>

      {isRunning && (
        <div>
          Running analysis...
        </div>
      )}

      {error && (
        <div className="text-red-500">
          {error}
        </div>
      )}

      {result && (
        <pre className="
          p-4
          rounded-lg
          bg-gray-100
          overflow-auto
        ">
          {JSON.stringify(
            result,
            null,
            2
          )}
        </pre>
      )}

    </div>
  );
}