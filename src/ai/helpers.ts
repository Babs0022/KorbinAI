import {Action, Flow, run} from '@genkit-ai/core';
import {onCall, CallableOptions} from 'firebase-functions/v2/https';
import {z} from 'zod';

export function onCallGenkit<
  I extends z.ZodTypeAny,
  O extends z.ZodTypeAny,
  S extends z.ZodTypeAny,
>(
  flow: Flow<I, O, S>,
  options: CallableOptions = {
    region: 'us-central1',
    timeoutSeconds: 900,
    memory: '4GiB',
  }
) {
  return onCall(options, async (request) => {
    // The `run` function executes a flow by name and returns the output directly.
    const result = await run(flow.name, request.data);
    if (!result) {
      throw new Error('No result returned from flow');
    }
    return result;
  });
}
