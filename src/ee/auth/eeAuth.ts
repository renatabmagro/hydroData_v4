import ee
from "@google/earthengine";

let initialized = false;

export async function initializeEarthEngine():

Promise<void> {

  if (initialized) {
    return;
  }

  return new Promise(
    (
      resolve,
      reject
    ) => {

      try {

        const credentialsPath =
          process.env
            .GOOGLE_APPLICATION_CREDENTIALS;

        if (!credentialsPath) {

          reject(
            new Error(
              "GOOGLE_APPLICATION_CREDENTIALS not defined."
            )
          );

          return;
        }

        ee.initialize(

          null,

          null,

          () => {

            initialized = true;

            console.log(
              "Earth Engine initialized."
            );

            resolve();
          },

          (err: unknown) => {

            reject(err);
          }
        );

      } catch (error) {

        reject(error);
      }
    }
  );
}