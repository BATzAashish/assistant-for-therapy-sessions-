import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { Globe } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export const LanguageSelector = ({ collapsed }: { collapsed?: boolean }) => {
  const { language, setLanguage } = useLanguage();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className={`w-full h-10 ${collapsed ? "px-0" : "px-4"} justify-center ${
            collapsed ? "" : "justify-start"
          } text-slate-600 dark:text-slate-400`}
          title={collapsed ? "Change Language" : ""}
        >
          <Globe className="h-5 w-5" />
          {!collapsed && (
            <span className="ml-3">{language === "en" ? "English" : "हिंदी"}</span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        <DropdownMenuItem
          onClick={() => setLanguage("en")}
          className={language === "en" ? "bg-blue-50 dark:bg-blue-950" : ""}
        >
          <span className="mr-2">🇬🇧</span>
          English
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setLanguage("hi")}
          className={language === "hi" ? "bg-blue-50 dark:bg-blue-950" : ""}
        >
          <span className="mr-2">🇮🇳</span>
          हिंदी (Hindi)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
