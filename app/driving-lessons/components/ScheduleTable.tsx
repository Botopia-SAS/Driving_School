"use client";

import React from "react";
import Image from "next/image";

interface Instructor {
  _id: string;
  name: string;
  photo?: string;
  email?: string;
  schedule_driving_lesson?: ScheduleEntry[];
  canTeachDrivingLesson?: boolean;
}

interface ScheduleEntry {
  date: string;
  start: string;
  end: string;
  status: string;
  classType?: string;
  pickupLocation?: string;
  dropoffLocation?: string;
  selectedProduct?: string;
  studentId?: string;
  studentName?: string;
  paid?: boolean;
}

interface Product {
  _id: string;
  title: string;
  description: string;
  price: number;
  buttonLabel: string;
  category: string;
  duration?: number;
  media?: string[];
}

interface SelectedTimeSlot {
  date: string;
  start: string;
  end: string;
  instructors: Instructor[];
}

interface ScheduleTableProps {
  selectedProduct: Product | null;
  weekOffset: number;
  onWeekOffsetChange: (offset: number) => void;
  weekDates: Date[];
  instructors: Instructor[];
  userId: string;
  onTimeSlotSelect: (timeSlot: SelectedTimeSlot, lesson: ScheduleEntry) => void;
  onSelectedHoursChange?: (hours: number) => void;
  selectedSlots: Set<string>;
  onSelectedSlotsChange: (slots: Set<string>) => void;
}

export default function ScheduleTable({
  selectedProduct,
  weekOffset,
  onWeekOffsetChange,
  weekDates,
  instructors,
  userId,
  onTimeSlotSelect,
  onSelectedHoursChange,
  selectedSlots,
  onSelectedSlotsChange
}: ScheduleTableProps) {
  const [selectedInstructor, setSelectedInstructor] = React.useState<Instructor | null>(null);
  
  // Helper functions
  const pad = (n: number) => n.toString().padStart(2, '0');

  const formatDate = (date: Date) => {
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  };

  const timeToMinutes = React.useCallback((time: string): number => {
    if (!time || typeof time !== 'string') return 0;
    const [hours, minutes] = time.split(':').map(Number);
    return (hours || 0) * 60 + (minutes || 0);
  }, []);
  
  // Helper function to calculate selected hours
  const calculateSelectedHours = React.useCallback((): number => {
    let totalMinutes = 0;
    selectedSlots.forEach(slotKey => {
      // Search across all instructors for the lesson
      let foundLesson: ScheduleEntry | null = null;
      
      for (const instructor of instructors) {
        const lesson = instructor.schedule_driving_lesson?.find(l => {
          const lessonKey = `${l.date}-${l.start}-${l.end}`;
          return lessonKey === slotKey && l.status === "available";
        });
        if (lesson) {
          foundLesson = lesson;
          break;
        }
      }
      
      if (foundLesson) {
        const startMin = timeToMinutes(foundLesson.start);
        const endMin = timeToMinutes(foundLesson.end);
        totalMinutes += (endMin - startMin);
      }
    });
    
    return Math.round(totalMinutes / 60 * 100) / 100; // Round to 2 decimal places
  }, [instructors, selectedSlots, timeToMinutes]);
  
  // Notify parent component when selected hours change
  React.useEffect(() => {
    if (onSelectedHoursChange) {
      const selectedHours = calculateSelectedHours();
      onSelectedHoursChange(selectedHours);
    }
  }, [selectedSlots, selectedInstructor, onSelectedHoursChange, calculateSelectedHours]);
  
  console.log("🎯 ScheduleTable renderizándose con instructors:", instructors?.length || 0);
  
  // Debug: Log all schedules coming in
  console.log("=== SCHEDULE DEBUG ===");
  console.log("Instructors received:", instructors);
  console.log("Instructors length:", instructors.length);
  console.log("Instructors stringified:", JSON.stringify(instructors, null, 2));
  instructors.forEach((instructor, idx) => {
    console.log(`Instructor ${idx + 1}: ${instructor.name}`);
    console.log(`Instructor object:`, instructor);
    console.log(`Has schedule_driving_lesson?:`, !!instructor.schedule_driving_lesson);
    console.log(`schedule_driving_lesson value:`, instructor.schedule_driving_lesson);
    if (instructor.schedule_driving_lesson) {
      console.log(`  Schedule entries:`, instructor.schedule_driving_lesson);
      instructor.schedule_driving_lesson.forEach((lesson, lessonIdx) => {
        console.log(`    Lesson ${lessonIdx + 1}:`, {
          date: lesson.date,
          start: lesson.start,
          end: lesson.end,
          status: lesson.status
        });
      });
    } else {
      console.log("  No schedule_driving_lesson found");
    }
  });
  console.log("=== END DEBUG ===");

  // Helper function to check if there's a time conflict with already selected slots
  const hasTimeConflict = (lesson: ScheduleEntry): boolean => {
    const lessonStartMin = timeToMinutes(lesson.start);
    const lessonEndMin = timeToMinutes(lesson.end);
    
    // Check against all currently selected slots
    for (const slotKey of selectedSlots) {
      // Find the lesson corresponding to this slot key across all instructors
      for (const instructor of instructors) {
        const existingLesson = instructor.schedule_driving_lesson?.find(l => {
          const existingSlotKey = `${l.date}-${l.start}-${l.end}`;
          return existingSlotKey === slotKey && l.status === "available";
        });
        
        if (existingLesson && existingLesson.date === lesson.date) {
          const existingStartMin = timeToMinutes(existingLesson.start);
          const existingEndMin = timeToMinutes(existingLesson.end);
          
          // Check for time overlap
          if (lessonStartMin < existingEndMin && lessonEndMin > existingStartMin) {
            return true; // There's a conflict
          }
        }
      }
    }
    
    return false; // No conflict found
  };

  // Helper function to toggle slot selection
  const toggleSlotSelection = (lesson: ScheduleEntry): void => {
    const slotKey = `${lesson.date}-${lesson.start}-${lesson.end}`;
    const newSelectedSlots = new Set(selectedSlots);
    
    if (selectedSlots.has(slotKey)) {
      // Always allow removing a selection
      newSelectedSlots.delete(slotKey);
    } else {
      // Before adding, check for time conflicts
      if (hasTimeConflict(lesson)) {
        alert(`⚠️ Time conflict!\nYou already have a lesson selected at this time on ${lesson.date} from ${lesson.start} to ${lesson.end}.\n\nPlease choose a different time slot.`);
        return; // Don't add the conflicting slot
      }
      newSelectedSlots.add(slotKey);
    }
    
    onSelectedSlotsChange(newSelectedSlots);
  };

  // Check if a slot is selected
  const isSlotSelected = (lesson: ScheduleEntry): boolean => {
    const slotKey = `${lesson.date}-${lesson.start}-${lesson.end}`;
    return selectedSlots.has(slotKey);
  };

  if (!selectedProduct) {
    return (
      <div className="w-full lg:w-2/3 mt-6 lg:mt-0">
        <div className="text-center py-20">
          <p className="text-gray-500 text-lg">
            Please select a driving package to view available times.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full lg:w-2/3 mt-6 lg:mt-0">
      <h2 className="text-2xl sm:text-3xl font-extrabold text-center mb-4 mt-12">
        <span className="text-[#10B981]">Available Classes</span>
      </h2>
      <p className="text-center text-gray-600 mb-6 text-sm">
        Select an instructor to view their available times. You can select hours from multiple instructors.
      </p>
      
      {/* Global Hours Counter */}

      {/* Global Book Button - Show when no instructor selected but hours are complete */}
      {!selectedInstructor && selectedSlots.size > 0 && selectedProduct && 
       calculateSelectedHours() === (selectedProduct.duration || 0) && (
        <div className="text-center mb-6">
          <button
            onClick={() => {
              // Convert selected slots to the format expected by onTimeSlotSelect
              const selectedLessons: ScheduleEntry[] = [];
              const instructorsInvolved: Instructor[] = [];
              
              selectedSlots.forEach(slotKey => {
                // Search across all instructors for the lesson
                for (const instructor of instructors) {
                  const lesson = instructor.schedule_driving_lesson?.find(l => {
                    const lessonKey = `${l.date}-${l.start}-${l.end}`;
                    return lessonKey === slotKey && l.status === "available";
                  });
                  if (lesson) {
                    selectedLessons.push(lesson);
                    if (!instructorsInvolved.some(i => i._id === instructor._id)) {
                      instructorsInvolved.push(instructor);
                    }
                    break;
                  }
                }
              });
              
              if (selectedLessons.length > 0) {
                // For now, we'll use the first lesson for the time slot format
                const firstLesson = selectedLessons[0];
                const timeSlot: SelectedTimeSlot = {
                  date: firstLesson.date,
                  start: firstLesson.start,
                  end: firstLesson.end,
                  instructors: instructorsInvolved // Pass all instructors involved
                };
                onTimeSlotSelect(timeSlot, firstLesson);
              }
            }}
            className="bg-green-500 hover:bg-green-600 text-white px-8 py-3 rounded-lg font-semibold transition-colors text-lg shadow-lg"
          >
            Book All Selected Hours ✓
          </button>
          <p className="text-sm text-gray-600 mt-2">
            Ready to book {calculateSelectedHours()} hours across multiple instructors
          </p>
        </div>
      )}

      {/* Lista de Instructores - Más compacta */}
      <div className="mb-6">
        <h3 className="text-lg font-bold text-center mb-3 text-black">Available Instructors</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-w-4xl mx-auto">
          {instructors.map((instructor) => {
            // Contar lecciones disponibles para este instructor (excluir cancelled)
            const availableLessonsCount = instructor.schedule_driving_lesson?.filter(
              lesson => lesson.status === "available"
            ).length || 0;

            // Contar horas seleccionadas de este instructor
            let selectedHoursFromThisInstructor = 0;
            selectedSlots.forEach(slotKey => {
              const lesson = instructor.schedule_driving_lesson?.find(l => {
                const lessonKey = `${l.date}-${l.start}-${l.end}`;
                return lessonKey === slotKey && l.status === "available";
              });
              if (lesson) {
                const startMin = timeToMinutes(lesson.start);
                const endMin = timeToMinutes(lesson.end);
                selectedHoursFromThisInstructor += (endMin - startMin) / 60;
              }
            });
            selectedHoursFromThisInstructor = Math.round(selectedHoursFromThisInstructor * 100) / 100;

            return (
              <div
                key={instructor._id}
                className={`border rounded-lg p-3 cursor-pointer transition-all duration-200 ${
                  selectedInstructor?._id === instructor._id
                    ? 'border-green-500 bg-green-50 shadow-md'
                    : 'border-gray-300 hover:border-green-400 hover:shadow-sm'
                }`}
                onClick={() => {
                  if (selectedInstructor?._id === instructor._id) {
                    setSelectedInstructor(null);
                    // Don't clear selections when deselecting instructor - allow cross-instructor selection
                  } else {
                    setSelectedInstructor(instructor);
                    // Don't clear selections when changing instructor - allow cross-instructor selection
                  }
                }}
              >
                <div className="text-center">
                  <Image
                    src={instructor.photo || '/default-instructor.png'}
                    alt={instructor.name}
                    width={48}
                    height={48}
                    className="w-12 h-12 rounded-full mx-auto mb-2 object-cover"
                  />
                  <h4 className="font-semibold text-sm text-black">{instructor.name}</h4>
                  <div className="mt-1 space-y-1">
                    <span className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                      {availableLessonsCount} available
                    </span>
                    {selectedHoursFromThisInstructor > 0 && (
                      <span className="block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                        {selectedHoursFromThisInstructor}h selected
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Mostrar horarios solo si hay un instructor seleccionado */}
      {selectedInstructor ? (
        <>
          <div className="flex flex-row justify-center items-center mb-8 gap-2 sm:gap-4">
            <button
              onClick={() => onWeekOffsetChange(weekOffset - 1)}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors text-sm sm:text-base"
            >
              ← Previous week
            </button>
            <div className="text-center">
              <span className="block text-lg font-semibold text-black">
                Schedule for {selectedInstructor.name}
              </span>
              {selectedProduct && (
                <span className="block text-sm text-blue-600 font-medium">
                  Hours selected: {calculateSelectedHours()} of {selectedProduct.duration || 0} available
                </span>
              )}
            </div>
            <button
              onClick={() => onWeekOffsetChange(weekOffset + 1)}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors text-sm sm:text-base"
            >
              Next week →
            </button>
          </div>

          {/* Schedule Table - Solo para el instructor seleccionado */}
          <div className="overflow-x-auto w-full mt-6">
            <table className="w-full border-collapse border border-gray-300 text-sm">
              <thead>
                <tr className="bg-white text-center">
                  <th className="border border-gray-300 p-1 text-black min-w-[70px] w-[70px] text-xs">Time</th>
                  {weekDates.map((date) => (
                    <th
                      key={date.toDateString()}
                      className="border border-gray-300 p-1 text-black min-w-[80px] w-[80px]"
                    >
                      <span className="block font-bold text-black text-xs">
                        {date.toLocaleDateString("en-US", { weekday: "short" })}
                      </span>
                      <span className="block text-black text-xs">
                        {date.toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(() => {
                  // HORARIOS FIJOS: 6:00 AM a 8:00 PM en slots de 30 minutos (como en register-online)
                  const allTimeSlots: { start: string, end: string, display: string }[] = [];
                  for (let h = 6; h < 20; h++) {
                    const hour1 = pad(h);
                    const hour2 = pad(h + 1);
                    
                    // Primer slot: XX:00 - XX:30
                    allTimeSlots.push({ 
                      start: `${hour1}:00`, 
                      end: `${hour1}:30`,
                      display: `${hour1}:00-${hour1}:30`
                    });
                    
                    // Segundo slot: XX:30 - (XX+1):00
                    allTimeSlots.push({ 
                      start: `${hour1}:30`, 
                      end: `${hour2}:00`,
                      display: `${hour1}:30-${hour2}:00`
                    });
                  }

                  // Helper function to check if a time block overlaps with a lesson
                  const doesBlockOverlapWithLesson = (blockStart: string, blockEnd: string, lessonStart: string, lessonEnd: string): boolean => {
                    const blockStartMin = timeToMinutes(blockStart);
                    const blockEndMin = timeToMinutes(blockEnd);
                    const lessonStartMin = timeToMinutes(lessonStart);
                    const lessonEndMin = timeToMinutes(lessonEnd);
                    
                    return blockStartMin < lessonEndMin && blockEndMin > lessonStartMin;
                  };

                  // Helper function to find the lesson that starts at a specific time block
                  const findLessonStartingAtBlock = (date: string, blockStart: string): ScheduleEntry | null => {
                    return selectedInstructor.schedule_driving_lesson
                      ?.filter(lesson => lesson.status !== 'cancelled') // Excluir slots cancelados
                      ?.find(lesson => {
                      if (lesson.date !== date) return false;
                      const lessonStartMin = timeToMinutes(lesson.start);
                      const blockStartMin = timeToMinutes(blockStart);
                      return Math.abs(lessonStartMin - blockStartMin) < 15; // Within 15 minutes tolerance
                    }) || null;
                  };

                  // Control global de celdas ya renderizadas por fecha y hora
                  const occupiedCells = new Set<string>();

                  // Pre-calcular todas las lecciones y marcar celdas ocupadas
                  weekDates.forEach((date) => {
                    const dateString = formatDate(date);

                    selectedInstructor.schedule_driving_lesson
                      ?.filter(lesson => lesson.status !== 'cancelled') // Excluir slots cancelados
                      ?.forEach(lesson => {
                      if (lesson.date === dateString) {
                        // Marcar todos los slots que esta lección ocupa
                        allTimeSlots.forEach((slot) => {
                          if (doesBlockOverlapWithLesson(slot.start, slot.end, lesson.start, lesson.end)) {
                            const cellKey = `${dateString}-${slot.start}`;
                            occupiedCells.add(cellKey);
                          }
                        });
                      }
                    });
                  });

                  return allTimeSlots.map((timeBlock, index) => {
                    return (
                      <tr key={index} className="text-center">
                        <td className="border border-gray-300 p-1 font-bold text-black min-w-[70px] w-[70px] text-xs">
                          {timeBlock.display}
                        </td>
                        {weekDates.map((date) => {
                          const dateString = formatDate(date);
                          const cellKey = `${dateString}-${timeBlock.start}`;
                          
                          // Si esta celda está ocupada por un rowSpan anterior, no renderizar nada
                          if (occupiedCells.has(cellKey)) {
                            // Buscar la lección que inicia exactamente en este bloque
                            const lessonStartingHere = findLessonStartingAtBlock(dateString, timeBlock.start);
                            
                            if (lessonStartingHere) {
                              // Esta es la celda donde inicia la lección, renderizar con rowSpan
                              const lessonStartMin = timeToMinutes(lessonStartingHere.start);
                              const lessonEndMin = timeToMinutes(lessonStartingHere.end);
                              const lessonDurationMin = lessonEndMin - lessonStartMin;
                              const rowSpan = Math.ceil(lessonDurationMin / 30);
                              
                              // Determinar el color y estilo según el estado
                              let cellStyle = "";
                              let textContent = "";
                              let clickHandler: (() => void) | undefined = undefined;

                              if (lessonStartingHere.status === "available") {
                                const isSelected = isSlotSelected(lessonStartingHere);
                                const hasConflict = !isSelected && hasTimeConflict(lessonStartingHere);
                                
                                if (hasConflict) {
                                  // Show as conflicted - not selectable
                                  cellStyle = "bg-red-100 text-red-600 cursor-not-allowed border-2 border-red-300";
                                  textContent = "Time Conflict";
                                  clickHandler = () => {
                                    alert(`⚠️ Time conflict!\nYou already have a lesson selected at this time on ${lessonStartingHere.date} from ${lessonStartingHere.start} to ${lessonStartingHere.end}.\n\nPlease choose a different time slot.`);
                                  };
                                } else if (isSelected) {
                                  cellStyle = "bg-green-600 text-white cursor-pointer hover:bg-green-700 transition-colors border-2 border-green-800"; 
                                  textContent = "Selected";
                                  clickHandler = () => {
                                    toggleSlotSelection(lessonStartingHere);
                                  };
                                } else {
                                  cellStyle = "bg-green-100 text-green-800 cursor-pointer hover:bg-green-200 transition-colors";
                                  textContent = "Available";
                                  clickHandler = () => {
                                    toggleSlotSelection(lessonStartingHere);
                                  };
                                }
                              } else if (lessonStartingHere.status === "booked" && lessonStartingHere.studentId === userId) {
                                cellStyle = "bg-blue-600 text-white cursor-pointer hover:bg-blue-700 transition-colors";
                                textContent = "Your Booking";
                                clickHandler = () => {
                                  alert(`Your booking with ${selectedInstructor.name}\nTime: ${lessonStartingHere.start} - ${lessonStartingHere.end}\nDate: ${lessonStartingHere.date}`);
                                };
                              } else if (lessonStartingHere.status === "booked") {
                                cellStyle = "bg-blue-200 text-blue-800";
                                textContent = "Booked";
                              } else if (lessonStartingHere.status === "pending") {
                                cellStyle = "bg-yellow-200 text-yellow-800";
                                textContent = "Pending";
                              } else {
                                cellStyle = "bg-gray-200 text-gray-600";
                                textContent = "Unavailable";
                              }

                              return (
                                <td 
                                  key={date.toDateString()} 
                                  className="border border-gray-300 p-1 min-w-[80px] w-[80px]"
                                  rowSpan={rowSpan}
                                >
                                  <div
                                    className={`text-xs p-1 rounded font-semibold flex flex-col items-center justify-center h-full min-h-[40px] ${cellStyle}`}
                                    onClick={clickHandler}
                                  >
                                    <span className="font-semibold text-center">{textContent}</span>
                                    <span className="text-[10px] font-normal text-center">
                                      {lessonStartingHere.start} - {lessonStartingHere.end}
                                    </span>
                                  </div>
                                </td>
                              );
                            } else {
                              // Esta celda está ocupada por un rowSpan anterior, no renderizar nada
                              return null;
                            }
                          } else {
                            // Celda vacía
                            return (
                              <td key={date.toDateString()} className="border border-gray-300 p-1 min-w-[80px] w-[80px] bg-gray-50">
                                <span className="text-gray-400">-</span>
                              </td>
                            );
                          }
                        })}
                      </tr>
                    );
                  });
                })()}
              </tbody>
            </table>
          </div>
          
          {/* Book Selected Hours Button */}
          {selectedSlots.size > 0 && selectedProduct && (
            <div className="mt-6 text-center">
              <div className="mb-4 p-4 bg-blue-50 rounded-lg">
                <p className="text-blue-800 font-semibold">
                  Selected: {calculateSelectedHours()} hours of {selectedProduct.duration || 0} hours needed
                </p>
                {calculateSelectedHours() === (selectedProduct.duration || 0) && (
                  <p className="text-green-600 font-medium mt-2">
                    ✓ Perfect! You have selected the exact hours needed for your package.
                  </p>
                )}
              </div>
              
              {calculateSelectedHours() === (selectedProduct.duration || 0) ? (
                <button
                  onClick={() => {
                    // Convert selected slots to the format expected by onTimeSlotSelect
                    const selectedLessons: ScheduleEntry[] = [];
                    const instructorsInvolved: Instructor[] = [];
                    
                    selectedSlots.forEach(slotKey => {
                      // Search across all instructors for the lesson
                      for (const instructor of instructors) {
                        const lesson = instructor.schedule_driving_lesson?.find(l => {
                          const lessonKey = `${l.date}-${l.start}-${l.end}`;
                          return lessonKey === slotKey && l.status === "available";
                        });
                        if (lesson) {
                          selectedLessons.push(lesson);
                          if (!instructorsInvolved.some(i => i._id === instructor._id)) {
                            instructorsInvolved.push(instructor);
                          }
                          break;
                        }
                      }
                    });
                    
                    if (selectedLessons.length > 0) {
                      // For now, we'll use the first lesson for the time slot format
                      const firstLesson = selectedLessons[0];
                      const timeSlot: SelectedTimeSlot = {
                        date: firstLesson.date,
                        start: firstLesson.start,
                        end: firstLesson.end,
                        instructors: instructorsInvolved // Pass all instructors involved
                      };
                      onTimeSlotSelect(timeSlot, firstLesson);
                    }
                  }}
                  className="bg-green-500 hover:bg-green-600 text-white px-8 py-3 rounded-lg font-semibold transition-colors text-lg"
                >
                  Book Selected Hours ({selectedSlots.size} slots from {(() => {
                    const involvedInstructors = new Set<string>();
                    selectedSlots.forEach(slotKey => {
                      for (const instructor of instructors) {
                        const lesson = instructor.schedule_driving_lesson?.find(l => {
                          const lessonKey = `${l.date}-${l.start}-${l.end}`;
                          return lessonKey === slotKey && l.status === "available";
                        });
                        if (lesson) {
                          involvedInstructors.add(instructor.name);
                          break;
                        }
                      }
                    });
                    return involvedInstructors.size;
                  })()} instructor{(() => {
                    const involvedInstructors = new Set<string>();
                    selectedSlots.forEach(slotKey => {
                      for (const instructor of instructors) {
                        const lesson = instructor.schedule_driving_lesson?.find(l => {
                          const lessonKey = `${l.date}-${l.start}-${l.end}`;
                          return lessonKey === slotKey && l.status === "available";
                        });
                        if (lesson) {
                          involvedInstructors.add(instructor.name);
                          break;
                        }
                      }
                    });
                    return involvedInstructors.size > 1 ? 's' : '';
                  })()})
                </button>
              ) : (
                <button
                  disabled
                  className="bg-gray-400 text-white px-8 py-3 rounded-lg font-semibold cursor-not-allowed text-lg"
                >
                  Select {selectedProduct.duration || 0} hours to continue
                </button>
              )}
              
              <div className="mt-4">
                <button
                  onClick={() => onSelectedSlotsChange(new Set())}
                  className="text-red-600 hover:text-red-800 font-medium"
                >
                  Clear All Selections
                </button>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">
            Please select an instructor above to view their available times.
          </p>
        </div>
      )}
    </div>
  );
}
