import type { ResultStatus } from "@/lib/screening";

export interface ElderProfile {
  id: string;
  name: string;
  age: number;
  relation: string;
  phone: string;
  lastCheckAt: string;
  shareResults: boolean;
  status: ResultStatus;
  statusSummary: string;
}

export interface HelpRequest {
  id: string;
  elderId: string;
  elderName: string;
  phone: string;
  requestedAt: string;
  relativeTime: string;
  message: string;
  status: "pending" | "resolved";
  resolvedAt?: string;
}

export interface SignalDayData {
  date: string;
  dayShort: string;
  dayName: string;
  isToday?: boolean;
  overall: ResultStatus;
  energy: ResultStatus;
  sleep: ResultStatus;
  symptoms: ResultStatus;
  activity: ResultStatus;
  notes?: string;
}

export type FollowUpType = "call" | "medicine" | "visit" | "recheck" | "other";

export interface FollowUpAction {
  id: string;
  elderId: string;
  type: FollowUpType;
  typeLabel: string;
  note: string;
  recordedAt: string;
  caregiverName: string;
}

export interface AnswerDetail {
  nodeId: string;
  topic: string;
  question: string;
  answerText: string;
  isCritical?: boolean;
  flag?: "ok" | "warn" | "alert";
}

export interface ExaminationRecord {
  id: string;
  timestamp: string;
  dateFormatted: string;
  timeFormatted: string;
  mode: "mandiri" | "caregiver";
  status: ResultStatus;
  headline: string;
  summary: string;
  reasons: string[];
  answers: AnswerDetail[];
}
