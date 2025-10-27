import React, { useState, useEffect } from 'react';

interface Note {
  text: string;
  date: string;
}

interface NotesTabProps {
  sessionId: string;
  studentId: string;
  instructorId: string;
  classType?: string;
}

export const NotesTab: React.FC<NotesTabProps> = ({ sessionId, studentId, instructorId, classType = 'driving lesson' }) => {
  // Determine checklistType for API
  const getChecklistType = () => {
    const normalizedClassType = classType?.toLowerCase().trim() || 'driving lesson';
    if (normalizedClassType === 'driving test') {
      return 'Driving Test Skills';
    }
    return 'Driving Skills Basics';
  };

  const checklistType = getChecklistType();
  const [notes, setNotes] = useState<Note[]>([]);
  const [newNote, setNewNote] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Load existing notes on mount
  useEffect(() => {
    const loadNotes = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/session-checklist?sessionId=${sessionId}&checklistType=${encodeURIComponent(checklistType)}`);
        const data = await res.json();

        if (data.checklist && data.checklist.notes && Array.isArray(data.checklist.notes)) {
          setNotes(data.checklist.notes);
        }
      } catch (error) {
        console.error('Error loading notes:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (sessionId) {
      loadNotes();
    }
  }, [sessionId, checklistType]);

  // Function to save notes to backend
  const saveNotes = async (updatedNotes: Note[]) => {
    if (!sessionId || !studentId || !instructorId) return;

    setIsSaving(true);
    try {
      const res = await fetch('/api/session-checklist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          studentId,
          instructorId,
          checklistType: checklistType,
          notes: updatedNotes
        })
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.error('Failed to save notes. Status:', res.status);
        console.error('Response:', errorText);
      }
    } catch (error) {
      console.error('Error saving notes:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddNote = async () => {
    if (!newNote.trim()) return;

    const note: Note = {
      text: newNote.trim(),
      date: new Date().toISOString()
    };

    const updatedNotes = [note, ...notes];
    setNotes(updatedNotes);
    setNewNote('');

    // Save to backend
    await saveNotes(updatedNotes);
  };

  const handleDeleteNote = async (index: number) => {
    const updatedNotes = notes.filter((_, i) => i !== index);
    setNotes(updatedNotes);

    // Save to backend
    await saveNotes(updatedNotes);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      handleAddNote();
    }
  };

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Add Note Section */}
      <div className="bg-gray-50 p-3 sm:p-4 rounded-lg border border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <label className="block text-xs sm:text-sm font-semibold text-gray-700">
            Add New Note
          </label>
          {isSaving && (
            <span className="text-blue-600 text-xs flex items-center gap-1">
              <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Saving...
            </span>
          )}
        </div>
        <textarea
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
          onKeyDown={handleKeyPress}
          placeholder="Type your note here... (Ctrl+Enter to save)"
          className="w-full p-2 sm:p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm text-gray-900"
          rows={4}
        />
        <div className="mt-2 flex justify-end">
          <button
            onClick={handleAddNote}
            disabled={!newNote.trim() || isSaving}
            className="px-3 sm:px-4 py-2 bg-[#0056b3] text-white rounded-lg text-sm font-semibold hover:bg-[#27ae60] transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed active:scale-95"
          >
            {isSaving ? 'Saving...' : 'Add Note'}
          </button>
        </div>
      </div>

      {/* Notes List */}
      <div>
        <h3 className="text-xs sm:text-sm font-semibold text-gray-700 mb-2 sm:mb-3">
          Session Notes ({notes.length})
        </h3>

        {isLoading ? (
          <div className="flex items-center justify-center py-6 sm:py-8">
            <svg className="animate-spin h-6 w-6 sm:h-8 sm:w-8 text-blue-600" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <span className="ml-2 text-sm sm:text-base text-gray-600">Loading notes...</span>
          </div>
        ) : notes.length === 0 ? (
          <div className="text-center py-8 sm:py-12 text-gray-400 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
            <svg
              className="mx-auto h-10 w-10 sm:h-12 sm:w-12 text-gray-400 mb-2 sm:mb-3"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <p className="text-sm sm:text-base font-medium">No notes yet</p>
            <p className="text-xs sm:text-sm mt-1">Add your first note above to get started</p>
          </div>
        ) : (
          <div className="space-y-2 sm:space-y-3">
            {notes.map((note, index) => (
              <div
                key={index}
                className="bg-white border border-gray-200 rounded-lg p-3 sm:p-4 shadow-sm hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="text-xs font-semibold text-gray-500">
                      Note #{notes.length - index}
                    </span>
                  </div>
                  <button
                    onClick={() => handleDeleteNote(index)}
                    disabled={isSaving}
                    className="text-red-500 hover:text-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
                    title="Delete note"
                  >
                    <svg
                      className="w-4 h-4 sm:w-5 sm:h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                </div>
                <p className="text-sm sm:text-base text-gray-800 whitespace-pre-wrap leading-relaxed">
                  {note.text}
                </p>
                <div className="mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-gray-100">
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <svg
                      className="w-3 h-3 sm:w-4 sm:h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    {new Date(note.date).toLocaleString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
