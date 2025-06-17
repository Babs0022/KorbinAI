
/**
 * @fileOverview Basic type declarations for the paystack-node module.
 * This provides a minimal structure to satisfy TypeScript.
 */
declare module "paystack-node" {
  interface PaystackInitializeArgs {
    email: string;
    amount?: number; // Amount in kobo
    plan?: string;
    reference?: string;
    callback_url?: string;
    metadata?: Record<string, unknown>;
    // Add other known properties if needed
    [key: string]: unknown; // Allow other properties
  }

  interface PaystackVerifyArgs {
    reference: string;
  }

  // A more generic response structure, can be detailed further
  interface PaystackResponseData {
    status: boolean; // Typically true for success
    message: string;
    data?: {
        authorization_url?: string;
        access_code?: string;
        reference?: string;
        status?: string; // For verification status, e.g., "success"
        // other known data properties
        [key: string]: unknown; // Allow other properties within data
    };
    [key: string]: unknown; // Allow other top-level properties
  }

  /**
   * Represents the Paystack SDK client.
   * Used for interacting with the Paystack API.
   */
  class Paystack {
    constructor(secretKey: string);
    transaction: {
      initialize(args: PaystackInitializeArgs): Promise<PaystackResponseData>;
      verify(args: PaystackVerifyArgs): Promise<PaystackResponseData>;
    };
    // Add other Paystack services if you use them
  }
  export = Paystack;
}
