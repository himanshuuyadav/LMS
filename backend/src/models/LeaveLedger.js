import mongoose from "mongoose";

const ledgerSchema = new mongoose.Schema(
  {
    employeeId: { type: mongoose.Schema.Types.ObjectId, ref: "Employee", required: true, index: true },
    source: { type: String, enum: ["InitialGrant", "ManualAdjustment", "Approval", "Reversal"], required: true },
    leaveRequestId: { type: mongoose.Schema.Types.ObjectId, ref: "LeaveRequest" },
    deltaDays: { type: Number, required: true },
    note: { type: String }
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

ledgerSchema.index({ employeeId: 1, createdAt: 1 });

export default mongoose.model("LeaveLedger", ledgerSchema);
