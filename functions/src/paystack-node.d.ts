
declare module "paystack-node" {
  // This is a basic type declaration for the paystack-node library.
  // For more comprehensive typing, define interfaces for Paystack's API
  // request/response objects. Using 'any' for simplicity.

  /**
   * Represents the Paystack SDK client.
   * More specific types can be added later for stricter type checking.
   */
  class Paystack {
    constructor(secretKey: string);
    transaction: {
      // Params and Promise<any> can be typed more strictly if needed.
      initialize: (params: any) => Promise<any>;
      verify: (params: { reference: string }) => Promise<any>;
      // Add other transaction methods if needed
    };
    // Add other Paystack modules like 'customer', 'plan', etc.
  }
  export default Paystack;
}
