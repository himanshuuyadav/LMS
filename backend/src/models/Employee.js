import mongoose from "mongoose";

const employeeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 80 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    department: { type: String, required: true, trim: true },
    joiningDate: { type: Date, required: true },
    employmentStatus: { type: String, enum: ["Active", "Inactive"], default: "Active" },
    terminationDate: { type: Date },
    initialLeaveBalance: { type: Number, default: 20, min: 0 }
  },
  { timestamps: true }
);

employeeSchema.index({ email: 1 }, { unique: true });
employeeSchema.index({ joiningDate: 1 });

export default mongoose.model("Employee", employeeSchema);
