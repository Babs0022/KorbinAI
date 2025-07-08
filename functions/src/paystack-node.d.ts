
declare module 'paystack-node' {
  /**
   * This provides a minimal type definition for the Paystack client to satisfy TypeScript.
   * A more complete definition would include all the methods available on the client.
   * For the current usage, defining the constructor is sufficient to fix the import error.
   */
  class Paystack {
    constructor(secretKey: string);
    [key: string]: any; // Allows accessing any property or method without a TypeScript error.
  }
  export = Paystack;
}
