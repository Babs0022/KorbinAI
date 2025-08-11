
'use server';

import { adminDb, adminAuth } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { HttpsError } from 'firebase-functions/v2/https';
import type { UserReport } from '@/types/feedback';
import { subDays, format, eachDayOfInterval } from 'date-fns';


interface VerificationRequest {
    id: string;
    userId: string;
    tweetUrl: string;
    status: 'pending' | 'approved' | 'denied';
    createdAt: string;
    // User info can be added here
    userName?: string;
    userEmail?: string;
}

/**
 * Checks if a user is an admin by looking them up in the 'admins' collection.
 * @param {string} userId - The UID of the user to check.
 * @returns {Promise<boolean>} True if the user is an admin, false otherwise.
 */
async function isAdmin(userId: string): Promise<boolean> {
    const adminRef = adminDb.collection('admins').doc(userId);
    const adminSnap = await adminRef.get();
    return adminSnap.exists;
}

/**
 * Fetches all pending verification requests.
 * This function should only be callable by an admin user.
 * @param {string} adminUserId - The UID of the user making the request, to verify admin status.
 * @returns {Promise<VerificationRequest[]>} A list of pending requests.
 */
export async function getPendingVerificationRequests(adminUserId: string): Promise<VerificationRequest[]> {
    if (!await isAdmin(adminUserId)) {
        throw new HttpsError('permission-denied', 'You must be an admin to perform this action.');
    }

    const snapshot = await adminDb.collection('verificationRequests')
        .where('status', '==', 'pending')
        .orderBy('createdAt', 'asc')
        .get();

    if (snapshot.empty) {
        return [];
    }

    const requests = await Promise.all(snapshot.docs.map(async (doc) => {
        const data = doc.data();
        let userName = 'N/A';
        let userEmail = 'N/A';

        try {
            const userRecord = await adminAuth.getUser(data.userId);
            userName = userRecord.displayName || 'No display name';
            userEmail = userRecord.email || 'No email';
        } catch (error) {
            console.error(`Could not fetch user data for UID: ${data.userId}`, error);
        }

        return {
            id: doc.id,
            userId: data.userId,
            tweetUrl: data.tweetUrl,
            status: data.status,
            createdAt: data.createdAt?.toDate().toISOString(),
            userName,
            userEmail,
        } as VerificationRequest;
    }));

    return requests;
}


/**
 * Approves a verification request.
 * @param {string} adminUserId - The UID of the admin performing the action.
 * @param {string} requestUserId - The UID of the user whose request is being approved.
 */
export async function approveVerificationRequest(adminUserId: string, requestUserId: string): Promise<void> {
     if (!await isAdmin(adminUserId)) {
        throw new HttpsError('permission-denied', 'You must be an admin to perform this action.');
    }

    const userRef = adminDb.collection('users').doc(requestUserId);
    const requestRef = adminDb.collection('verificationRequests').doc(requestUserId);

    const batch = adminDb.batch();

    // Use set with merge:true to create the doc if it doesn't exist, or update it if it does.
    batch.set(userRef, { isVerified: true }, { merge: true });
    batch.update(requestRef, { status: 'approved', updatedAt: FieldValue.serverTimestamp() });

    await batch.commit();
}

/**
 * Denies a verification request.
 * @param {string} adminUserId - The UID of the admin performing the action.
 * @param {string} requestUserId - The UID of the user whose request is being denied.
 */
export async function denyVerificationRequest(adminUserId: string, requestUserId: string): Promise<void> {
     if (!await isAdmin(adminUserId)) {
        throw new HttpsError('permission-denied', 'You must be an admin to perform this action.');
    }

    const requestRef = adminDb.collection('verificationRequests').doc(requestUserId);
    await requestRef.update({ status: 'denied', updatedAt: FieldValue.serverTimestamp() });
}

/**
 * Fetches all user-submitted reports (feedback and bugs).
 * This function is protected and can only be called by an admin.
 * @param {string} adminUserId - The UID of the admin user making the request.
 * @returns {Promise<UserReport[]>} A list of all user reports.
 */
export async function getAllUserReports(adminUserId: string): Promise<UserReport[]> {
    if (!await isAdmin(adminUserId)) {
        throw new HttpsError('permission-denied', 'You must be an admin to perform this action.');
    }

    const snapshot = await adminDb.collection('userReports')
        .orderBy('createdAt', 'desc')
        .get();

    if (snapshot.empty) {
        return [];
    }
    
    return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate().toISOString(),
        } as UserReport;
    });
}


export interface AdminUserView {
    uid: string;
    email?: string;
    displayName?: string;
    photoURL?: string;
    disabled: boolean;
    creationTime: string;
    isVerified: boolean;
    subscriptionStatus: 'active' | 'inactive';
    subscriptionPlan?: string;
}

export interface UserSignUpData {
    date: string;
    count: number;
}

export interface AdminDashboardData {
    users: AdminUserView[];
    totalProjects: number;
    totalUsers: number;
    totalVerifiedUsers: number;
    totalActiveSubscriptions: number;
    totalChats: number;
    userSignUps: UserSignUpData[];
}

/**
 * Fetches a list of all users and aggregated stats for the admin dashboard.
 * @param {string} adminUserId - The UID of the admin performing the action.
 * @returns {Promise<AdminDashboardData>} An object containing user lists and aggregated data.
 */
export async function getAdminDashboardUsers(adminUserId: string): Promise<AdminDashboardData> {
    if (!await isAdmin(adminUserId)) {
        throw new HttpsError('permission-denied', 'You must be an admin to perform this action.');
    }

    const [listUsersResult, projectsSnapshot, chatsSnapshot] = await Promise.all([
        adminAuth.listUsers(1000),
        adminDb.collection('projects').count().get(),
        adminDb.collection('chatSessions').count().get(),
    ]);

    let totalVerifiedUsers = 0;
    let totalActiveSubscriptions = 0;
    const userSignUpsMap: { [key: string]: number } = {};

    const enrichedUsers = await Promise.all(
        listUsersResult.users.map(async (userRecord) => {
            const userDocRef = adminDb.collection('users').doc(userRecord.uid);
            const subDocRef = adminDb.collection('userSubscriptions').doc(userRecord.uid);
            
            const [userDoc, subDoc] = await Promise.all([userDocRef.get(), subDocRef.get()]);

            const isVerified = userDoc.exists && userDoc.data()?.isVerified === true;
            if (isVerified) totalVerifiedUsers++;

            const subscriptionStatus = (subDoc.exists && subDoc.data()?.status === 'active') ? 'active' : 'inactive';
            if (subscriptionStatus === 'active') totalActiveSubscriptions++;
            
            const subscriptionPlan = subDoc.exists ? subDoc.data()?.planId : 'free';

            const creationDate = format(new Date(userRecord.metadata.creationTime), 'yyyy-MM-dd');
            userSignUpsMap[creationDate] = (userSignUpsMap[creationDate] || 0) + 1;

            return {
                uid: userRecord.uid,
                email: userRecord.email,
                displayName: userRecord.displayName,
                photoURL: userRecord.photoURL,
                disabled: userRecord.disabled,
                creationTime: new Date(userRecord.metadata.creationTime).toISOString(),
                isVerified,
                subscriptionStatus,
                subscriptionPlan,
            };
        })
    );
    
    const sortedUsers = enrichedUsers.sort((a, b) => new Date(b.creationTime).getTime() - new Date(a.creationTime).getTime());
    
    // Generate sign-up data for the last 30 days
    const endDate = new Date();
    const startDate = subDays(endDate, 29);
    const dateRange = eachDayOfInterval({ start: startDate, end: endDate });
    const userSignUps = dateRange.map(date => {
        const formattedDate = format(date, 'yyyy-MM-dd');
        return {
            date: format(date, 'MMM d'),
            count: userSignUpsMap[formattedDate] || 0,
        };
    });

    return {
        users: sortedUsers,
        totalProjects: projectsSnapshot.data().count,
        totalUsers: listUsersResult.users.length,
        totalVerifiedUsers,
        totalActiveSubscriptions,
        totalChats: chatsSnapshot.data().count,
        userSignUps,
    };
}
