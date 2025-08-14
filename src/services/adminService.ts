
'use server';

import { adminDb, adminAuth } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { HttpsError } from 'firebase-functions/v2/https';
import type { UserReport } from '@/types/feedback';
import { subDays, format, eachDayOfInterval, startOfDay } from 'date-fns';


interface VerificationRequest {
    id: string;
    userId: string;
    tweetUrl: string;
    status: 'pending' | 'approved' | 'denied';
    createdAt: string;
    // User info can be added here
    userName?: string;
    userEmail?: string;
    denialReason?: string;
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
 * Denies a verification request, optionally with a reason.
 * @param {string} adminUserId - The UID of the admin performing the action.
 * @param {string} requestUserId - The UID of the user whose request is being denied.
 * @param {string} [reason] - An optional reason for the denial.
 */
export async function denyVerificationRequest(adminUserId: string, requestUserId: string, reason?: string): Promise<void> {
     if (!await isAdmin(adminUserId)) {
        throw new HttpsError('permission-denied', 'You must be an admin to perform this action.');
    }

    const requestRef = adminDb.collection('verificationRequests').doc(requestUserId);
    const updateData: { status: string; updatedAt: FirebaseFirestore.FieldValue; denialReason?: string } = {
        status: 'denied',
        updatedAt: FieldValue.serverTimestamp(),
    };
    
    if (reason && reason.trim() !== '') {
        updateData.denialReason = reason;
    }

    await requestRef.update(updateData);
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
    credits: number;
}

export interface TimeSeriesData {
    date: string;
    [key: string]: number | string; // e.g., { date: 'Jan 1', users: 5, projects: 10 }
}

export interface AdminDashboardData {
    users: AdminUserView[];
    totalProjects: number;
    totalUsers: number;
    totalVerifiedUsers: number;
    totalActiveSubscriptions: number;
    totalChats: number;
    totalCreditsUsed: number;
    timeSeriesData: TimeSeriesData[];
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
    
    const endDate = new Date();
    const startDate = subDays(endDate, 29);
    
    const [listUsersResult, projectsSnapshot, chatsSnapshot] = await Promise.all([
        adminAuth.listUsers(1000),
        adminDb.collection('projects').where('createdAt', '>=', startDate).get(),
        adminDb.collection('chatSessions').where('createdAt', '>=', startDate).get(),
    ]);

    let totalVerifiedUsers = 0;
    let totalActiveSubscriptions = 0;
    let totalCreditsUsed = 0;
    
    const timeSeriesMap: { [key: string]: { users: number, projects: number, chats: number } } = {};

    const enrichedUsers = await Promise.all(
        listUsersResult.users.map(async (userRecord) => {
            const userDocRef = adminDb.collection('users').doc(userRecord.uid);
            const subDocRef = adminDb.collection('userSubscriptions').doc(userRecord.uid);
            
            const [userDoc, subDoc] = await Promise.all([userDocRef.get(), subDocRef.get()]);

            const userData = userDoc.exists ? userDoc.data() : null;

            const isVerified = userData?.isVerified === true;
            if (isVerified) totalVerifiedUsers++;
            
            const credits = userData?.credits ?? 0;
            totalCreditsUsed += (userData?.creditsUsed ?? 0);

            const subscriptionStatus = (subDoc.exists && subDoc.data()?.status === 'active') ? 'active' : 'inactive';
            if (subscriptionStatus === 'active') totalActiveSubscriptions++;
            
            const subscriptionPlan = subDoc.exists ? subDoc.data()?.planId : 'free';

            const creationDate = new Date(userRecord.metadata.creationTime);
            if (creationDate >= startDate) {
                const formattedDate = format(creationDate, 'yyyy-MM-dd');
                if (!timeSeriesMap[formattedDate]) timeSeriesMap[formattedDate] = { users: 0, projects: 0, chats: 0 };
                timeSeriesMap[formattedDate].users++;
            }

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
                credits,
            };
        })
    );
    
    projectsSnapshot.docs.forEach(doc => {
        const creationDate = (doc.data().createdAt as admin.firestore.Timestamp).toDate();
        const formattedDate = format(creationDate, 'yyyy-MM-dd');
        if (!timeSeriesMap[formattedDate]) timeSeriesMap[formattedDate] = { users: 0, projects: 0, chats: 0 };
        timeSeriesMap[formattedDate].projects++;
    });

    chatsSnapshot.docs.forEach(doc => {
        const creationDate = (doc.data().createdAt as admin.firestore.Timestamp).toDate();
        const formattedDate = format(creationDate, 'yyyy-MM-dd');
        if (!timeSeriesMap[formattedDate]) timeSeriesMap[formattedDate] = { users: 0, projects: 0, chats: 0 };
        timeSeriesMap[formattedDate].chats++;
    });
    
    const sortedUsers = enrichedUsers.sort((a, b) => new Date(b.creationTime).getTime() - new Date(a.creationTime).getTime());
    
    const dateRange = eachDayOfInterval({ start: startDate, end: endDate });
    const timeSeriesData = dateRange.map(date => {
        const formattedDate = format(date, 'yyyy-MM-dd');
        const data = timeSeriesMap[formattedDate] || { users: 0, projects: 0, chats: 0 };
        return {
            date: format(date, 'MMM d'),
            ...data
        };
    });

    const totalProjects = (await adminDb.collection('projects').count().get()).data().count;
    const totalChats = (await adminDb.collection('chatSessions').count().get()).data().count;

    return {
        users: sortedUsers,
        totalProjects,
        totalUsers: listUsersResult.users.length,
        totalVerifiedUsers,
        totalActiveSubscriptions,
        totalChats,
        totalCreditsUsed,
        timeSeriesData,
    };
}


/**
 * Adds a specified amount of credits to a user's account.
 * This function should only be callable by an admin user.
 * @param {string} adminUserId - The UID of the admin performing the action.
 * @param {string} targetUserId - The UID of the user to receive credits.
 * @param {number} amount - The number of credits to add.
 */
export async function addCreditsToUser(adminUserId: string, targetUserId: string, amount: number): Promise<void> {
    if (!await isAdmin(adminUserId)) {
        throw new HttpsError('permission-denied', 'You must be an admin to perform this action.');
    }
    
    if (typeof amount !== 'number' || amount <= 0) {
        throw new HttpsError('invalid-argument', 'Credit amount must be a positive number.');
    }

    const userDocRef = adminDb.collection('users').doc(targetUserId);

    // Use `set` with `merge: true` to prevent "not-found" errors.
    // This will create the document with the fields if it doesn't exist.
    await userDocRef.set({
        credits: FieldValue.increment(amount),
    }, { merge: true });
}


/**
 * Adds credits to all users in the system.
 * This function should only be callable by an admin user.
 * @param {string} adminUserId - The UID of the admin performing the action.
 * @param {number} amount - The number of credits to add to each user.
 */
export async function addCreditsToAllUsers(adminUserId: string, amount: number): Promise<void> {
    if (!await isAdmin(adminUserId)) {
        throw new HttpsError('permission-denied', 'You must be an admin to perform this action.');
    }

    if (typeof amount !== 'number' || amount <= 0) {
        throw new HttpsError('invalid-argument', 'Credit amount must be a positive number.');
    }

    const BATCH_SIZE = 499;
    let pageToken: string | undefined = undefined;

    while (true) {
        const listUsersResult = await adminAuth.listUsers(BATCH_SIZE, pageToken);
        if (listUsersResult.users.length === 0) {
            break;
        }

        const batch = adminDb.batch();
        listUsersResult.users.forEach(userRecord => {
            const userDocRef = adminDb.collection('users').doc(userRecord.uid);
            // Use set with merge: true to avoid "not-found" errors.
            batch.set(userDocRef, {
                credits: FieldValue.increment(amount),
            }, { merge: true });
        });

        await batch.commit();

        pageToken = listUsersResult.pageToken;
        if (!pageToken) {
            break;
        }
    }
}
