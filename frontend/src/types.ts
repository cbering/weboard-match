export interface LookupValue {
  id: number;
  category: string;
  value: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

export type MemberStatus = "aktiv" | "optaget" | "inaktiv";
export type CompanyStatus = "ny" | "screening" | "matchet" | "aktiv" | "afvist";
export type CompanyPhase = "eksistens" | "overlevelse" | "succes" | "takeoff" | "modenhed";

export interface MemberBrief {
  id: number;
  name: string;
  branche: string | null;
  status: MemberStatus;
  email: string | null;
}

export interface Member {
  id: number;
  name: string;
  branche: string | null;
  email: string | null;
  phone: string | null;
  status: MemberStatus;
  ratings: Record<string, number>;
  created_at: string;
  updated_at: string;
}

export interface MemberWithBoards extends Member {
  boards: CompanyBrief[];
}

export interface CompanyBrief {
  id: number;
  name: string;
  phase: CompanyPhase;
  status: CompanyStatus;
}

export interface Company {
  id: number;
  name: string;
  branche: string | null;
  contact: string | null;
  email: string | null;
  phone: string | null;
  phase: CompanyPhase;
  status: CompanyStatus;
  notes: string | null;
  desired: string[];
  board: MemberBrief[];
  created_at: string;
  updated_at: string;
}

export interface BoardAssignment {
  id: number;
  company_id: number;
  member_id: number;
  added_at: string;
  notes: string | null;
  member: MemberBrief;
}

export interface MatchScore {
  member: MemberBrief;
  score: number;
  pct: number;
  matched_competencies: { id: string; val: number }[];
  industry_match: boolean;
  on_board: boolean;
}

export interface MatchResult {
  company_id: number;
  company_name: string;
  phase: string;
  relevant_competencies: string[];
  scores: MatchScore[];
}

export interface DashboardStats {
  total_companies: number;
  new_companies: number;
  total_members: number;
  active_members: number;
  active_boards: number;
  recent_companies: CompanyBrief[];
}

// Reference data
export const COMPETENCIES = [
  { id: "esg",           kat: "Faglig",    navn: "ESG",                                  short: "ESG" },
  { id: "digitalisering",kat: "Faglig",    navn: "Digitalisering og procesoptimering",   short: "Digital" },
  { id: "innovation",    kat: "Faglig",    navn: "Innovation",                            short: "Innovation" },
  { id: "eksport",       kat: "Faglig",    navn: "Eksport og internationalisering",       short: "Eksport" },
  { id: "strategi",      kat: "Faglig",    navn: "Strategi og forretningsudvikling",      short: "Strategi" },
  { id: "hr",            kat: "Faglig",    navn: "HR, organisation og forandringsledelse",short: "HR" },
  { id: "salg",          kat: "Faglig",    navn: "Salg og markedsføring",                short: "Salg" },
  { id: "ivaerksaetter", kat: "Faglig",    navn: "Iværksætter",                          short: "Iværks." },
  { id: "oekonomi",      kat: "Faglig",    navn: "Økonomi",                               short: "Økonomi" },
  { id: "finansiering",  kat: "Faglig",    navn: "Finansiering og M&A",                  short: "Finans." },
  { id: "jura",          kat: "Faglig",    navn: "Jura",                                 short: "Jura" },
  { id: "aktiv_lytning", kat: "Personlig", navn: "Aktiv lytning",                        short: "Lytning" },
  { id: "empatisk",      kat: "Personlig", navn: "Empatisk",                             short: "Empati" },
  { id: "holistisk",     kat: "Personlig", navn: "Holistisk",                            short: "Holistisk" },
  { id: "nysgerrig",     kat: "Personlig", navn: "Nysgerrig",                            short: "Nysgerrig" },
  { id: "udfordrer",     kat: "Personlig", navn: "Udfordrer",                            short: "Udfordrer" },
] as const;

export const PHASE_LABELS: Record<CompanyPhase, string> = {
  eksistens:  "Eksistens",
  overlevelse:"Overlevelse",
  succes:     "Succes (tidlig vækst)",
  takeoff:    "Take-off (hurtig vækst)",
  modenhed:   "Modenhed",
};

export const STATUS_LABELS: Record<CompanyStatus, string> = {
  ny:        "Ny",
  screening: "Screening",
  matchet:   "Matchet",
  aktiv:     "Aktivt board",
  afvist:    "Afvist",
};

export const MEMBER_STATUS_LABELS: Record<MemberStatus, string> = {
  aktiv:   "Aktiv",
  optaget: "Optaget",
  inaktiv: "Inaktiv",
};
