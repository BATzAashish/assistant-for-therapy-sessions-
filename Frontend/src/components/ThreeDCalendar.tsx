import { useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Clock, MapPin } from "lucide-react";

interface Session {
  _id: string;
  client_id: {
    _id: string;
    name: string;
  };
  scheduled_date: string;
  duration?: number;
  status: string;
  location?: string;
  meeting_link?: string;
}

interface ThreeDCalendarProps {
  currentDate: Date;
  sessions: Session[];
  onDateClick: (date: Date) => void;
  getClientColor: (clientId: string) => any;
  getInitials: (name: string) => string;
  formatTime: (dateString: string) => string;
}

const ThreeDCalendar = ({
  currentDate,
  sessions,
  onDateClick,
  getClientColor,
  getInitials,
  formatTime,
}: ThreeDCalendarProps) => {
  const [hoveredDay, setHoveredDay] = useState<number | null>(null);

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    return { daysInMonth, startingDayOfWeek };
  };

  const getSessionsForDate = (date: Date) => {
    return sessions.filter((session) => {
      if (!session.scheduled_date) return false;
      const sessionDate = new Date(session.scheduled_date);
      return (
        sessionDate.getDate() === date.getDate() &&
        sessionDate.getMonth() === date.getMonth() &&
        sessionDate.getFullYear() === date.getFullYear()
      );
    });
  };

  const { daysInMonth, startingDayOfWeek } = getDaysInMonth(currentDate);
  const today = new Date();
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div className="w-full h-full flex flex-col overflow-hidden">
      {/* Day names header */}
      <div className="grid grid-cols-7 gap-1 mb-1 flex-shrink-0">
        {dayNames.map((day) => (
          <div
            key={day}
            className="text-center text-[9px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide py-1"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid - Fixed aspect ratio cells */}
      <div className="grid grid-cols-7 gap-1 flex-1 min-h-0" style={{ gridTemplateRows: 'repeat(6, minmax(0, 1fr))' }}>
        {/* Empty cells before first day */}
        {Array.from({ length: startingDayOfWeek }).map((_, i) => (
          <div key={`empty-${i}`} />
        ))}

        {/* Days of the month */}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const date = new Date(
            currentDate.getFullYear(),
            currentDate.getMonth(),
            day
          );
          const sessionsOnDay = getSessionsForDate(date);
          const isToday = date.toDateString() === today.toDateString();
          const isPast = date < today && !isToday;
          const isHovered = hoveredDay === day;

          return (
            <div
              key={day}
              className="w-full h-full perspective-1000"
              onMouseEnter={() => setHoveredDay(day)}
              onMouseLeave={() => setHoveredDay(null)}
              onClick={() => onDateClick(date)}
            >
              <div
                className={`
                  relative w-full h-full cursor-pointer
                  transform-style-3d transition-all duration-500 ease-out
                  ${isHovered ? "rotate-y-180" : ""}
                `}
              >
                {/* Front face - Default view */}
                <div
                  className={`
                    absolute inset-0 w-full h-full backface-hidden
                    rounded-md border shadow-sm p-2
                    flex flex-col
                    transition-all duration-300
                    ${
                      isToday
                        ? "bg-gradient-to-br from-blue-500 to-indigo-600 border-blue-400 text-white"
                        : isPast
                        ? "bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-400"
                        : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:border-blue-300 dark:hover:border-blue-700"
                    }
                    ${sessionsOnDay.length > 0 && !isPast ? "ring-1 ring-blue-400/30 dark:ring-blue-600/30" : ""}
                  `}
                >
                  <span className="text-sm font-bold leading-none">{day}</span>
                  {sessionsOnDay.length > 0 && (
                    <div className="flex gap-1 mt-auto flex-wrap">
                      {sessionsOnDay.slice(0, 3).map((session, idx) => {
                        const color = getClientColor(session.client_id?._id || "");
                        return (
                          <div
                            key={idx}
                            className={`w-1 h-1 rounded-full ${
                              isToday ? "bg-white" : color.bg
                            }`}
                          />
                        );
                      })}
                      {sessionsOnDay.length > 3 && (
                        <div className="w-1 h-1 rounded-full bg-slate-400" />
                      )}
                    </div>
                  )}

                  {/* Today indicator badge */}
                  {isToday && (
                    <div className="absolute top-1 right-1">
                      <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                    </div>
                  )}
                </div>

                {/* Back face - Session details (flipped) */}
                <div
                  className={`
                    absolute inset-0 w-full h-full backface-hidden rotate-y-180
                    rounded border overflow-hidden
                    ${
                      isToday
                        ? "bg-gradient-to-br from-indigo-600 to-blue-500 border-blue-400"
                        : "bg-gradient-to-br from-slate-50 to-white dark:from-slate-800 dark:to-slate-900 border-slate-300 dark:border-slate-700"
                    }
                    shadow-md
                  `}
                >
                  {sessionsOnDay.length > 0 ? (
                    <div className="h-full flex flex-col p-0.5 overflow-hidden">
                      {/* Day number at top */}
                      <div className={`text-center mb-0.5 ${isToday ? "text-white" : "text-slate-700 dark:text-slate-300"}`}>
                        <span className="text-[8px] font-bold">{day}</span>
                      </div>

                      {/* Sessions list */}
                      <div className="flex-1 space-y-0.5 overflow-hidden">
                        {sessionsOnDay.slice(0, 2).map((session) => {
                          const color = getClientColor(session.client_id?._id || "");
                          return (
                            <div
                              key={session._id}
                              className={`
                                ${isToday ? "bg-white/20" : color.light}
                                rounded p-1 border-l ${color.border}
                              `}
                            >
                              <div className="flex items-center gap-0.5 mb-0.5">
                                <Avatar className="h-3 w-3">
                                  <AvatarFallback className={`${color.bg} text-white text-[6px]`}>
                                    {getInitials(session.client_id?.name || "UK")}
                                  </AvatarFallback>
                                </Avatar>
                                <span className={`text-[7px] font-bold truncate ${isToday ? "text-white" : color.text}`}>
                                  {session.client_id?.name?.split(" ")[0]}
                                </span>
                              </div>
                              <div className={`text-[6px] flex items-center gap-0.5 ${isToday ? "text-white/90" : "text-slate-600 dark:text-slate-400"}`}>
                                <Clock className="h-1.5 w-1.5" />
                                <span>{formatTime(session.scheduled_date)}</span>
                              </div>
                            </div>
                          );
                        })}
                        {sessionsOnDay.length > 2 && (
                          <div className={`text-center text-[7px] font-semibold ${isToday ? "text-white/80" : "text-slate-500"}`}>
                            +{sessionsOnDay.length - 2} more
                          </div>
                        )}
                      </div>

                      {/* Status indicator */}
                      <div className="mt-2 flex justify-center">
                        <Badge
                          variant="outline"
                          className={`text-[8px] h-4 px-1.5 ${
                            isToday 
                              ? "border-white text-white" 
                              : "border-slate-400 dark:border-slate-600"
                          }`}
                        >
                          {sessionsOnDay.length} session{sessionsOnDay.length !== 1 ? "s" : ""}
                        </Badge>
                      </div>
                    </div>
                  ) : (
                    <div className="h-full flex items-center justify-center">
                      <div className={`text-center ${isToday ? "text-white" : "text-slate-400"}`}>
                        <div className="text-sm font-bold mb-1">{day}</div>
                        <div className="text-[9px]">No sessions</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ThreeDCalendar;
