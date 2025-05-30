import React, { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { getUserProfile } from "@/lib/mongodb";
import i18n, { initializeI18n } from "@/i18n";

interface LanguageContextProps {
  language: string;
  setLanguage: (lang: string) => void;
}

const LanguageContext = createContext<LanguageContextProps>({
  language: "en",
  setLanguage: () => {},
});

export const LanguageProvider = ({ children }: { children: React.ReactNode }) => {
  const { user, userReady } = useAuth();
  const [language, setLanguageState] = useState("en");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUserLanguage() {
      setLoading(true);
      let lang = "en";
      if (user && userReady) {
        const { data } = await getUserProfile(user.id);
        if (data && data.language) {
          lang = data.language;
        }
      }
      setLanguageState(lang);
      initializeI18n(lang); // Initialize i18n with the correct language
      setLoading(false);
    }
    loadUserLanguage();
    // eslint-disable-next-line
  }, [user, userReady]);

  const setLanguage = (lang: string) => {
    setLanguageState(lang);
    i18n.changeLanguage(lang);
  };

  if (loading) return null;

  return (
    <LanguageContext.Provider value={{ language, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
