import express from "express";
import { requireOwner } from "../middleware/authMiddleware.js";
import {
  createEmployee,
  editEmployeeProfile,
  resetEmployeePassword,
  updateEmployeeRates
} from "../controllers/employeeController.js";

const router = express.Router();

// Enforce Owner-only validation for all employee endpoints
router.use(requireOwner);

router.post("/", createEmployee);
router.put("/:uid", editEmployeeProfile);
router.post("/:uid/reset-password", resetEmployeePassword);
router.post("/:uid/rates", updateEmployeeRates);

export default router;
