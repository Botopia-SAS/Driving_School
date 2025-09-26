import React from 'react';
import LoadingSpinner from '../common/LoadingSpinner';

interface Student {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  secondaryPhoneNumber: string;
}

interface Props {
  filtered: Student[];
  search: string;
  setSearch: (s: string) => void;
  handleSelect: (s: Student) => void;
  handleOpenSingleMail: (email: string) => void;
  loadingStudents: boolean;
}

const StudentList: React.FC<Props> = ({ filtered, search, setSearch, handleSelect, handleOpenSingleMail, loadingStudents }) => {
  if (loadingStudents) {
    return (
      <div className="flex justify-center items-center py-8">
        <LoadingSpinner />
      </div>
    );
  }
  return (
    <aside className="w-full md:w-1/3 bg-white rounded-3xl shadow-2xl p-6 border border-[#e0e0e0]">
      <input
        type="text"
        placeholder="Search by name, ID or Phone..."
        className="w-full mb-4 p-2 border rounded text-black placeholder:text-gray-400"
        value={search}
        onChange={e => setSearch(e.target.value)}
      />
      <ul className="divide-y">
        {filtered.map(s => (
          <li key={s._id} className="py-3 cursor-pointer hover:bg-blue-50 rounded flex items-center justify-between" onClick={() => handleSelect(s)}>
            <div>
              <div className="font-semibold text-[#0056b3]">{s.firstName} {s.lastName}</div>
              <div className="text-xs text-gray-500">{s.email}</div>
              <div className="text-xs text-gray-500">Phone 2: {s.secondaryPhoneNumber}</div>
            </div>
            <button
              className="ml-2 flex items-center justify-center bg-white border border-[#ea4335] text-[#ea4335] rounded-full p-2 hover:bg-[#ea4335] hover:text-white transition-all"
              title={`Send email to ${s.firstName}`}
              onClick={e => { e.stopPropagation(); handleOpenSingleMail(s.email); }}
            >
              <svg className="w-5 h-5" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="48" height="48" rx="24" fill="#fff"/>
                <path d="M8 16l16 12 16-12" stroke="#ea4335" strokeWidth="3" strokeLinejoin="round"/>
                <rect x="8" y="16" width="32" height="16" rx="3" stroke="#ea4335" strokeWidth="3"/>
              </svg>
            </button>
          </li>
        ))}
        {filtered.length === 0 && <li className="text-gray-400 py-4">No students found</li>}
      </ul>
    </aside>
  );
};

export default StudentList; 