import {Action, Flow, run} from '@genkit-ai/core';
import {https, onCall} from 'firebase-functions/v2/https';
import {z} from 'zod';
import {fromZodError} from 'zod-validation-error';

export function onCallGenkit<
  I extends z.ZodTypeAny,
  O extends z.ZodTypeAny,
  S extends z.ZodTypeAny,
>(
  flow: Flow<I, O, S>,
  options: https.CallableOptions = {
    region: 'us-central1',
    timeoutSeconds: 900,
    memory: '4GiB',
  }
) {
  return onCall(options, async (request) => {
    // Note: The Genkit `run` function can also be used to run flows.
    // However, it does not currently support streaming, so we are using `stream` instead.
    const stream = await run(flow, request.data);
    const result = await stream.output();
    if (!result) {
      throw new Error('No result returned from flow');
    }
    return result;
  });
}
