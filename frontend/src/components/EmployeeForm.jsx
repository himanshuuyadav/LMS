// src/components/EmployeeForm.jsx
import { useState } from "react";
import axios from "../api/axios";

export default function EmployeeForm({ onSuccess }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [department, setDepartment] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("Employee");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async e => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await axios.post("/auth/register", { name, email, department, password, role });
      setName(""); setEmail(""); setDepartment(""); setPassword(""); setRole("Employee");
      if (onSuccess) onSuccess();
    } catch (err) {
      setError(err.response?.data?.message || "Error creating employee");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-4 rounded shadow space-y-2">
      {error && <div className="text-red-500">{error}</div>}
      <input type="text" placeholder="Name" value={name} onChange={e=>setName(e.target.value)}
        className="w-full p-2 border rounded" required />
      <input type="email" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)}
        className="w-full p-2 border rounded" required />
      <input type="text" placeholder="Department" value={department} onChange={e=>setDepartment(e.target.value)}
        className="w-full p-2 border rounded" required />
      <input type="password" placeholder="Password" value={password} onChange={e=>setPassword(e.target.value)}
        className="w-full p-2 border rounded" required />
      <select value={role} onChange={e=>setRole(e.target.value)} className="w-full p-2 border rounded">
        <option value="Employee">Employee</option>
        <option value="HR">HR</option>
      </select>
      <button type="submit" className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700">
        {loading ? "Creating..." : "Create Employee"}
      </button>
    </form>
  );
}
