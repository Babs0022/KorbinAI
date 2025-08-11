
import {onCall} from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import {Resend} from "resend";
import {adminAuth, adminDb} from "./firebase-admin";

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const SENDER_EMAIL = process.env.SENDER_EMAIL || "team@korbinai.com";

if (!RESEND_API_KEY) {
  logger.warn(
    "RESEND_API_KEY environment variable is not set. Email sending disabled."
  );
}

const resend = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null;

/**
 * Checks if a user is an admin by looking them up in the 'admins' collection.
 * @param {string} userId - The UID of the user to check.
 * @returns {Promise<boolean>} True if the user is an admin, false otherwise.
 */
async function isAdmin(userId: string): Promise<boolean> {
  const adminRef = adminDb.collection("admins").doc(userId);
  const adminSnap = await adminRef.get();
  return adminSnap.exists;
}

export const sendBulkEmail = onCall(
  {region: "us-central1", timeoutSeconds: 540},
  async (request) => {
    if (!resend) {
      throw new Error("Email sending service is not configured.");
    }

    if (!request.auth) {
      throw new Error("Authentication is required.");
    }

    const adminId = request.auth.uid;
    if (!(await isAdmin(adminId))) {
      throw new Error("You must be an admin to perform this action.");
    }

    const {subject, body} = request.data;
    if (!subject || !body) {
      throw new Error("Subject and body are required.");
    }

    try {
      const listUsersResult = await adminAuth.listUsers(1000);
      const emails = listUsersResult.users
        .map((user) => user.email)
        .filter((email): email is string => !!email);

      if (emails.length === 0) {
        logger.info("No users with emails found to send to.");
        return {success: true, message: "No users to email."};
      }

      const {data, error} = await resend.emails.send({
        from: `KorbinAI <${SENDER_EMAIL}>`,
        to: SENDER_EMAIL, // Send to a single address
        bcc: emails, // Use BCC to protect user privacy
        subject: subject,
        html: body,
      });

      if (error) {
        logger.error("Resend API error:", error);
        throw new Error(`Failed to send email: ${error.message}`);
      }

      logger.info(`Bulk email sent successfully to ${emails.length} users.`, {
        resendId: data?.id,
      });
      return {success: true, message: `Email sent to ${emails.length} users.`};
    } catch (err: any) {
      logger.error("Error sending bulk email:", err);
      throw new Error(`An unexpected error occurred: ${err.message}`);
    }
  },
);
