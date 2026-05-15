export interface ValidationScores {
  FIS: number | null;
  INU: number | null;
  PLU: number | null;
  MUN: number | null;
  IQA: number;
}

export interface ValidationInput {
  originalBasin?: any;
  extractedBasin?: any;
  originalDrainage?: any;
  extractedDrainage?: any;
  originalStations?: any[];
  extractedStations?: any[];
  floodRaster?: {
    totalPixels: number;
    validPixels: number;
  };
  originalUrban?: any;
  extractedUrban?: any;
}
