export interface ReportSummary {
  title: string;
  methodologyVersion: string;
  generatedAt: string;
}

export interface ReportValidationResult {
  valid: boolean;
  forbiddenTermsFound: string[];
}
