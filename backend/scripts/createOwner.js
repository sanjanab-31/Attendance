import { initializeApp, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import fs from "fs";
import path from "path";

const serviceAccountPath = path.resolve("./serviceAccountKey.json");

if (!fs.existsSync(serviceAccountPath)) {
  console.error("Error: serviceAccountKey.json not found in the project root!");
  console.log("Please download the service account JSON key from Firebase Console and save it as serviceAccountKey.json");
  process.exit(1);
}

const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, "utf8"));

// Initialize Firebase Admin SDK
initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();
const auth = getAuth();

// Set details for your Owner account
const ownerName = "System Owner";
const ownerEmail = "sanjana.b0831@gmail.com";
const ownerPassword = "sanjuesa@317";

async function createOwner() {
  try {
    console.log(`Attempting to create owner account for: ${ownerEmail}...`);
    
    // Create user in Firebase Auth
    const userRecord = await auth.createUser({
      email: ownerEmail,
      password: ownerPassword,
      displayName: ownerName
    });

    // Create user document in Firestore users collection
    await db.collection("users").doc(userRecord.uid).set({
      uid: userRecord.uid,
      name: ownerName,
      email: ownerEmail,
      role: "owner",
      mustChangePassword: false,
      createdAt: new Date().toISOString()
    });

    console.log("\n--------------------------------------------------");
    console.log(" OWNER ACCOUNT SUCCESSFULLY CREATED! ");
    console.log("--------------------------------------------------");
    console.log(` Email:    ${ownerEmail}`);
    console.log(` Password: ${ownerPassword}`);
    console.log("--------------------------------------------------");
  } catch (error) {
    console.error("Failed to create owner account:", error);
  }
}

createOwner();
