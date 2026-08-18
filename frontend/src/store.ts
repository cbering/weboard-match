import { create } from "zustand";

interface AuthState {
  token: string | null;
  role: string | null;
  memberId: number | null;
  setAuth: (token: string, role: string, memberId: number | null) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: localStorage.getItem("wb_token"),
  role: localStorage.getItem("wb_role"),
  memberId: localStorage.getItem("wb_member_id") ? Number(localStorage.getItem("wb_member_id")) : null,
  setAuth: (token, role, memberId) => {
    localStorage.setItem("wb_token", token);
    localStorage.setItem("wb_role", role);
    if (memberId != null) localStorage.setItem("wb_member_id", String(memberId));
    else localStorage.removeItem("wb_member_id");
    set({ token, role, memberId });
  },
  logout: () => {
    localStorage.removeItem("wb_token");
    localStorage.removeItem("wb_role");
    localStorage.removeItem("wb_member_id");
    set({ token: null, role: null, memberId: null });
  },
}));
