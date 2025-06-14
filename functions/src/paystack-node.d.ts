
/**
 * Basic type declarations for the paystack-node module.
 */
declare module "paystack-node" {
  /**
   * Represents the Paystack SDK client.
   */
  class Paystack {
    constructor(secretKey: string);
    transaction: {
      initialize(args: any): Promise<any>;
      verify(args: any): Promise<any>;
      // Add other transaction methods if you use them
    };
    // Add other Paystack services if you use them (e.g., plan, customer)
  }
  export = Paystack;
}
