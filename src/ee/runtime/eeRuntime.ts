import {
  initializeEarthEngine
}
from "../auth/eeAuth";

export async function ensureEERuntime() {

  await initializeEarthEngine();

  return true;
}