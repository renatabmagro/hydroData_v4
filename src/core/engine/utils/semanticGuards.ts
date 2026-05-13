import {
  StatisticalUniverses
}
from "../types/statisticalUniverse.types";

export function validateStatisticalUniverses(
  universes: StatisticalUniverses
) {

  const {

    globalAreaKm2,

    eligibleUrbanAreaKm2,

    monitoredUrbanAreaKm2,

    blindSpotUrbanAreaKm2

  } = universes;

  if (
    eligibleUrbanAreaKm2 >
    globalAreaKm2
  ) {

    throw new Error(
      "Eligible urban area exceeds total basin area."
    );
  }

  if (
    monitoredUrbanAreaKm2 +
    blindSpotUrbanAreaKm2 >
    eligibleUrbanAreaKm2
  ) {

    throw new Error(
      "Coverage exceeds eligible urban area."
    );
  }

  if (
    blindSpotUrbanAreaKm2 < 0
  ) {

    throw new Error(
      "Blind spot area cannot be negative."
    );
  }
}