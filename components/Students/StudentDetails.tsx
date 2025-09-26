import React from 'react';

interface Student {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  secondaryPhoneNumber: string;
}

interface ClassInfo {
  _id: string;
  date: string;
  hour: string;
  type: string;
  duration: string;
}

interface Props {
  selected: Student | null;
  history: ClassInfo[];
  notesHistory: { text: string; date: string }[];
  notes: string;
  setNotes: (n: string) => void;
  handleSaveNotes: () => void;
  saving: boolean;
  saveMsg: string;
}

const StudentDetails: React.FC<Props> = ({ selected, history, notesHistory, notes, setNotes, handleSaveNotes, saving, saveMsg }) => {
  if (!selected) {
    return <div className="text-gray-400">Select a student to view details</div>;
  }
  return (
    <div className="w-full">
      <h2 className="text-2xl font-bold mb-2 text-[#0056b3]">{selected.firstName} {selected.lastName}</h2>
      <div className="mb-4 text-gray-600">Email: {selected.email} | Phone 2: {selected.secondaryPhoneNumber}</div>
      <h3 className="font-semibold text-lg mb-2 text-[#27ae60]">Class History</h3>
      <ul className="mb-4">
        {history.map(h => (
          <li key={h._id} className="mb-1">
            <span className="font-mono text-sm text-[#0056b3]">{new Date(h.date).toLocaleDateString()} {h.hour}</span> <span className="text-black">- {h.type} ({h.duration})</span>
          </li>
        ))}
        {history.length === 0 && <li className="text-gray-400">No classes found</li>}
      </ul>
      <h3 className="font-semibold text-lg mb-2 text-[#27ae60]">Private Notes</h3>
      {/* Historial de notas */}
      <ul className="mb-2">
        {notesHistory.map((n, idx) => {
          const dateObj = new Date(n.date);
          const isValid = !isNaN(dateObj.getTime());
          return (
            <li key={idx} className="text-sm text-gray-700 mb-1">
              <span className="font-mono text-xs text-gray-500">{isValid ? dateObj.toLocaleString() : ""}:</span> {n.text}
            </li>
          );
        })}
        {notesHistory.length === 0 && <li className="text-gray-400">No notes yet</li>}
      </ul>
      <textarea
        className="w-full border rounded p-2 min-h-[80px] text-black placeholder:text-gray-400"
        placeholder="Add private notes..."
        value={notes}
        onChange={e => setNotes(e.target.value)}
      />
      <button className="mt-2 bg-[#27ae60] text-white px-4 py-2 rounded disabled:opacity-50" onClick={handleSaveNotes} disabled={saving || !notes.trim()}>{saving ? 'Saving...' : 'Save Notes'}</button>
      {saveMsg && <div className="mt-2 text-sm text-gray-500">{saveMsg}</div>}
    </div>
  );
};

export default StudentDetails; 