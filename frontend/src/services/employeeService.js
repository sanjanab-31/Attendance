import { collection, query, where, onSnapshot, doc, getDoc } from "firebase/firestore";
import { db, auth } from "./firebase";
import { logActivity } from "./dashboardService";

/**
 * Subscribes to real-time updates for all employees.
 * Enables automatic listing updates without page refreshes.
 */
export function subscribeToEmployeesList(onUpdate, onError) {
  const q = query(collection(db, "users"), where("role", "==", "employee"));
  return onSnapshot(
    q,
    (snapshot) => {
      const list = snapshot.docs.map((doc) => ({
        uid: doc.id,
        ...doc.data()
      }));
      onUpdate(list);
    },
    (error) => {
      console.error("Failed to subscribe to employees list:", error);
      if (onError) onError(error);
    }
  );
}

/**
 * Fetches a single employee document from Firestore.
 */
export async function getEmployeeById(uid) {
  try {
    const docRef = doc(db, "users", uid);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) {
      throw new Error("Employee record not found.");
    }
    return { uid: docSnap.id, ...docSnap.data() };
  } catch (error) {
    console.error("Error fetching employee by ID:", error);
    throw error;
  }
}

/**
 * Creates a new employee by invoking the backend registration API.
 * Automatically logs a system activity event upon success.
 */
export async function createEmployee(employeeData, ownerUser) {
  try {
    const token = await auth.currentUser?.getIdToken();
    const payload = {
      ...employeeData,
      createdBy: ownerUser?.name || "Owner"
    };

    const response = await fetch("/api/employees", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "Failed to create employee account.");
    }

    // Log Activity
    await logActivity(
      "Employee Created",
      `Employee ${employeeData.name} registered by Owner ${ownerUser?.name || "Owner"}.`,
      ownerUser?.uid,
      ownerUser?.name
    );

    return data;
  } catch (error) {
    console.error("createEmployee service failed:", error);
    throw error;
  }
}

/**
 * Updates an employee's profile details.
 */
export async function updateEmployee(uid, profileData, ownerUser) {
  try {
    const token = await auth.currentUser?.getIdToken();
    const response = await fetch(`/api/employees/${uid}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify(profileData)
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "Failed to update employee details.");
    }

    // Log Activity
    await logActivity(
      "Employee Updated",
      `Employee profile ${profileData.name} details updated by Owner.`,
      ownerUser?.uid,
      ownerUser?.name
    );

    return data;
  } catch (error) {
    console.error("updateEmployee service failed:", error);
    throw error;
  }
}

/**
 * Resets an employee's password to a temporary password.
 */
export async function resetEmployeePassword(uid, tempPassword, employeeName, ownerUser) {
  try {
    const token = await auth.currentUser?.getIdToken();
    const response = await fetch(`/api/employees/${uid}/reset-password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({ password: tempPassword })
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "Failed to reset password.");
    }

    // Log Activity
    await logActivity(
      "Password Reset",
      `Password reset triggered for Employee ${employeeName} by Owner.`,
      ownerUser?.uid,
      ownerUser?.name
    );

    return data;
  } catch (error) {
    console.error("resetEmployeePassword service failed:", error);
    throw error;
  }
}

import { recalculateAndSyncEmployeeSummary } from "./payroll";

/**
 * Revise employee salary rates with effective date.
 */
export async function updateEmployeeRates(uid, rateData, employeeName, ownerUser) {
  try {
    const token = await auth.currentUser?.getIdToken();
    const response = await fetch(`/api/employees/${uid}/rates`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify(rateData)
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "Failed to update rates.");
    }

    // Trigger salary recalculation engine
    await recalculateAndSyncEmployeeSummary(uid);

    // Log Activity
    await logActivity(
      "Rate Changed",
      `Salary rates revised for Employee ${employeeName} (Reg: $${rateData.hourRate}, OT: $${rateData.otHourRate}).`,
      ownerUser?.uid,
      ownerUser?.name
    );

    return data;
  } catch (error) {
    console.error("updateEmployeeRates service failed:", error);
    throw error;
  }
}
