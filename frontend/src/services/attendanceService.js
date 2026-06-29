import { collection, query, where, onSnapshot, doc, getDocs, updateDoc, addDoc, setDoc } from "firebase/firestore";
import { db } from "./firebase";
import { logActivity } from "./dashboardService";

/**
 * Fetches all active employees to list on the attendance page.
 */
export async function getActiveEmployees() {
  try {
    const q = query(collection(db, "users"), where("role", "==", "employee"));
    const snap = await getDocs(q);
    return snap.docs.map((doc) => ({
      uid: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error("Failed to load active employees for attendance:", error);
    throw error;
  }
}

/**
 * Fetches all attendance records logged for a specific date.
 */
export async function getAttendanceForDate(dateStr) {
  try {
    const q = query(collection(db, "attendance"), where("date", "==", dateStr));
    const snap = await getDocs(q);
    const recordsMap = {};
    snap.forEach((doc) => {
      const data = doc.data();
      recordsMap[data.uid] = { id: doc.id, ...data };
    });
    return recordsMap;
  } catch (error) {
    console.error("Failed to query attendance for selected date:", error);
    throw error;
  }
}

/**
 * Subscribes to real-time updates for ALL attendance logs across all employees.
 */
export function subscribeToAllAttendance(onUpdate, onError) {
  const q = collection(db, "attendance");
  return onSnapshot(
    q,
    (snapshot) => {
      const list = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
      }));
      list.sort((a, b) => b.date.localeCompare(a.date));
      onUpdate(list);
    },
    (error) => {
      console.error("Failed to subscribe to all attendance records:", error);
      if (onError) onError(error);
    }
  );
}

/**
 * Fetches all attendance logs for a specific employee.
 */
export async function getAttendanceByEmployee(uid) {
  try {
    const q = query(collection(db, "attendance"), where("uid", "==", uid));
    const snap = await getDocs(q);
    return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("Error fetching attendance by employee UID:", error);
    throw error;
  }
}

/**
 * Computes attendance summary metrics (Days Worked, Holidays, Hours, OT Hours)
 * from a list of raw attendance logs. Reusable across profile views and reports.
 */
export function calculateAttendanceSummary(attendanceLogs) {
  let totalDaysWorked = 0;
  let totalHolidays = 0;
  let totalHoursWorked = 0;
  let totalOTHours = 0;

  attendanceLogs.forEach((log) => {
    if (log.isHoliday) {
      totalHolidays += 1;
    } else {
      const wh = parseFloat(log.workingHours) || 0;
      const ot = parseFloat(log.otHours) || 0;
      if (wh > 0 || ot > 0) {
        totalDaysWorked += 1;
      }
      totalHoursWorked += wh;
      totalOTHours += ot;
    }
  });

  return {
    totalDaysWorked,
    totalHolidays,
    totalHoursWorked,
    totalOTHours
  };
}

import { getRateForDate, recalculateAndSyncEmployeeSummary } from "./payroll";

/**
 * Saves a new daily attendance record. If it already exists, setDoc will overwrite/update
 * it, preventing duplicate rows for the same employee on the same date.
 */
export async function saveAttendanceRecord(uid, dateStr, record, ownerUser) {
  try {
    const docId = `${uid}_${dateStr}`;
    const docRef = doc(db, "attendance", docId);
    
    // Resolve rates active on this specific attendance date
    const { hourRate, otHourRate } = await getRateForDate(uid, dateStr);
    
    const payload = {
      uid,
      name: record.name,
      date: dateStr,
      hourRate,
      otHourRate,
      workingHours: parseFloat(record.workingHours),
      otHours: parseFloat(record.otHours),
      isHoliday: record.isHoliday,
      remarks: record.remarks || "",
      earnings: record.isHoliday ? 0 : (parseFloat(record.workingHours) * hourRate) + (parseFloat(record.otHours) * otHourRate),
      createdAt: new Date().toISOString(),
      createdBy: ownerUser?.name || "Owner",
      lastEditedDate: new Date().toISOString().split("T")[0],
      lastEditedBy: ownerUser?.name || "Owner",
      updatedAt: new Date().toISOString()
    };

    await setDoc(docRef, payload);

    // Trigger salary recalculation engine
    await recalculateAndSyncEmployeeSummary(uid);

    // Log Activity
    await logActivity(
      "Attendance Added",
      `Logged attendance for ${record.name} on ${dateStr} (Hrs: ${record.workingHours}).`,
      ownerUser?.uid,
      ownerUser?.name
    );
  } catch (error) {
    console.error("saveAttendanceRecord service failed:", error);
    throw error;
  }
}

/**
 * Updates an existing attendance record, tracking detailed modifications in a history log.
 */
export async function updateAttendanceWithHistory(docId, oldRecord, newRecord, ownerUser) {
  try {
    const docRef = doc(db, "attendance", docId);

    const payload = {
      workingHours: parseFloat(newRecord.workingHours),
      otHours: parseFloat(newRecord.otHours),
      isHoliday: newRecord.isHoliday,
      remarks: newRecord.remarks || "",
      earnings: newRecord.isHoliday ? 0 : (parseFloat(newRecord.workingHours) * parseFloat(oldRecord.hourRate)) + (parseFloat(newRecord.otHours) * parseFloat(oldRecord.otHourRate)),
      lastEditedDate: new Date().toISOString().split("T")[0],
      lastEditedBy: ownerUser?.name || "Owner",
      updatedAt: new Date().toISOString()
    };

    await updateDoc(docRef, payload);

    // Save history audit log in subcollection: attendance/{docId}/history
    const historyRef = collection(db, "attendance", docId, "history");
    await addDoc(historyRef, {
      oldValue: {
        workingHours: oldRecord.workingHours,
        otHours: oldRecord.otHours,
        isHoliday: oldRecord.isHoliday,
        remarks: oldRecord.remarks || ""
      },
      newValue: {
        workingHours: payload.workingHours,
        otHours: payload.otHours,
        isHoliday: payload.isHoliday,
        remarks: payload.remarks
      },
      editedBy: ownerUser?.name || "Owner",
      timestamp: new Date().toISOString(),
      date: new Date().toISOString().split("T")[0],
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });

    // Trigger salary recalculation engine
    await recalculateAndSyncEmployeeSummary(oldRecord.uid);

    const activityType = newRecord.isHoliday && !oldRecord.isHoliday ? "Holiday Marked" : "Attendance Updated";
    await logActivity(
      activityType,
      `Updated attendance for ${oldRecord.name} on ${oldRecord.date} by ${ownerUser?.name || "Owner"}.`,
      ownerUser?.uid,
      ownerUser?.name
    );
  } catch (error) {
    console.error("updateAttendanceWithHistory failed:", error);
    throw error;
  }
}
