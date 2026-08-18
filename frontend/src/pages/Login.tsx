import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import Alert from "@mui/material/Alert";
import { login } from "../api";
import { useAuthStore } from "../store";

export default function Login() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const { data } = await login(email, password);
      setAuth(data.access_token, data.role, data.member_id);
      navigate("/dashboard", { replace: true });
    } catch (err: any) {
      setError(err.response?.data?.detail ?? "Loginfejl");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", bgcolor: "#f0f2f1" }}>
      <Card sx={{ maxWidth: 400, width: "100%", mx: 2 }}>
        <CardContent sx={{ p: 4 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 3 }}>
            <Box sx={{ width: 40, height: 40, bgcolor: "#1f8a7a", borderRadius: 1.5, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, color: "#fff", fontSize: 14 }}>WB</Box>
            <Box>
              <Typography variant="h6" fontWeight={700} lineHeight={1.1}>WeBoard Match</Typography>
              <Typography variant="caption" color="text.secondary">Advisory board matching</Typography>
            </Box>
          </Box>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <form onSubmit={submit}>
            <TextField fullWidth label="E-mail" type="email" value={email} onChange={(e) => setEmail(e.target.value)} margin="normal" required autoFocus />
            <TextField fullWidth label="Adgangskode" type="password" value={password} onChange={(e) => setPassword(e.target.value)} margin="normal" required />
            <Button fullWidth variant="contained" type="submit" disabled={loading} sx={{ mt: 2.5, py: 1.2 }}>
              {loading ? "Logger ind…" : "Log ind"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
}
