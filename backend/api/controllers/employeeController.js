import { adminAuth, adminDb } from "../firebaseAdmin/index.js";

export async function createEmployee(req, res) {
  const {
    name,
    age,
    dateOfJoining,
    phone,
    address,
    email,
    password,
    hourRate,
    otHourRate,
    createdBy
  } = req.body;

  if (
    !name ||
    !age ||
    !dateOfJoining ||
    !phone ||
    !address ||
    !email ||
    !password ||
    hourRate === undefined ||
    otHourRate === undefined
  ) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const userRecord = await adminAuth.createUser({
      email,
      password,
      displayName: name
    });

    const uid = userRecord.uid;

    const userDocRef = adminDb.collection("users").doc(uid);
    await userDocRef.set({
      uid,
      name,
      email,
      role: "employee",
      age: parseInt(age, 10),
      dateOfJoining,
      phone,
      address,
      mustChangePassword: true,
      hourRate: parseFloat(hourRate),
      otHourRate: parseFloat(otHourRate),
      status: "Active",
      createdBy: createdBy || "owner",
      createdAt: new Date().toISOString()
    });

    const rateHistoryRef = userDocRef.collection("rateHistory");
    await rateHistoryRef.add({
      hourRate: parseFloat(hourRate),
      otHourRate: parseFloat(otHourRate),
      effectiveDate: dateOfJoining,
      createdBy: createdBy || "owner",
      createdAt: new Date().toISOString()
    });

    return res.status(201).json({
      uid,
      name,
      email,
      role: "employee",
      message: "Employee account created successfully"
    });
  } catch (error) {
    console.error("Error creating employee:", error);
    return res.status(500).json({ error: error.message || "Failed to create employee account" });
  }
}

export async function editEmployeeProfile(req, res) {
  const { uid } = req.params;
  const { name, age, dateOfJoining, phone, address } = req.body;

  try {
    const userDocRef = adminDb.collection("users").doc(uid);
    const userDoc = await userDocRef.get();
    
    if (!userDoc.exists) {
      return res.status(404).json({ error: "Employee not found" });
    }

    const updates = {};
    if (name !== undefined) updates.name = name;
    if (age !== undefined) updates.age = parseInt(age, 10);
    if (dateOfJoining !== undefined) updates.dateOfJoining = dateOfJoining;
    if (phone !== undefined) updates.phone = phone;
    if (address !== undefined) updates.address = address;

    await userDocRef.update(updates);

    if (name !== undefined) {
      await adminAuth.updateUser(uid, { displayName: name });
    }

    return res.json({ message: "Employee profile updated successfully" });
  } catch (error) {
    console.error("Error updating employee profile:", error);
    return res.status(500).json({ error: error.message || "Failed to update employee profile" });
  }
}

export async function resetEmployeePassword(req, res) {
  const { uid } = req.params;
  const { password } = req.body;

  if (!password) {
    return res.status(400).json({ error: "Temporary password is required" });
  }

  try {
    await adminAuth.updateUser(uid, { password });

    const userDocRef = adminDb.collection("users").doc(uid);
    const userDoc = await userDocRef.get();

    if (!userDoc.exists) {
      return res.status(404).json({ error: "Employee not found" });
    }

    await userDocRef.update({ mustChangePassword: true });

    return res.json({ message: "Employee password reset successfully" });
  } catch (error) {
    console.error("Error resetting password:", error);
    return res.status(500).json({ error: error.message || "Failed to reset password" });
  }
}

export async function updateEmployeeRates(req, res) {
  const { uid } = req.params;
  const { hourRate, otHourRate, effectiveDate } = req.body;

  if (hourRate === undefined || otHourRate === undefined || !effectiveDate) {
    return res.status(400).json({ error: "Missing rate details or effective date" });
  }

  try {
    const userDocRef = adminDb.collection("users").doc(uid);
    const userDoc = await userDocRef.get();

    if (!userDoc.exists) {
      return res.status(404).json({ error: "Employee not found" });
    }

    const rateHistoryRef = userDocRef.collection("rateHistory");
    await rateHistoryRef.add({
      hourRate: parseFloat(hourRate),
      otHourRate: parseFloat(otHourRate),
      effectiveDate,
      createdAt: new Date().toISOString()
    });

    return res.json({ message: "Salary rates updated successfully" });
  } catch (error) {
    console.error("Error updating salary rates:", error);
    return res.status(500).json({ error: error.message || "Failed to update salary rates" });
  }
}
