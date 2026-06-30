import { initializeApp, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import fs from "fs";
import path from "path";

const serviceAccountPath = path.resolve("./serviceAccountKey.json");

if (!fs.existsSync(serviceAccountPath)) {
  console.error("Error: serviceAccountKey.json not found in the project root!");
  process.exit(1);
}

const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, "utf8"));

// Initialize Firebase Admin SDK
initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();
const auth = getAuth();

const sampleEmployees = Array.from({ length: 10 }).map((_, i) => ({
  name: `Sample Employee ${i + 1}`,
  age: 20 + i,
  dateOfJoining: new Date().toISOString().split("T")[0],
  phone: `123456789${i}`,
  address: `${i + 1} Sample Street`,
  email: `sample${i + 1}@example.com`,
  password: `password${i + 1}`,
  hourRate: 15 + (i % 5),
  otHourRate: 20 + (i % 5),
}));

async function createSamples() {
  for (const emp of sampleEmployees) {
    try {
      console.log(`Creating ${emp.email}...`);
      
      const userRecord = await auth.createUser({
        email: emp.email,
        password: emp.password,
        displayName: emp.name
      });

      const uid = userRecord.uid;
      const userDocRef = db.collection("users").doc(uid);
      
      await userDocRef.set({
        uid,
        name: emp.name,
        email: emp.email,
        role: "employee",
        age: emp.age,
        dateOfJoining: emp.dateOfJoining,
        phone: emp.phone,
        address: emp.address,
        mustChangePassword: true,
        hourRate: emp.hourRate,
        otHourRate: emp.otHourRate,
        status: "Active",
        createdBy: "System",
        createdAt: new Date().toISOString()
      });

      const rateHistoryRef = userDocRef.collection("rateHistory");
      await rateHistoryRef.add({
        hourRate: emp.hourRate,
        otHourRate: emp.otHourRate,
        effectiveDate: emp.dateOfJoining,
        createdBy: "System",
        createdAt: new Date().toISOString()
      });
      console.log(`Created ${emp.name} successfully.`);
    } catch (e) {
      console.error(`Failed to create ${emp.email}:`, e.message);
    }
  }
  console.log("Done adding 10 sample employees!");
  process.exit(0);
}

createSamples();
