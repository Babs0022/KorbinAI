
declare module 'wav' {
  import { Writable } from 'stream';

  export interface WriterOptions {
    channels?: number;
    sampleRate?: number;
    bitDepth?: number;
    format?: number;
    endianness?: 'LE' | 'BE';
  }

  export class Writer extends Writable {
    constructor(options?: WriterOptions);
  }

  // You can add more exports here if you use other parts of the 'wav' library
}
