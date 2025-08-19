// src/pages/EmployeeDashboard.jsx
import { useState, useEffect, useContext } from "react";
import axios from "../api/axios";
import { AuthContext } from "../context/AuthContext";
import LeaveTable from "../components/LeaveTable";
import Pagination from "../components/Pagination";
import ApplyLeaveForm from "../components/ApplyLeaveForm";

export default function EmployeeDashboard() {
  const { user } = useContext(AuthContext);
  const [leaves, setLeaves] = useState([]);
  const [balance, setBalance] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchLeaves = async (page = 1) => {
    try {
      const res = await axios.get(`/leaves?page=${page}&limit=5&employeeId=${user.employeeId}`);
      setLeaves(res.data.results);
      setTotalPages(res.data.pages);
    } catch (err) { console.error(err); }
  };

  const fetchBalance = async () => {
    try {
      const res = await axios.get(`/employees/${user.employeeId}/balance`);
      setBalance(res.data.available);
    } catch (err) { console.error(err); }
  };

  useEffect(() => { fetchLeaves(page); fetchBalance(); }, [page]);

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <h1 className="text-3xl font-bold mb-6">Employee Dashboard</h1>

      <div className="mb-6 space-y-3 bg-white p-5 rounded shadow">
        <h2 className="text-xl font-semibold">Leave Balance: {balance}</h2>
        <ApplyLeaveForm onSuccess={() => fetchLeaves(page)} />
      </div>

      <div className="overflow-x-auto rounded shadow">
        <LeaveTable data={leaves} />
      </div>

      <Pagination page={page} totalPages={totalPages} onChange={setPage} />
    </div>
  );
}
