
/**
 * Basic type declarations for the paystack-node module.
 * This provides a minimal structure to satisfy TypeScript.
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
      // Add other transaction methods if you use them, for example:
      // list(args?: any): Promise<any>;
      // fetch(args: { id?: number, reference?: string }): Promise<any>;
      // chargeAuthorization(args: any): Promise<any>;
      // checkAuthorization(args: any): Promise<any>;
      // viewTransactionTimeline(args: { id?: number, reference?: string }): Promise<any>;
      // export(args?: any): Promise<any>;
      // partialDebit(args: any): Promise<any>;
    };
    // Add other Paystack services if you use them (e.g., plan, customer)
    // plan: {
    //   create(args: any): Promise<any>;
    //   list(args?: any): Promise<any>;
    //   fetch(args: { id?: number, code?: string }): Promise<any>;
    //   update(args: { id?: number, code?: string, body: any }): Promise<any>;
    // };
    // customer: {
    //   create(args: any): Promise<any>;
    //   list(args?: any): Promise<any>;
    //   fetch(args: { id?: number, email_or_code?: string }): Promise<any>;
    //   update(args: { id?: number, code?: string, body: any }): Promise<any>;
    //   validate(args: { id?: number, code?: string, body: any }): Promise<any>;
    //   setRiskAction(args: any): Promise<any>;
    //   deactivateAuthorization(args: any): Promise<any>;
    // };
  }
  export = Paystack;
}
