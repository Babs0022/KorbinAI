
'use server';
/**
 * @fileOverview DEPRECATED: This flow was used for referral code validation.
 * The referral system has been removed.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const ValidateReferralCodeInputSchema = z.object({
  referralCode: z.string(),
});
export type ValidateReferralCodeInput = z.infer<typeof ValidateReferralCodeInputSchema>;

const ValidateReferralCodeOutputSchema = z.object({
  isValid: z.boolean(),
  message: z.string(),
  referrerName: z.string().optional(),
  referrerId: z.string().optional(),
});
export type ValidateReferralCodeOutput = z.infer<typeof ValidateReferralCodeOutputSchema>;

export async function validateReferralCode(input: ValidateReferralCodeInput): Promise<ValidateReferralCodeOutput> {
  console.warn("[validateReferralCodeFlow - DEPRECATED]: This flow is deprecated and should not be called. Referral system removed.");
  return {
    isValid: false,
    message: "Referral system is currently not active.",
    referrerName: undefined,
    referrerId: undefined,
  };
}

// The flow definition can be kept but should reflect its deprecated state or be removed
// if no longer referenced (though Genkit might require flow definitions for all exported functions).
// For now, let's make it clear it does nothing useful.
const validateReferralCodeFlow = ai.defineFlow(
  {
    name: 'validateReferralCodeFlow_DEPRECATED',
    inputSchema: ValidateReferralCodeInputSchema,
    outputSchema: ValidateReferralCodeOutputSchema,
  },
  async () => {
    return {
      isValid: false,
      message: "Referral system is currently not active.",
      referrerName: undefined,
      referrerId: undefined,
    };
  }
);
