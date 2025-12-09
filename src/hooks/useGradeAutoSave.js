// ============================================
// FILE: src/hooks/useGradeAutoSave.js
// ============================================
// Custom hook khusus untuk auto-save nilai siswa

import { useState, useEffect, useCallback } from "react";

export const useGradeAutoSave = (selectedClass, selectedSubject) => {
  // Generate unique key berdasarkan kelas dan mapel
  const storageKey =
    selectedClass && selectedSubject
      ? `grade-draft-${selectedClass}-${selectedSubject.replace(/\s+/g, "-")}`
      : null;

  const [hasDraft, setHasDraft] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [draftInfo, setDraftInfo] = useState(null);

  // Check apakah ada draft saat mount atau filter berubah
  useEffect(() => {
    if (storageKey) {
      checkForDraft();
    }
  }, [storageKey]);

  const checkForDraft = () => {
    if (!storageKey) return;

    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        const savedTime = parsed.timestamp || 0;
        const now = Date.now();
        const sevenDays = 7 * 24 * 60 * 60 * 1000;

        // Cek apakah draft masih valid (< 7 hari)
        if (now - savedTime < sevenDays) {
          setHasDraft(true);
          setDraftInfo({
            savedAt: new Date(savedTime),
            studentCount: parsed.students?.length || 0,
          });
          return parsed.students;
        } else {
          // Draft expired, hapus
          localStorage.removeItem(storageKey);
          setHasDraft(false);
          setDraftInfo(null);
        }
      }
    } catch (error) {
      console.error("Error checking draft:", error);
    }
    return null;
  };

  // Save draft ke localStorage
  const saveDraft = useCallback(
    (students) => {
      if (!storageKey || !students || students.length === 0) return;

      try {
        const saveData = {
          students: students,
          timestamp: Date.now(),
          class: selectedClass,
          subject: selectedSubject,
        };

        localStorage.setItem(storageKey, JSON.stringify(saveData));
        setLastSaved(new Date().toLocaleTimeString("id-ID"));
        console.log(`✅ Draft auto-saved: ${students.length} students`);
      } catch (error) {
        console.error("Error saving draft:", error);
      }
    },
    [storageKey, selectedClass, selectedSubject]
  );

  // Load draft dari localStorage
  const loadDraft = useCallback(() => {
    const draft = checkForDraft();
    if (draft) {
      console.log(`📂 Draft loaded: ${draft.length} students`);
    }
    return draft;
  }, [storageKey]);

  // Clear draft
  const clearDraft = useCallback(() => {
    if (!storageKey) return;

    try {
      localStorage.removeItem(storageKey);
      setHasDraft(false);
      setDraftInfo(null);
      setLastSaved(null);
      console.log("🗑️ Draft cleared");
    } catch (error) {
      console.error("Error clearing draft:", error);
    }
  }, [storageKey]);

  return {
    hasDraft,
    draftInfo,
    lastSaved,
    saveDraft,
    loadDraft,
    clearDraft,
  };
};
