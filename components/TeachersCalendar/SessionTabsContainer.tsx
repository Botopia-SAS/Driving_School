import React, { useState } from 'react';
import type { Class as CalendarClass } from './types';
import { SessionDetailsCard } from './SessionDetailsCard';
import { NotesTab } from './NotesTab';
import { ChecklistsTab } from './ChecklistsTab';

interface SessionTabsContainerProps {
  selectedBlock: CalendarClass;
  studentInfo: {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
  } | null;
  instructorId?: string;
}

type TabType = 'notes' | 'checklists';

export const SessionTabsContainer: React.FC<SessionTabsContainerProps> = ({
  selectedBlock,
  studentInfo,
  instructorId
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('checklists');

  const tabs: { id: TabType; label: string; icon: string }[] = [
    { id: 'notes', label: 'Notes', icon: '📝' },
    { id: 'checklists', label: 'Checklists', icon: '✓' }
  ];

  return (
    <div className="flex flex-col lg:flex-row gap-3 lg:gap-4">
      {/* Left Side - Session Details Card (Collapsible on Mobile) */}
      <div className="lg:w-1/3 flex-shrink-0">
        <SessionDetailsCard
          selectedBlock={selectedBlock}
          studentInfo={studentInfo}
        />
      </div>

      {/* Right Side - Tabs Content */}
      <div className="lg:w-2/3 flex flex-col">
        {/* Tabs Navigation */}
        <div className="flex border-b border-gray-200 mb-3 lg:mb-4 -mx-1 sm:mx-0 flex-shrink-0">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm font-semibold transition-all ${
                activeTab === tab.id
                  ? 'border-b-2 border-blue-500 text-blue-600 bg-blue-50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <span className="mr-1 sm:mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="flex-1">
          {activeTab === 'notes' && (
            <NotesTab
              sessionId={String(selectedBlock._id || '')}
              studentId={String(selectedBlock.studentId || '')}
              instructorId={instructorId || ''}
            />
          )}
          {activeTab === 'checklists' && (
            <ChecklistsTab
              sessionId={String(selectedBlock._id || '')}
              studentId={String(selectedBlock.studentId || '')}
              instructorId={instructorId || ''}
            />
          )}
        </div>
      </div>
    </div>
  );
};
