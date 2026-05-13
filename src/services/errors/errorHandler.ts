import { log } from "../logger/logger";

export function handleError(error: unknown): void {

  if (error instanceof Error) {
    log("error", error.message, {
      stack: error.stack
    });

    return;
  }

  log("error", "Unknown error received");
}
