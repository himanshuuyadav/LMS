export default function LeaveTable({ data, onRefresh }) {
  const handleApprove = async (id) => {
    await axios.post(`/leaves/${id}/approve`);
    onRefresh?.();
  };
  const handleReject = async (id) => {
    await axios.post(`/leaves/${id}/reject`);
    onRefresh?.();
  };

  return (
    <table className="min-w-full bg-white border">
      <thead className="bg-gray-100">
        <tr>
          <th className="p-2 border">Employee</th>
          <th className="p-2 border">Start</th>
          <th className="p-2 border">End</th>
          <th className="p-2 border">Days</th>
          <th className="p-2 border">Status</th>
          <th className="p-2 border">Actions</th>
        </tr>
      </thead>
      <tbody>
        {data.map(l => (
          <tr key={l.id}>
            <td className="p-2 border">{l.employeeId?.name || "Self"}</td>
            <td className="p-2 border">{l.startDate}</td>
            <td className="p-2 border">{l.endDate}</td>
            <td className="p-2 border">{l.daysRequested}</td>
            <td className="p-2 border">{l.status}</td>
            <td className="p-2 border">
              {l.status === "Pending" && (
                <>
                  <button onClick={() => handleApprove(l.id)} className="mr-2 bg-green-600 text-white px-2 py-1 rounded">Approve</button>
                  <button onClick={() => handleReject(l.id)} className="bg-red-600 text-white px-2 py-1 rounded">Reject</button>
                </>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
