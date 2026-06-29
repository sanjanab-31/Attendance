import { adminAuth, adminDb } from "../firebaseAdmin/index.js";

/**
 * Express middleware to verify Firebase ID Token and enforce Owner-only access.
 */
export async function requireOwner(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    console.warn(`[Security Warning] Access Attempt Denied: No credentials provided for path ${req.path}`);
    return res.status(401).json({ error: "Unauthorized: Missing authentication token." });
  }

  const token = authHeader.split("Bearer ")[1];

  try {
    // 1. Verify token validity
    const decodedToken = await adminAuth.verifyIdToken(token);
    const uid = decodedToken.uid;

    // 2. Fetch user document from Firestore to verify role
    const userDoc = await adminDb.collection("users").doc(uid).get();
    if (!userDoc.exists) {
      console.warn(`[Security Warning] Invalid Access Attempt: User document ${uid} does not exist.`);
      return res.status(403).json({ error: "Forbidden: Account details not found." });
    }

    const userData = userDoc.data();
    if (userData.role !== "owner") {
      console.warn(`[Security Warning] Permission Denied: Non-owner account ${uid} attempted to access administrative routes.`);
      return res.status(403).json({ error: "Forbidden: Owner authorization required." });
    }

    // Attach decoded user metadata to request context
    req.user = {
      uid,
      email: decodedToken.email,
      ...userData
    };

    next();
  } catch (error) {
    console.error(`[Security Warning] Authentication Token Expired or Invalid:`, error.message);
    if (error.code === "auth/id-token-expired") {
      return res.status(401).json({ error: "Unauthorized: Session has expired. Please sign in again." });
    }
    return res.status(401).json({ error: "Unauthorized: Invalid credentials." });
  }
}
