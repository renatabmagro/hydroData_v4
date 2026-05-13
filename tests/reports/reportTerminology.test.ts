import { describe, expect, it } from "vitest";

describe("Report Terminology", () => {
  const forbiddenTerms = [
    "flood risk",
    "flood probability",
    "imminent disaster",
    "certain flooding"
  ];

  const reportText = `
    The analysis identifies relative vulnerability hotspots
    associated with operational monitoring deficiencies.
  `;

  forbiddenTerms.forEach((term) => {
    it(`should not contain forbidden term: ${term}`, () => {
      expect(reportText.toLowerCase()).not.toContain(
        term.toLowerCase()
      );
    });
  });
});