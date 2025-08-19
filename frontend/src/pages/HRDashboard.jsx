// src/pages/HRDashboard.jsx
import { useState, useEffect } from "react";
import axios from "../api/axios";
import EmployeeForm from "../components/EmployeeForm";
import LeaveTable from "../components/LeaveTable";
import LedgerTable from "../components/LedgerTable";
import Pagination from "../components/Pagination";

export default function HRDashboard() {
  const [activeTab, setActiveTab] = useState("employees");
  const [employees, setEmployees] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [ledger, setLedger] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 10;

  const fetchEmployees = async (page = 1) => {
    try {
      const res = await axios.get(`/employees?page=${page}&limit=${limit}`);
      setEmployees(res.data.results || res.data);
      setTotalPages(res.data.pages || 1);
    } catch (err) { console.error(err); }
  };

  const fetchLeaves = async (page = 1) => {
    try {
      const res = await axios.get(`/leaves?page=${page}&limit=${limit}`);
      setLeaves(res.data.results);
      setTotalPages(res.data.pages);
    } catch (err) { console.error(err); }
  };

  const fetchLedger = async (page = 1) => {
    try {
      const res = await axios.get(`/ledger?page=${page}&limit=${limit}`);
      setLedger(res.data.results);
      setTotalPages(res.data.pages);
    } catch (err) { console.error(err); }
  };

  useEffect(() => {
    if (activeTab === "employees") fetchEmployees(page);
    if (activeTab === "leaves") fetchLeaves(page);
    if (activeTab === "ledger") fetchLedger(page);
  }, [activeTab, page]);

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <h1 className="text-3xl font-bold mb-6">HR Dashboard</h1>

      <div className="flex gap-4 mb-6">
        {["employees", "leaves", "ledger"].map(tab => (
          <button
            key={tab}
            className={`px-5 py-2 rounded-full font-semibold ${
              activeTab === tab ? "bg-blue-600 text-white shadow-lg" : "bg-white border hover:bg-gray-100"
            } transition`}
            onClick={() => { setActiveTab(tab); setPage(1); }}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {activeTab === "employees" && (
        <div className="space-y-6">
          <EmployeeForm onSuccess={() => fetchEmployees(page)} />
          <div className="overflow-x-auto rounded shadow">
            <table className="min-w-full bg-white border">
              <thead className="bg-gray-50 text-gray-700 uppercase text-sm">
                <tr>
                  <th className="p-3 border">Name</th>
                  <th className="p-3 border">Email</th>
                  <th className="p-3 border">Department</th>
                  <th className="p-3 border">Joining Date</th>
                  <th className="p-3 border">Status</th>
                </tr>
              </thead>
              <tbody>
                {employees.map(emp => (
                  <tr key={emp.id} className="hover:bg-gray-100">
                    <td className="p-3 border">{emp.name}</td>
                    <td className="p-3 border">{emp.email}</td>
                    <td className="p-3 border">{emp.department}</td>
                    <td className="p-3 border">{emp.joiningDate}</td>
                    <td className="p-3 border">{emp.employmentStatus}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={page} totalPages={totalPages} onChange={setPage} />
        </div>
      )}

      {activeTab === "leaves" && (
        <div className="space-y-4">
          <LeaveTable data={leaves} onRefresh={() => fetchLeaves(page)} />
          <Pagination page={page} totalPages={totalPages} onChange={setPage} />
        </div>
      )}

      {activeTab === "ledger" && (
        <div className="space-y-4">
          <LedgerTable data={ledger} />
          <Pagination page={page} totalPages={totalPages} onChange={setPage} />
        </div>
      )}
    </div>
  );
}
