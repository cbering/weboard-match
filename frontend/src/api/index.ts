import client from "./client";
import type {
  Company, CompanyBrief, Member, MemberWithBoards,
  BoardAssignment, MatchResult, DashboardStats, LookupValue
} from "../types";

// Auth
export const login = (email: string, password: string) =>
  client.post<{ access_token: string; role: string; member_id: number | null }>("/auth/login", { email, password });

export const getMe = () => client.get("/auth/me");

// Members
export const getMembers = () => client.get<Member[]>("/members");
export const getMember = (id: number) => client.get<MemberWithBoards>(`/members/${id}`);
export const createMember = (data: Partial<Member>) => client.post<Member>("/members", data);
export const updateMember = (id: number, data: Partial<Member>) => client.put<Member>(`/members/${id}`, data);
export const deleteMember = (id: number) => client.delete(`/members/${id}`);

// Companies
export const getCompanies = () => client.get<Company[]>("/companies");
export const getCompany = (id: number) => client.get<Company>(`/companies/${id}`);
export const createCompany = (data: Partial<Company>) => client.post<Company>("/companies", data);
export const updateCompany = (id: number, data: Partial<Company>) => client.put<Company>(`/companies/${id}`, data);
export const deleteCompany = (id: number) => client.delete(`/companies/${id}`);
export const getDashboard = () => client.get<DashboardStats>("/companies/dashboard");

// Matching
export const matchCompany = (id: number) => client.get<MatchResult>(`/companies/${id}/match`);

// Board
export const addToBoard = (companyId: number, memberId: number) =>
  client.post<BoardAssignment>(`/companies/${companyId}/board/${memberId}`);
export const removeFromBoard = (companyId: number, memberId: number) =>
  client.delete(`/companies/${companyId}/board/${memberId}`);

// Lookups
export const getLookups = (category: string) =>
  client.get<LookupValue[]>(`/lookups/${category}`);
export const getAllLookups = () =>
  client.get<LookupValue[]>("/lookups");
export const createLookupValue = (data: Omit<LookupValue, "id" | "created_at">) =>
  client.post<LookupValue>("/lookups", data);
export const updateLookupValue = (id: number, data: Partial<LookupValue>) =>
  client.put<LookupValue>(`/lookups/${id}`, data);
export const deleteLookupValue = (id: number) =>
  client.delete(`/lookups/${id}`);
