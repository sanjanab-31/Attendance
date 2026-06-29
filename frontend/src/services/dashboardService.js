import { collection, query, where, onSnapshot, addDoc, limit, orderBy } from "firebase/firestore";
import { db } from "./firebase";

/**
 * Subscribes to real-time updates for all employees.
 */
export function subscribeToEmployees(onUpdate, onError) {
  const q = query(collection(db, "users"), where("role", "==", "employee"));
  return onSnapshot(
    q,
    (snapshot) => {
      const employees = snapshot.docs.map((doc) => ({
        uid: doc.id,
        ...doc.data()
      }));
      onUpdate(employees);
    },
    (error) => {
      console.error("Firestore employees subscription failed:", error);
      if (onError) onError(error);
    }
  );
}

/**
 * Subscribes to real-time updates for today's attendance logs.
 */
export function subscribeToTodayAttendance(dateStr, onUpdate, onError) {
  const q = query(collection(db, "attendance"), where("date", "==", dateStr));
  return onSnapshot(
    q,
    (snapshot) => {
      const logs = snapshot.docs.map((doc) => doc.data());
      onUpdate(logs);
    },
    (error) => {
      console.error("Firestore attendance subscription failed:", error);
      if (onError) onError(error);
    }
  );
}

/**
 * Subscribes to real-time updates for the system activities log.
 */
export function subscribeToRecentActivities(onUpdate, onError, limitCount = 5) {
  const q = query(
    collection(db, "activities"),
    orderBy("timestamp", "desc"),
    limit(limitCount)
  );
  return onSnapshot(
    q,
    (snapshot) => {
      const activities = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
      }));
      onUpdate(activities);
    },
    (error) => {
      console.error("Firestore activities subscription failed:", error);
      if (onError) onError(error);
    }
  );
}

/**
 * Subscribes to recent salary payments globally (Owner).
 */
export function subscribeToRecentPayments(onUpdate, onError, limitCount = 5) {
  const q = query(
    collection(db, "payments"),
    orderBy("createdAt", "desc"),
    limit(limitCount)
  );
  return onSnapshot(
    q,
    (snapshot) => {
      const payments = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
      }));
      onUpdate(payments);
    },
    (error) => {
      console.error("Failed to subscribe to global payments:", error);
      if (onError) onError(error);
    }
  );
}

/**
 * Subscribes to recent advances globally (Owner).
 */
export function subscribeToRecentAdvances(onUpdate, onError, limitCount = 5) {
  const q = query(
    collection(db, "advances"),
    orderBy("createdAt", "desc"),
    limit(limitCount)
  );
  return onSnapshot(
    q,
    (snapshot) => {
      const advances = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
      }));
      onUpdate(advances);
    },
    (error) => {
      console.error("Failed to subscribe to global advances:", error);
      if (onError) onError(error);
    }
  );
}

/**
 * Subscribes to recent salary payments for a specific employee.
 */
export function subscribeToEmployeePayments(uid, onUpdate, onError, limitCount = 5) {
  const q = query(
    collection(db, "payments"),
    where("uid", "==", uid),
    orderBy("createdAt", "desc"),
    limit(limitCount)
  );
  return onSnapshot(
    q,
    (snapshot) => {
      const payments = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
      }));
      onUpdate(payments);
    },
    (error) => {
      console.error("Failed to subscribe to employee payments:", error);
      if (onError) onError(error);
    }
  );
}

/**
 * Subscribes to recent advances for a specific employee.
 */
export function subscribeToEmployeeAdvances(uid, onUpdate, onError, limitCount = 5) {
  const q = query(
    collection(db, "advances"),
    where("uid", "==", uid),
    orderBy("createdAt", "desc"),
    limit(limitCount)
  );
  return onSnapshot(
    q,
    (snapshot) => {
      const advances = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
      }));
      onUpdate(advances);
    },
    (error) => {
      console.error("Failed to subscribe to employee advances:", error);
      if (onError) onError(error);
    }
  );
}

/**
 * Helper to log system events securely into Firestore.
 */
export async function logActivity(type, description, userId, userName) {
  try {
    const activityRef = collection(db, "activities");
    await addDoc(activityRef, {
      type,
      description,
      userId: userId || "system",
      userName: userName || "System",
      timestamp: new Date().toISOString(),
      date: new Date().toISOString().split("T")[0],
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });
  } catch (error) {
    console.error("Failed to write to system activity log:", error);
  }
}
