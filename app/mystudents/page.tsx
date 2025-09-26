"use client";
import React, { useEffect, useState } from 'react';
import StudentList from '@/components/Students/StudentList';
import StudentDetails from '@/components/Students/StudentDetails';
import MailModal from '@/components/Students/MailModal';
import { useAuth } from "@/components/AuthContext";
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { useRouter } from "next/navigation";

interface Student {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  licenseNumber?: string;
  secondaryPhoneNumber: string;
}

interface ClassInfo {
  _id: string;
  date: string;
  hour: string;
  type: string;
  duration: string;
}

interface Course {
  _id: string;
  title: string;
  length: number;
  price: number;
  students?: Student[];
  classInfo?: {
    title: string;
    length: number;
    price: number;
  };
  type?: string;
  duration?: string;
  date?: string;
  hour?: string;
  cupos?: number;
  enrolledStudents?: number;
}

interface ClassResponse {
  _id: string;
  date: string;
  hour: string;
  type: string;
  duration: string;
}

interface NoteResponse {
  notes: {
    _id: string;
    text: string;
    createdAt: string;
    instructorId: string;
    studentId: string;
  }[];
}

interface Note {
  text: string;
  date: string;
}

// Utility: get date at midnight local
function toLocalDateOnly(dateStr: string) {
  const d = new Date(dateStr);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

// Utilidad para mostrar la fecha igual que en MongoDB (sin desfase de zona horaria)
function formatDateUTC(dateStr: string) {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('T')[0].split('-');
  return `${day}/${month}/${year}`;
}

// Extraer IDs de estudiantes (string u objeto)
function extractStudentIds(studentsArr: (string | { studentId?: string; _id?: string })[]): string[] {
  if (!Array.isArray(studentsArr)) return [];
  return studentsArr.map(s => {
    if (typeof s === 'string') return s;
    if (typeof s === 'object' && s.studentId) return s.studentId;
    if (typeof s === 'object' && s._id) return s._id;
    return null;
  }).filter((id): id is string => Boolean(id));
}

const StudentsPage = () => {
  const router = useRouter();
  const { user } = useAuth();
  const instructorId = user?._id;
  const [courses, setCourses] = useState<Course[]>([]);
  const [classStudents, setClassStudents] = useState<Student[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Student | null>(null);
  const [history, setHistory] = useState<ClassInfo[]>([]);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');
  const [notesHistory, setNotesHistory] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  // Modal correo
  const [showMailModal, setShowMailModal] = useState(false);
  const [mailRecipients, setMailRecipients] = useState<string[]>([]);
  const [mailSubject, setMailSubject] = useState('');
  const [mailBody, setMailBody] = useState('');
  const [mailSending, setMailSending] = useState(false);
  const [mailSent, setMailSent] = useState(false);
  const [filterDateFrom, setFilterDateFrom] = useState<string>('');
  const [filterDateTo, setFilterDateTo] = useState<string>('');
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Redirección si no hay usuario
  useEffect(() => {
    if (user === null) {
      router.replace("/sign-in");
    }
  }, [user, router]);

  useEffect(() => {
    if (!instructorId) {
      setLoading(false);
      return;
    }

    const eventSource = new EventSource(`/api/teachers/classes-updates?instructorId=${instructorId}`);

    eventSource.onopen = () => setLoading(true);

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'update' && Array.isArray(data.classes)) {
          setCourses(data.classes);
        }
      } catch (error) {
        console.error("Failed to parse SSE data:", error);
      } finally {
        setLoading(false);
      }
    };

    eventSource.onerror = (err) => {
      console.error("EventSource failed for classes:", err);
      setLoading(false);
      eventSource.close();
    };

    return () => eventSource.close();
  }, [instructorId]);

  // Limpiar selección SOLO cuando cambia el curso
  useEffect(() => {
    setSelected(null);
    setHistory([]);
    setNotes('');
    setNotesHistory([]);
    setSaveMsg('');
  }, [selectedCourse]);

  // Actualizar estudiantes de la clase cuando cambia la clase seleccionada
  useEffect(() => {
    async function fetchClassStudents() {
      if (selectedCourse && Array.isArray(selectedCourse.students)) {
        const ids = extractStudentIds(selectedCourse.students);
        if (ids.length === 0) {
          setClassStudents([]);
          return;
        }
        setLoadingStudents(true);
        try {
          const res = await fetch('/api/users/bulk', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ids })
          });
          if (res.ok) {
            const users = await res.json();
            setClassStudents(users);
          } else {
            setClassStudents([]);
          }
        } catch {
          setClassStudents([]);
        }
        setLoadingStudents(false);
      } else {
        setClassStudents([]);
      }
    }
    fetchClassStudents();
  }, [selectedCourse]);

  // 3. Cuando seleccionas un estudiante, traer su historial en ese curso
  const handleSelect = async (student: Student) => {
    setSelected(student);
    setNotes('');
    setNotesHistory([]);
    setSaveMsg('');
    setLoadingHistory(true);
    if (!selectedCourse || !instructorId) {
      setLoadingHistory(false);
      return;
    }
    // Traer historial de clases
    const res = await fetch(`/api/ticketclasses?instructorId=${instructorId}&studentId=${student._id}&classId=${selectedCourse._id}`);
    const data = await res.json() as ClassResponse[];
    setHistory(data.map((c) => ({
      _id: c._id,
      date: c.date,
      hour: c.hour,
      type: c.type,
      duration: c.duration
    })));
    // Traer historial de notas
    const notesRes = await fetch(`/api/notes?studentId=${student._id}&instructorId=${instructorId}`);
    const notesData = await notesRes.json() as NoteResponse;
    const notesArr = notesData.notes.map(note => ({
      text: note.text,
      date: note.createdAt
    }));
    setNotesHistory(notesArr);
    setLoadingHistory(false);
  };

  const filtered = classStudents.filter(s =>
    (s.firstName || '').toLowerCase().includes(search.toLowerCase()) ||
    (s.lastName || '').toLowerCase().includes(search.toLowerCase()) ||
    (s.email || '').toLowerCase().includes(search.toLowerCase()) ||
    (s.licenseNumber || '').toLowerCase().includes(search.toLowerCase()) ||
    (s._id || '').includes(search)
  );

  const handleSaveNotes = async () => {
    if (!selected || !instructorId) return;
    setSaving(true);
    setSaveMsg('');
    const res = await fetch('/api/notes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ studentId: selected._id, instructorId, text: notes })
    });
    if (res.ok) {
      setSaveMsg('Notes saved!');
      setNotes('');
      // Refrescar historial de notas
      const notesData = await res.json() as NoteResponse;
      const notesArr = notesData.notes.map(note => ({
        text: note.text,
        date: note.createdAt
      }));
      setNotesHistory(notesArr);
    } else {
      setSaveMsg('Error saving notes');
    }
    setSaving(false);
  };

  // Función para abrir modal de correo masivo
  const handleOpenMassMail = () => {
    setMailRecipients(classStudents.map(s => s.email));
    setMailSubject('');
    setMailBody('');
    setMailSent(false);
    setShowMailModal(true);
  };
  // Función para abrir modal de correo individual
  const handleOpenSingleMail = (email: string) => {
    setMailRecipients([email]);
    setMailSubject('');
    setMailBody('');
    setMailSent(false);
    setShowMailModal(true);
  };
  // Simular envío de correo
  const handleSendMail = async () => {
    setMailSending(true);
    setMailSent(false);
    try {
      const res = await fetch('/api/send_gmail', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipients: mailRecipients,
          subject: mailSubject,
          body: mailBody
        })
      });
      if (res.ok) {
        setMailSent(true);
        setMailSubject('');
        setMailBody('');
      } else {
        setMailSent(false);
        alert('Error sending email');
      }
    } catch {
      setMailSent(false);
      alert('Error sending email');
    }
    setMailSending(false);
  };

  // Pantalla 1: My Classes
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-[#e8f6ef] via-[#f0f6ff] to-[#eafaf1]">
        <LoadingSpinner />
      </div>
    );
  }

  if (!selectedCourse) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#e8f6ef] via-[#f0f6ff] to-[#eafaf1] py-8 px-4 flex flex-col items-center">
        <div className="max-w-2xl w-full mt-32">
          <h1 className="text-3xl font-bold mb-10 text-[#0056b3] text-center">My Classes</h1>
          {/* Date filter */}
          <div className="flex justify-center mb-6 gap-4">
            <div className="flex flex-col items-start">
              <label htmlFor="date-from" className="text-sm text-gray-600 mb-1">From</label>
              <input
                id="date-from"
                type="date"
                className="border border-gray-300 rounded-lg px-4 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-200"
                value={filterDateFrom}
                onChange={e => setFilterDateFrom(e.target.value)}
              />
            </div>
            <div className="flex flex-col items-start">
              <label htmlFor="date-to" className="text-sm text-gray-600 mb-1">To</label>
              <input
                id="date-to"
                type="date"
                className="border border-gray-300 rounded-lg px-4 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-200"
                value={filterDateTo}
                onChange={e => setFilterDateTo(e.target.value)}
              />
            </div>
            {(filterDateFrom || filterDateTo) && (
              <button
                className="self-end ml-2 px-3 py-2 rounded bg-gray-200 text-gray-600 hover:bg-gray-300"
                onClick={() => { setFilterDateFrom(''); setFilterDateTo(''); }}
              >
                Clear
              </button>
            )}
          </div>
          <div className="flex flex-col gap-8 items-center">
            {(() => {
              const filteredCourses = courses.filter(course => {
                if (!course.date) return false;
                const courseDateObj = toLocalDateOnly(course.date);
                let fromOk = true;
                let toOk = true;
                if (filterDateFrom) {
                  const fromDateObj = toLocalDateOnly(filterDateFrom);
                  fromOk = courseDateObj.getTime() >= fromDateObj.getTime();
                }
                if (filterDateTo) {
                  const toDateObj = toLocalDateOnly(filterDateTo);
                  toOk = courseDateObj.getTime() <= toDateObj.getTime();
                }
                return fromOk && toOk;
              });
              return filteredCourses.length > 0 ? (
                filteredCourses.map(course => (
                  <div
                    key={course._id}
                    className="w-full max-w-xl cursor-pointer p-8 rounded-3xl shadow-2xl border border-[#e0e0e0] bg-white hover:bg-blue-50 transition-all duration-200 text-center"
                    onClick={() => setSelectedCourse(course)}
                    style={{ boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.10)' }}
                  >
                    <div className="font-extrabold text-xl text-[#0056b3] mb-2">
                      {course.classInfo?.title || course.title || 'No title'}
                    </div>
                    <div className="flex justify-center gap-4 mb-2">
                      <span className="px-3 py-1 rounded-full bg-[#eafaf1] text-[#27ae60] font-bold text-sm">
                        {course.type ? course.type.toUpperCase() : ''}
                      </span>
                      <span className="px-3 py-1 rounded-full bg-[#e3f6fc] text-[#0056b3] font-bold text-sm">
                        {course.classInfo?.length ? `${course.classInfo.length}h` : course.duration ? course.duration : ''}
                      </span>
                      <span className="px-3 py-1 rounded-full bg-[#ede7f6] text-[#7c3aed] font-bold text-sm">
                        {course.classInfo?.price !== undefined ? `$${course.classInfo.price}` : course.price !== undefined ? `$${course.price}` : ''}
                      </span>
                    </div>
                    <div className="flex justify-center gap-4 mb-2">
                      {course.date && (
                        <span className="text-sm text-gray-500">Date: <b>{formatDateUTC(course.date)}</b></span>
                      )}
                      {course.hour && (
                        <span className="text-sm text-gray-500">Time: <b>{course.hour}</b></span>
                      )}
                      {course.cupos !== undefined && (
                        <span className="text-sm text-gray-500">Spots: <b>{course.cupos}</b></span>
                      )}
                    </div>
                    <div className="flex justify-center gap-4 mb-2">
                      <span className="text-sm text-[#0056b3] font-semibold">Students: {Array.isArray(course.students) ? course.students.length : (course.enrolledStudents ?? 0)}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-gray-400">No courses found</div>
              );
            })()}
          </div>
        </div>
      </div>
    );
  }

  // Pantalla 2: Students in [Course]
  if (loadingStudents) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-[#e8f6ef] via-[#f0f6ff] to-[#eafaf1]">
        <LoadingSpinner />
        <span className="ml-4 text-lg text-gray-600">Loading students...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#e8f6ef] via-[#f0f6ff] to-[#eafaf1] py-8 px-4 flex flex-col items-center">
      <div className="max-w-5xl w-full mt-32">
        <button
          className="mb-6 px-4 py-2 rounded bg-[#0056b3] text-white font-semibold shadow hover:bg-[#003366] transition-all"
          onClick={() => { setSelectedCourse(null); setSelected(null); setSearch(''); }}
        >
          ← Back to My Classes
        </button>
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-3xl font-bold mb-0 text-[#0056b3] text-center flex-1">Students in <span className="text-[#27ae60]">{selectedCourse.title}</span></h1>
          <button
            className="ml-4 flex items-center gap-2 bg-white border border-[#ea4335] text-[#ea4335] px-4 py-2 rounded-full shadow hover:bg-[#ea4335] hover:text-white transition-all text-lg font-bold"
            title="Send email to all students"
            onClick={handleOpenMassMail}
          >
            <svg className="w-6 h-6" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="48" height="48" rx="24" fill="#fff"/>
              <path d="M8 16l16 12 16-12" stroke="#ea4335" strokeWidth="3" strokeLinejoin="round"/>
              <rect x="8" y="16" width="32" height="16" rx="3" stroke="#ea4335" strokeWidth="3"/>
            </svg>
            <span className="hidden md:inline">Email All</span>
          </button>
        </div>
        <div className="flex flex-col md:flex-row gap-4 md:gap-8">
          <StudentList
            filtered={filtered}
            search={search}
            setSearch={setSearch}
            handleSelect={handleSelect}
            handleOpenSingleMail={handleOpenSingleMail}
            loadingStudents={loadingStudents}
          />
          <main className="flex-1 bg-white rounded-3xl shadow-2xl p-6 border border-[#e0e0e0]">
            {loadingHistory ? (
              <div className="flex justify-center items-center min-h-screen">
                <LoadingSpinner />
                <span className="ml-4 text-lg text-gray-600">Loading class history...</span>
              </div>
            ) : (
              <StudentDetails
                selected={selected}
                history={history}
                notesHistory={notesHistory}
                notes={notes}
                setNotes={setNotes}
                handleSaveNotes={handleSaveNotes}
                saving={saving}
                saveMsg={saveMsg}
              />
            )}
          </main>
        </div>
      </div>
      <MailModal
        show={showMailModal}
        onClose={() => setShowMailModal(false)}
        recipients={mailRecipients}
        subject={mailSubject}
        setSubject={setMailSubject}
        body={mailBody}
        setBody={setMailBody}
        sending={mailSending}
        sent={mailSent}
        onSend={handleSendMail}
      />
    </div>
  );
};

export default StudentsPage; 