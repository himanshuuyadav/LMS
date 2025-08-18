import mongoose from "mongoose";

const leaveRequestSchema = new mongoose.Schema(
  {
    employeeId: { type: mongoose.Schema.Types.ObjectId, ref: "Employee", required: true, index: true },
    type: { type: String, enum: ["Annual"], default: "Annual" },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    daysRequested: { type: Number, required: true, min: 1 },
    reason: { type: String, maxlength: 500 },
    status: { type: String, enum: ["Pending", "Approved", "Rejected", "Cancelled"], default: "Pending", index: true },
    decidedBy: { type: String },
    decidedAt: { type: Date },
    decisionNote: { type: String }
  },
  { timestamps: true, versionKey: "version" }
);

leaveRequestSchema.index({ employeeId: 1, startDate: 1 });

export default mongoose.model("LeaveRequest", leaveRequestSchema);
