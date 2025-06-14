
declare module "paystack-node" {
  class Paystack {
    constructor(secretKey: string);
    transaction: {
      initialize(args: any): Promise<any>; // Ideally, replace 'any' with more specific types if known
      verify(args: any): Promise<any>;    // Ideally, replace 'any' with more specific types if known
      // Add other transaction methods if you use them, e.g., chargeToken, export, etc.
    };
    // Add other Paystack services if you use them, e.g., customer, plan, subscription, etc.
    // For example:
    // plan: {
    //   create(args: any): Promise<any>;
    //   get(args: any): Promise<any>;
    //   // ... other plan methods
    // };
  }
  export = Paystack;
}
