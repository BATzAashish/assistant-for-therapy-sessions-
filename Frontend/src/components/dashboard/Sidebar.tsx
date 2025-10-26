import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { 
  LayoutDashboard, 
  Users, 
  Calendar, 
  UserPlus, 
  Video,
  FileText,
  Settings,
  LogOut,
  Brain,
  ChevronLeft,
  ChevronRight,
  Moon,
  Sun
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { authAPI } from "@/lib/api";
import { useTheme } from "@/components/theme-provider";
import { useSidebar } from "@/contexts/SidebarContext";

interface SidebarProps {
  user?: {
    full_name: string;
    email: string;
    specialization?: string;
  };
}

const Sidebar = ({ user }: SidebarProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const { collapsed, setCollapsed } = useSidebar();

  const menuItems = [
    { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
    { icon: Users, label: "Clients", path: "/dashboard/clients" },
    { icon: Calendar, label: "Calendar", path: "/dashboard/calendar" },
    { icon: Video, label: "Sessions", path: "/dashboard/sessions" },
    { icon: FileText, label: "Notes", path: "/dashboard/notes" },
    { icon: UserPlus, label: "Add Client", path: "/dashboard/add-client" },
  ];

  const handleLogout = () => {
    authAPI.logout();
    navigate("/");
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getDisplayName = (name: string) => {
    // Add "Dr." prefix if not already present
    if (name.toLowerCase().startsWith("dr.") || name.toLowerCase().startsWith("dr ")) {
      return name;
    }
    return `Dr. ${name}`;
  };

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  return (
    <aside
      className={`${
        collapsed ? "w-20" : "w-64"
      } h-screen bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col transition-all duration-300 fixed left-0 top-0 z-40`}
    >
      {/* Header */}
      <div className={`${collapsed ? "px-2" : "p-4"} py-4 border-b border-slate-200 dark:border-slate-800 flex items-center ${collapsed ? "justify-center" : "justify-between"}`}>
        {!collapsed && (
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
              <Brain className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-semibold text-slate-900 dark:text-white">
              TherapyHub
            </span>
          </div>
        )}
        {collapsed && (
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
            <Brain className="h-5 w-5 text-white" />
          </div>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCollapsed(!collapsed)}
          className={`${collapsed ? "ml-0" : "ml-auto"}`}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* User Profile */}
      {user && (
        <div className={`${collapsed ? "px-2" : "p-4"} py-4 border-b border-slate-200 dark:border-slate-800`}>
          <div className={`flex items-center ${collapsed ? "justify-center" : "space-x-3"}`}>
            <Avatar className="h-10 w-10 flex-shrink-0">
              <AvatarFallback className="bg-gradient-to-br from-violet-500 to-purple-600 text-white font-semibold">
                {getInitials(user.full_name)}
              </AvatarFallback>
            </Avatar>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                  {user && getDisplayName(user.full_name)}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                  {user?.specialization || "Clinical Psychologist"}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Navigation Menu */}
      <nav className={`flex-1 ${collapsed ? "px-1.5 py-2" : "p-4"} space-y-1 overflow-y-auto`}>
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;

          return (
            <Link key={item.path} to={item.path} title={collapsed ? item.label : ""}>
              <Button
                variant={isActive ? "secondary" : "ghost"}
                className={`w-full ${collapsed ? "h-10 px-0" : "h-10 px-4"} justify-center ${collapsed ? "" : "justify-start"} ${
                  isActive
                    ? "bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <Icon className="h-5 w-5" />
                {!collapsed && <span className="ml-3">{item.label}</span>}
              </Button>
            </Link>
          );
        })}
      </nav>

      {/* Bottom Actions */}
      <div className={`${collapsed ? "px-1.5 py-2" : "p-4"} border-t border-slate-200 dark:border-slate-800 space-y-1`}>
        <Button
          variant="ghost"
          className={`w-full h-10 ${collapsed ? "px-0" : "px-4"} justify-center ${collapsed ? "" : "justify-start"} text-slate-600 dark:text-slate-400`}
          onClick={toggleTheme}
          title={collapsed ? (theme === "dark" ? "Light Mode" : "Dark Mode") : ""}
        >
          {theme === "dark" ? (
            <>
              <Sun className="h-5 w-5" />
              {!collapsed && <span className="ml-3">Light Mode</span>}
            </>
          ) : (
            <>
              <Moon className="h-5 w-5" />
              {!collapsed && <span className="ml-3">Dark Mode</span>}
            </>
          )}
        </Button>
        <Button
          variant="ghost"
          className={`w-full h-10 ${collapsed ? "px-0" : "px-4"} justify-center ${collapsed ? "" : "justify-start"} text-slate-600 dark:text-slate-400`}
          onClick={() => navigate("/dashboard/settings")}
          title={collapsed ? "Settings" : ""}
        >
          <Settings className="h-5 w-5" />
          {!collapsed && <span className="ml-3">Settings</span>}
        </Button>
        <Button
          variant="ghost"
          className={`w-full h-10 ${collapsed ? "px-0" : "px-4"} justify-center ${collapsed ? "" : "justify-start"} text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300`}
          onClick={handleLogout}
          title={collapsed ? "Logout" : ""}
        >
          <LogOut className="h-5 w-5" />
          {!collapsed && <span className="ml-3">Logout</span>}
        </Button>
      </div>
    </aside>
  );
};

export default Sidebar;
