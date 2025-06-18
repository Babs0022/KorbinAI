
declare module 'paystack-node' {
  // You can add more specific types here if you know them or find them
  // For now, 'any' will suppress the TypeScript error
  // A more robust approach would be to define the actual types for Paystack methods
  // e.g., transaction.initialize, transaction.verify, etc.
  class Paystack {
    constructor(secretKey: string);
    transaction: {
      initialize: (params: any) => Promise<any>;
      verify: (params: { reference: string }) => Promise<any>;
      // Add other transaction methods if needed
    };
    // Add other Paystack modules like 'customer', 'plan', etc. if you use them
  }
  export default Paystack;
}
