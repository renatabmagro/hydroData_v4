import ee
from "@google/earthengine";

let initialized = false;

export async function initializeEE() {

  if (initialized)
    return ee;

  return new Promise((resolve, reject) => {

    ee.initialize(
      null,
      null,

      () => {

        initialized = true;

        console.log(
          "Earth Engine initialized"
        );

        resolve(ee);
      },

      (error : unknown) => {

        console.error(
          "EE initialization error:",
          error
        );

        reject(error);
      }
    );
  });
}