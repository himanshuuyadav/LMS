export default function LedgerTable({ data }) {
  return (
    <table className="min-w-full bg-white border">
      <thead className="bg-gray-100">
        <tr>
          <th className="p-2 border">Employee</th>
          <th className="p-2 border">Source</th>
          <th className="p-2 border">Delta</th>
          <th className="p-2 border">Note</th>
          <th className="p-2 border">Date</th>
        </tr>
      </thead>
      <tbody>
        {data.map(l => (
          <tr key={l.id}>
            <td className="p-2 border">{l.employee?.name}</td>
            <td className="p-2 border">{l.source}</td>
            <td className="p-2 border">{l.deltaDays}</td>
            <td className="p-2 border">{l.note}</td>
            <td className="p-2 border">{new Date(l.createdAt).toLocaleDateString()}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
