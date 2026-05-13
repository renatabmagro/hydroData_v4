export function validateReportNarrative(
  blindSpotPercentage: number,
  monitoredPercentage: number
) {

  if (
    blindSpotPercentage === 100 &&
    monitoredPercentage > 0
  ) {

    throw new Error(
      "Invalid narrative: monitored areas exist but report claims total deficiency."
    );
  }
}