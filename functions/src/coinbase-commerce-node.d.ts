
declare module 'coinbase-commerce-node' {
  // Basic type declarations for coinbase-commerce-node

  interface Charge {
    id: string;
    code: string;
    // Add other properties as needed from Coinbase API docs
    metadata: { [key: string]: any };
    pricing: {
      local: {
        amount: string;
        currency: string;
      }
    }
  }

  interface Event {
    id: string;
    type: 'charge:created' | 'charge:confirmed' | 'charge:failed' | 'charge:delayed' | 'charge:pending' | 'charge:resolved';
    data: Charge;
    // Add other event properties
  }

  export class Webhook {
    static verifyEventBody(rawBody: string, signature: string, sharedSecret: string): Event;
  }
  
  // Add other exports like Client, resources if needed
  // ...
}
