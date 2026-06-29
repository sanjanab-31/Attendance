import { collection, addDoc, getDocs, query, where } from "firebase/firestore";
import { db } from "./firebase";
import { logActivity } from "./dashboardService";
import { recalculateAndSyncEmployeeSummary } from "./payroll";

/**
 * Validates and records a new salary advance transaction for an employee.
 */
export async function logSalaryAdvance(uid, employeeName, advanceData, ownerUser) {
  try {
    const amount = parseFloat(advanceData.amount);
    if (isNaN(amount) || amount <= 0) {
      throw new Error("Advance amount must be a positive number.");
    }

    const advanceRef = collection(db, "advances");
    await addDoc(advanceRef, {
      uid,
      name: employeeName,
      date: advanceData.date,
      amount,
      method: advanceData.method || "Cash", 
      remarks: advanceData.remarks || "",
      createdAt: new Date().toISOString(),
      createdBy: ownerUser?.name || "Owner"
    });

    // Trigger salary recalculation engine
    await recalculateAndSyncEmployeeSummary(uid);

    // Log System Activity
    await logActivity(
      "Advance Added",
      `Given advance of $${amount.toFixed(2)} to Employee ${employeeName} via ${advanceData.method || "Cash"}.`,
      ownerUser?.uid,
      ownerUser?.name
    );

    return { success: true };
  } catch (error) {
    console.error("logSalaryAdvance failed:", error);
    throw error;
  }
}

/**
 * Fetches all advance logs for a specific employee.
 */
export async function getAdvancesForEmployee(uid) {
  try {
    const q = query(collection(db, "advances"), where("uid", "==", uid));
    const snap = await getDocs(q);
    const list = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    list.sort((a, b) => b.date.localeCompare(a.date));
    return list;
  } catch (error) {
    console.error("Failed to load employee advances:", error);
    throw error;
  }
}
