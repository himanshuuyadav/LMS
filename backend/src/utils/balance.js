import mongoose from "mongoose";
import LeaveLedger from "../models/LeaveLedger.js";
import LeaveRequest from "../models/LeaveRequest.js";

export async function getBalance(employeeId, policy = "conservative") {
  const empId = new mongoose.Types.ObjectId(employeeId);

  // Grants vs approvals (approvals are negative deltas)
  const agg = await LeaveLedger.aggregate([
    { $match: { employeeId: empId } },
    {
      $group: {
        _id: null,
        grants: {
          $sum: {
            $cond: [{ $in: ["$source", ["InitialGrant", "ManualAdjustment"]] }, "$deltaDays", 0]
          }
        },
        approvals: {
          $sum: { $cond: [{ $eq: ["$source", "Approval"] }, "$deltaDays", 0] }
        }
      }
    }
  ]);

  const grants = agg[0]?.grants ?? 0;
  const approved = -(agg[0]?.approvals ?? 0);

  let pending = 0;
  if (policy === "conservative") {
    const p = await LeaveRequest.aggregate([
      { $match: { employeeId: empId, status: "Pending" } },
      { $group: { _id: null, days: { $sum: "$daysRequested" } } }
    ]);
    pending = p[0]?.days ?? 0;
  }

  const available = grants - approved - (policy === "conservative" ? pending : 0);
  return { grants, approved, pending, available };
}
