
'use server';

import { adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { HttpsError } from 'firebase-functions/v2/https';
import type { UserCredits } from '@/types/credit';

/**
 * Gets the current credit balance for a user.
 * @param {string} userId - The UID of the user.
 * @returns {Promise<number>} The user's current credit balance. Returns 0 if the user is not found.
 */
export async function getUserCredits(userId: string): Promise<number> {
  const userDocRef = adminDb.collection('users').doc(userId);
  const docSnap = await userDocRef.get();

  if (!docSnap.exists) {
    console.warn(`User document not found for userId: ${userId}`);
    return 0;
  }

  const userData = docSnap.data() as UserCredits;
  return userData.credits ?? 0;
}

/**
 * Deducts a specified amount of credits from a user's balance.
 * Throws an error if the user has insufficient credits.
 * @param {string} userId - The UID of the user.
 * @param {number} amount - The number of credits to deduct. Must be a positive integer.
 */
export async function deductCredits(userId: string, amount: number): Promise<void> {
  if (amount <= 0) {
    throw new HttpsError('invalid-argument', 'Credit deduction amount must be positive.');
  }

  const userDocRef = adminDb.collection('users').doc(userId);

  await adminDb.runTransaction(async (transaction) => {
    const userDoc = await transaction.get(userDocRef);
    if (!userDoc.exists) {
      throw new HttpsError('not-found', `User with ID ${userId} not found.`);
    }

    const currentCredits = (userDoc.data() as UserCredits)?.credits ?? 0;

    if (currentCredits < amount) {
      throw new HttpsError('failed-precondition', 'Insufficient credits for this operation.');
    }

    transaction.update(userDocRef, {
      credits: FieldValue.increment(-amount),
    });
  });

  console.log(`Deducted ${amount} credits from user ${userId}.`);
}
