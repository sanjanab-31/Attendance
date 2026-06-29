import { collection, addDoc, getDocs, query, where } from "firebase/firestore";
import { db } from "./firebase";
import { logActivity } from "./dashboardService";
import { calculateEmployeeSalarySummary, recalculateAndSyncEmployeeSummary } from "./payroll";

/**
 * Validates and logs a new salary payment transaction for an employee.
 * Checks that the amount does not exceed the current net payable balance.
 */
export async function logSalaryPayment(uid, employeeName, paymentData, ownerUser) {
  try {
    const amount = parseFloat(paymentData.amount);
    if (isNaN(amount) || amount <= 0) {
      throw new Error("Payment amount must be a positive number.");
    }

    // 1. Fetch employee's complete ledger to calculate current payable limit
    const [attSnap, paySnap, advSnap] = await Promise.all([
      getDocs(query(collection(db, "attendance"), where("uid", "==", uid))),
      getDocs(query(collection(db, "payments"), where("uid", "==", uid))),
      getDocs(query(collection(db, "advances"), where("uid", "==", uid)))
    ]);

    const attendanceLogs = attSnap.docs.map((doc) => doc.data());
    const payments = paySnap.docs.map((doc) => doc.data());
    const advances = advSnap.docs.map((doc) => doc.data());

    const summary = calculateEmployeeSalarySummary(attendanceLogs, payments, advances);
    
    // Validate that owner isn't paying more than the final payable amount
    if (amount > summary.finalPayable) {
      throw new Error(`Cannot pay more than the final payable balance ($${summary.finalPayable.toFixed(2)}).`);
    }

    // 2. Add payment record to Firestore
    const remainingBalance = summary.finalPayable - amount;
    const paymentRef = collection(db, "payments");
    
    await addDoc(paymentRef, {
      uid,
      name: employeeName,
      date: paymentData.date,
      amount,
      method: paymentData.method, // "Cash", "UPI", "Bank", "Cheque", "Other"
      remarks: paymentData.remarks || "",
      remainingBalance,
      createdAt: new Date().toISOString(),
      createdBy: ownerUser?.name || "Owner"
    });

    // Trigger salary recalculation engine
    await recalculateAndSyncEmployeeSummary(uid);

    // 3. Log System Activity
    await logActivity(
      "Salary Paid",
      `Paid $${amount.toFixed(2)} to Employee ${employeeName} via ${paymentData.method}.`,
      ownerUser?.uid,
      ownerUser?.name
    );

    return { success: true, remainingBalance };
  } catch (error) {
    console.error("logSalaryPayment failed:", error);
    throw error;
  }
}

/**
 * Fetches all logged payments for a specific employee.
 */
export async function getPaymentsForEmployee(uid) {
  try {
    const q = query(collection(db, "payments"), where("uid", "==", uid));
    const snap = await getDocs(q);
    const list = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    // Sort by date descending
    list.sort((a, b) => b.date.localeCompare(a.date));
    return list;
  } catch (error) {
    console.error("Failed to load employee payments:", error);
    throw error;
  }
}
