import { createContext, useContext, useState, useEffect, ReactNode } from "react";

type Language = "en" | "hi";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations = {
  en: {
    // Video Conference
    "video.title": "Video Session",
    "video.startSession": "Start Session",
    "video.endSession": "End Session",
    "video.microphone": "Microphone",
    "video.camera": "Camera",
    "video.transcript": "Live Transcript",
    "video.listening": "Listening...",
    "video.clickToStart": "Click 'Start Session' to begin",
    
    // Sessions
    "sessions.title": "Sessions",
    "sessions.search": "Search sessions by client name...",
    "sessions.noSessions": "No Sessions",
    "sessions.noSessionsDesc": "Start by creating your first therapy session",
    "sessions.noResults": "No Sessions Found",
    
    // Notes
    "notes.title": "Session Notes",
    "notes.search": "Search notes by client name or content...",
    
    // Common
    "common.loading": "Loading...",
    "common.save": "Save",
    "common.cancel": "Cancel",
    "common.delete": "Delete",
    "common.export": "Export",
  },
  hi: {
    // Video Conference
    "video.title": "वीडियो सत्र",
    "video.startSession": "सत्र शुरू करें",
    "video.endSession": "सत्र समाप्त करें",
    "video.microphone": "माइक्रोफ़ोन",
    "video.camera": "कैमरा",
    "video.transcript": "लाइव ट्रांसक्रिप्ट",
    "video.listening": "सुन रहा है...",
    "video.clickToStart": "शुरू करने के लिए 'सत्र शुरू करें' पर क्लिक करें",
    
    // Sessions
    "sessions.title": "सत्र",
    "sessions.search": "ग्राहक के नाम से सत्र खोजें...",
    "sessions.noSessions": "कोई सत्र नहीं",
    "sessions.noSessionsDesc": "अपना पहला थेरेपी सत्र बनाकर शुरू करें",
    "sessions.noResults": "कोई सत्र नहीं मिला",
    
    // Notes
    "notes.title": "सत्र नोट्स",
    "notes.search": "ग्राहक के नाम या सामग्री से नोट्स खोजें...",
    
    // Common
    "common.loading": "लोड हो रहा है...",
    "common.save": "सहेजें",
    "common.cancel": "रद्द करें",
    "common.delete": "हटाएं",
    "common.export": "निर्यात",
  },
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem("app-language");
    return (saved as Language) || "en";
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem("app-language", lang);
  };

  const t = (key: string): string => {
    return translations[language][key as keyof typeof translations.en] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within LanguageProvider");
  }
  return context;
};
