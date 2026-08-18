import { Outlet, NavLink, useNavigate } from "react-router-dom";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Container from "@mui/material/Container";
import { useLocation } from "react-router-dom";
import { useAuthStore } from "../store";

const TABS = [
  { label: "Oversigt",       path: "/dashboard" },
  { label: "Virksomheder",   path: "/virksomheder" },
  { label: "Medlemmer",      path: "/medlemmer" },
  { label: "Kompetencematrix", path: "/matrix" },
];

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const logout = useAuthStore((s) => s.logout);
  const role = useAuthStore((s) => s.role);

  const current = TABS.findIndex((t) => location.pathname.startsWith(t.path));

  return (
    <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <AppBar position="static" color="secondary" elevation={0}>
        <Toolbar sx={{ gap: 2 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexGrow: 1 }}>
            <Box sx={{ width: 32, height: 32, bgcolor: "primary.main", borderRadius: 1.5, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 12, color: "#fff" }}>WB</Box>
            <Box>
              <Typography variant="subtitle1" fontWeight={700} lineHeight={1.2}>WeBoard Match</Typography>
              <Typography variant="caption" sx={{ color: "rgba(255,255,255,.55)", display: "block", lineHeight: 1 }}>Advisory board matching</Typography>
            </Box>
          </Box>
          <Typography variant="caption" sx={{ color: "rgba(255,255,255,.6)" }}>{role}</Typography>
          <Button size="small" sx={{ color: "rgba(255,255,255,.7)" }} onClick={() => { logout(); navigate("/login"); }}>Log ud</Button>
        </Toolbar>
        <Tabs
          value={current >= 0 ? current : false}
          textColor="inherit"
          TabIndicatorProps={{ style: { backgroundColor: "#1f8a7a", height: 3 } }}
          sx={{ bgcolor: "#1c3d54", px: 1, minHeight: 40, "& .MuiTab-root": { minHeight: 40, fontSize: 13, fontWeight: 500, color: "rgba(255,255,255,.65)", "&.Mui-selected": { color: "#fff" } } }}
        >
          {TABS.map((t) => (
            <Tab key={t.path} label={t.label} component={NavLink} to={t.path} />
          ))}
        </Tabs>
      </AppBar>
      <Box component="main" sx={{ flexGrow: 1, bgcolor: "background.default", py: 3 }}>
        <Container maxWidth="xl">
          <Outlet />
        </Container>
      </Box>
    </Box>
  );
}
