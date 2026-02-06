/**
 * Pings - Senior Store
 * State management for senior app
 */

import { create } from "zustand";

interface SeniorState {
  lastCheckIn: string | null;
  medicationsTaken: boolean;
  heartRate: number | null;
  responses: CheckInResponse[];
  markMedsTaken: () => void;
  setHeartRate: (rate: number) => void;
  addResponse: (response: CheckInResponse) => void;
}

interface CheckInResponse {
  id: string;
  timestamp: Date;
  type: "checkin" | "meds" | "photo" | "call";
  value: string;
}

export const useSeniorStore = create<SeniorState>((set) => ({
  lastCheckIn: null,
  medicationsTaken: false,
  heartRate: null,
  responses: [],

  markMedsTaken: () => set({ medicationsTaken: true }),
  setHeartRate: (rate) => set({ heartRate: rate }),
  addResponse: (response) =>
    set((state) => ({
      responses: [response, ...state.responses].slice(0, 50),
    })),
}));
