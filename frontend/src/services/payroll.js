import { doc, collection, getDocs, setDoc, query, where, getDoc, updateDoc } from "firebase/firestore";
import { db } from "./firebase";

/**
 * Resolves the salary rate active for an employee on a given date.
 * Finds the rate with the latest effectiveDate that is <= the target date.
 */
export async function getRateForDate(employeeUid, targetDateStr) {
  try {
    const rateHistoryRef = collection(db, "users", employeeUid, "rateHistory");
    const snap = await getDocs(rateHistoryRef);
    
    if (snap.empty) {
      // Get the default rate from the user document as a fallback
      const userRef = doc(db, "users", employeeUid);
      const userSnap = await getDoc(userRef).catch(() => null);
      if (userSnap && userSnap.exists()) {
        const u = userSnap.data();
        return {
          hourRate: u.hourRate || 0,
          otHourRate: u.otHourRate || 0
        };
      }
      return { hourRate: 0, otHourRate: 0 };
    }

    const rates = snap.docs.map(doc => doc.data());
    // Sort rate history entries by effectiveDate ascending
    rates.sort((a, b) => a.effectiveDate.localeCompare(b.effectiveDate));

    let activeRate = rates[0]; 
    for (const rate of rates) {
      if (rate.effectiveDate <= targetDateStr) {
        activeRate = rate;
      } else {
        break; // stop when a future effective date is seen
      }
    }

    return {
      hourRate: parseFloat(activeRate.hourRate) || 0,
      otHourRate: parseFloat(activeRate.otHourRate) || 0
    };
  } catch (error) {
    console.error("Error fetching rate for date:", error);
    throw error;
  }
}

/**
 * Computes all salary ledger running balances for an employee.
 */
export function calculateEmployeeSalarySummary(attendanceLogs = [], payments = [], advances = []) {
  const totalEarned = attendanceLogs.reduce((sum, log) => {
    return sum + (parseFloat(log.earnings) || 0);
  }, 0);

  const totalPaid = payments.reduce((sum, pay) => {
    return sum + (parseFloat(pay.amount) || 0);
  }, 0);

  const totalAdvance = advances.reduce((sum, adv) => {
    return sum + (parseFloat(adv.amount) || 0);
  }, 0);

  const pendingSalary = totalEarned - totalPaid;
  const finalPayable = pendingSalary - totalAdvance;

  return {
    totalEarned,
    totalPaid,
    totalAdvance,
    pendingSalary,
    finalPayable
  };
}

/**
 * Queries all records for an employee, computes current running totals,
 * and updates their primary user document in Firestore to keep listings fully optimized.
 */
export async function recalculateAndSyncEmployeeSummary(uid) {
  try {
    // 1. Fetch all raw datasets
    const [attSnap, paySnap, advSnap] = await Promise.all([
      getDocs(query(collection(db, "attendance"), where("uid", "==", uid))),
      getDocs(query(collection(db, "payments"), where("uid", "==", uid))),
      getDocs(query(collection(db, "advances"), where("uid", "==", uid)))
    ]);

    const attendanceLogs = attSnap.docs.map((doc) => doc.data());
    const payments = paySnap.docs.map((doc) => doc.data());
    const advances = advSnap.docs.map((doc) => doc.data());

    // 2. Compute summaries
    const summary = calculateEmployeeSalarySummary(attendanceLogs, payments, advances);

    // 3. Update the primary user document
    const userRef = doc(db, "users", uid);
    await updateDoc(userRef, {
      totalEarned: summary.totalEarned,
      totalPaid: summary.totalPaid,
      totalAdvance: summary.totalAdvance,
      pendingSalary: summary.pendingSalary,
      finalPayable: summary.finalPayable,
      lastCalculatedAt: new Date().toISOString()
    });

    return summary;
  } catch (error) {
    console.error(`Failed to recalculate and sync summary for user ${uid}:`, error);
    throw error;
  }
}
