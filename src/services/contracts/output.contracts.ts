export interface AnalysisOutputContract {

  metadata: {

    methodologyVersion: string;

    generatedAt: string;

    source: string;
  };

  universes: {

    globalAreaKm2: number;

    eligibleUrbanAreaKm2: number;

    monitoredUrbanAreaKm2: number;

    blindSpotUrbanAreaKm2: number;
  };

  metrics: {

    blindSpotPercentage: number;

    monitoredPercentage: number;

    totalCoveragePercentage: number;
  };

  ivpc: {

    value: number;

    classification: string;
  };
}