
declare module "paystack-node" {
  // This is a basic type declaration for the paystack-node library.
  // For more comprehensive typing, you might need to define interfaces
  // for Paystack's API request/response objects.
  // Using 'any' here for simplicity as precise types are not available.

  /**
   * Represents the Paystack SDK client.
   */
  class Paystack {
    constructor(secretKey: string);
    transaction: {
      initialize: (params: any) => Promise<any>; // Consider defining specific types
      verify: (params: { reference: string }) => Promise<any>; // Consider specific types
      // Add other transaction methods if needed
    };
    // Add other Paystack modules like 'customer', 'plan', etc. if you use them
  }
  export default Paystack;
}
