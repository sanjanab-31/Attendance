import { collection, query, where, onSnapshot, doc, orderBy } from "firebase/firestore";
import { db } from "./firebase";

/**
 * Streams the logged-in employee's profile document in real-time.
 */
export function subscribeToEmployeeProfile(uid, onUpdate, onError) {
  const docRef = doc(db, "users", uid);
  return onSnapshot(
    docRef,
    (snap) => {
      if (snap.exists()) {
        onUpdate({ uid: snap.id, ...snap.data() });
      } else {
        onUpdate(null);
      }
    },
    (error) => {
      console.error("subscribeToEmployeeProfile failed:", error);
      if (onError) onError(error);
    }
  );
}

/**
 * Streams the logged-in employee's attendance logs in real-time.
 */
export function subscribeToEmployeeAttendance(uid, onUpdate, onError) {
  const q = query(
    collection(db, "attendance"),
    where("uid", "==", uid),
    orderBy("date", "desc")
  );
  return onSnapshot(
    q,
    (snapshot) => {
      const logs = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      onUpdate(logs);
    },
    (error) => {
      console.error("subscribeToEmployeeAttendance failed:", error);
      if (onError) onError(error);
    }
  );
}

/**
 * Streams the logged-in employee's salary payment history in real-time.
 */
export function subscribeToEmployeePayments(uid, onUpdate, onError) {
  const q = query(
    collection(db, "payments"),
    where("uid", "==", uid),
    orderBy("date", "desc")
  );
  return onSnapshot(
    q,
    (snapshot) => {
      const list = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      onUpdate(list);
    },
    (error) => {
      console.error("subscribeToEmployeePayments failed:", error);
      if (onError) onError(error);
    }
  );
}

/**
 * Streams the logged-in employee's advances history in real-time.
 */
export function subscribeToEmployeeAdvances(uid, onUpdate, onError) {
  const q = query(
    collection(db, "advances"),
    where("uid", "==", uid),
    orderBy("date", "desc")
  );
  return onSnapshot(
    q,
    (snapshot) => {
      const list = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      onUpdate(list);
    },
    (error) => {
      console.error("subscribeToEmployeeAdvances failed:", error);
      if (onError) onError(error);
    }
  );
}

/**
 * Streams the logged-in employee's salary rate revision logs in real-time.
 */
export function subscribeToEmployeeRateHistory(uid, onUpdate, onError) {
  const ratesRef = collection(db, "users", uid, "rateHistory");
  const q = query(ratesRef, orderBy("effectiveDate", "desc"));
  return onSnapshot(
    q,
    (snapshot) => {
      const list = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      onUpdate(list);
    },
    (error) => {
      console.error("subscribeToEmployeeRateHistory failed:", error);
      if (onError) onError(error);
    }
  );
}
