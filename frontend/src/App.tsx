import { Navigate, Route, Routes } from "react-router-dom";
import { useAuthStore } from "./store";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Companies from "./pages/Companies";
import Members from "./pages/Members";
import Matrix from "./pages/Matrix";

function RequireAuth({ children }: { children: React.ReactNode }) {
  const token = useAuthStore((s) => s.token);
  return token ? <>{children}</> : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <RequireAuth>
            <Layout />
          </RequireAuth>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard"   element={<Dashboard />} />
        <Route path="virksomheder" element={<Companies />} />
        <Route path="medlemmer"   element={<Members />} />
        <Route path="matrix"      element={<Matrix />} />
      </Route>
    </Routes>
  );
}
