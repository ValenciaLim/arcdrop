/* eslint-disable no-console */
/**
 * Attempts to derive a fresh Entity Secret ciphertext using the Circle SDK.
 * Prints the ciphertext to stdout if successful.
 *
 * Usage:
 *   CIRCLE_API_KEY=... CIRCLE_ENTITY_SECRET=... npm run circle:ciphertext
 */

async function main() {
  const apiKey = process.env.CIRCLE_API_KEY || "";
  const entitySecret = process.env.CIRCLE_ENTITY_SECRET || "";
  if (!apiKey || !entitySecret) {
    console.error("Missing CIRCLE_API_KEY or CIRCLE_ENTITY_SECRET in env.");
    process.exit(1);
  }
  try {
    const sdk: any = await import("@circle-fin/developer-controlled-wallets");

    const tryFns = [
      "getEntitySecretCiphertext",
      "reEncryptEntitySecret",
      "encryptEntitySecret",
    ];

    for (const fn of tryFns) {
      const candidate = (sdk as any)[fn];
      if (typeof candidate === "function") {
        const res = await candidate({
          apiKey,
          entitySecret,
        });
        if (typeof res === "string" && res.length > 0) {
          console.log(res);
          return;
        }
        // Some SDKs return objects
        if (res && typeof res === "object") {
          const val =
            res.entitySecretCiphertext ||
            res.ciphertext ||
            res.data?.entitySecretCiphertext;
          if (typeof val === "string" && val.length > 0) {
            console.log(val);
            return;
          }
        }
      }
    }

    console.error(
      "Unable to derive ciphertext with the installed SDK. Please update @circle-fin/developer-controlled-wallets or use Console tooling to obtain a one-time ciphertext.",
    );
    process.exit(2);
  } catch (err) {
    console.error(
      "Failed to load SDK or derive ciphertext:",
      err instanceof Error ? err.message : String(err),
    );
    process.exit(3);
  }
}

main();


