
declare module "paystack-node" {
  /**
   * Represents the Paystack SDK client.
   */
  class Paystack {
    constructor(secretKey: string);
    transaction: {
      initialize(args: any): Promise<any>; // Consider more specific types if known
      verify(args: any): Promise<any>; // Consider more specific types if known
      // Add other transaction methods if you use them
    };
    // Add other Paystack services if you use them (e.g., plan, customer)
  }
  export = Paystack;
}

    