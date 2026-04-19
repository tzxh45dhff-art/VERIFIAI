import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AuditResult, BiasFlag, BiasReport, ApplicationData, ReevalResult } from "@/lib/types";

interface AuditState {
  caseId: string | null;
  applicationData: ApplicationData | null;
  rejectionLetter: string | null;
  auditResult: AuditResult | null;
  biasReport: BiasReport | null;
  biasFlags: BiasFlag[];
  reevalResult: ReevalResult | null;
  currentStep: 1 | 2 | 3 | 4;

  setCaseData: (data: ApplicationData) => void;
  setAuditResult: (result: AuditResult) => void;
  setBiasReport: (report: BiasReport) => void;
  setBiasFlags: (flags: BiasFlag[]) => void;
  setRejectionLetter: (letter: string) => void;
  setReevalResult: (result: ReevalResult) => void;
  reset: () => void;
}

export const useAuditStore = create<AuditState>()(
  persist(
    (set) => ({
      caseId: null, applicationData: null, rejectionLetter: null,
      auditResult: null, biasReport: null, biasFlags: [],
      reevalResult: null, currentStep: 1,

      setCaseData: (data) => set({ applicationData: data, caseId: data.application_id }),
      setAuditResult: (result) => set({ auditResult: result, currentStep: 3 }),
      setBiasReport: (report) => set({ biasReport: report, currentStep: 2 }),
      setBiasFlags: (flags) => set({ biasFlags: flags }),
      setRejectionLetter: (letter) => set({ rejectionLetter: letter }),
      setReevalResult: (result) => set({ reevalResult: result, currentStep: 4 }),
      reset: () => set({ caseId: null, applicationData: null, rejectionLetter: null, auditResult: null, biasReport: null, biasFlags: [], reevalResult: null, currentStep: 1 }),
    }),
    { name: "verifiai-audit" }
  )
);
