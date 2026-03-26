import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Language = 'en' | 'az';

interface LanguageState {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations: Record<Language, Record<string, string>> = {
  en: {
    dashboard: 'Dashboard',
    incidents: 'Incidents',
    playbooks: 'Playbooks',
    kb: 'Knowledge Base',
    reports: 'Reports',
    users: 'User Management',
    settings: 'Settings',
    soc_overview: 'SOC Overview',
    total_incidents: 'Total Incidents',
    open_incidents: 'Open Incidents',
    in_progress: 'In Progress',
    closed: 'Closed',
    severity_dist: 'Severity Distribution',
    status_pipeline: 'Incident Status Pipeline',
    search_placeholder: 'Search incidents, IOCs, playbooks...',
    assign_to_me: 'Assign to me',
    close_incident: 'Close Incident',
    ai_analysis: 'AI Analysis',
    add_note: 'Add Note'
  },
  az: {
    dashboard: 'Panel',
    incidents: 'İnsidentlər',
    playbooks: 'Playbuklar',
    kb: 'Bilik Bazası',
    reports: 'Hesabatlar',
    users: 'İstifadəçi İdarəetməsi',
    settings: 'Tənzimləmələr',
    soc_overview: 'SOC İcmalı',
    total_incidents: 'Ümumi İnsidentlər',
    open_incidents: 'Açıq İnsidentlər',
    in_progress: 'İcrada',
    closed: 'Bağlı',
    severity_dist: 'Ciddilik Bölgüsü',
    status_pipeline: 'İnsident Status Borusu',
    search_placeholder: 'İnsident, IOC, playbuk axtar...',
    assign_to_me: 'Özünə təyin et',
    close_incident: 'İnsidenti bağla',
    ai_analysis: 'Sİ Analizi',
    add_note: 'Qeyd əlavə et'
  }
};

export const useLanguageStore = create<LanguageState>()(
  persist(
    (set, get) => ({
      language: 'en',
      setLanguage: (lang) => set({ language: lang }),
      t: (key) => translations[get().language][key] || key,
    }),
    {
      name: 'uimr-language',
    }
  )
);
