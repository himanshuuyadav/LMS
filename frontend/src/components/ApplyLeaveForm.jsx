// src/components/ApplyLeaveForm.jsx
import { useState } from "react";
import axios from "../api/axios";

export default function ApplyLeaveForm({ onSuccess }) {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async e => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      await axios.post(
        "/leaves",
        { startDate, endDate, reason },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setStartDate("");
      setEndDate("");
      setReason("");
      if (onSuccess) onSuccess(); // refresh table
    } catch (err) {
      setError(err.response?.data?.message || "Failed to apply leave");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-4 rounded shadow mb-4">
      <h3 className="text-xl font-semibold mb-2">Apply Leave</h3>
      {error && <div className="text-red-500 mb-2">{error}</div>}
      <div className="flex flex-col mb-2">
        <label>Start Date</label>
        <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="border p-1 rounded"/>
      </div>
      <div className="flex flex-col mb-2">
        <label>End Date</label>
        <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="border p-1 rounded"/>
      </div>
      <div className="flex flex-col mb-2">
        <label>Reason</label>
        <textarea value={reason} onChange={e => setReason(e.target.value)} className="border p-1 rounded"/>
      </div>
      <button type="submit" disabled={loading} className="bg-blue-600 text-white p-2 rounded hover:bg-blue-700">
        {loading ? "Applying..." : "Apply Leave"}
      </button>
    </form>
  );
}
