import { useState } from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Container from "@mui/material/Container";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import TextField from "@mui/material/TextField";
import Alert from "@mui/material/Alert";
import { useLocation } from "react-router-dom";
import { useAuthStore } from "../store";
import { getMe, changePassword } from "../api";
import { useQuery } from "@tanstack/react-query";

const BASE_TABS = [
  { label: "Oversigt",         path: "/dashboard",      adminOnly: false },
  { label: "Virksomheder",     path: "/virksomheder",   adminOnly: false },
  { label: "Medlemmer",        path: "/medlemmer",      adminOnly: false },
  { label: "Kompetencematrix", path: "/matrix",         adminOnly: false },
  { label: "Admin",            path: "/admin",          adminOnly: true  },
];

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const logout = useAuthStore((s) => s.logout);
  const role = useAuthStore((s) => s.role);

  const { data: me } = useQuery({ queryKey: ["me"], queryFn: () => getMe().then((r) => r.data) });

  const TABS = BASE_TABS.filter((t) => !t.adminOnly || role === "admin");
  const current = TABS.findIndex((t) => location.pathname.startsWith(t.path));

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [pwOpen, setPwOpen] = useState(false);
  const [pw, setPw] = useState("");
  const [pwError, setPwError] = useState("");
  const [pwSaving, setPwSaving] = useState(false);

  const handleLogout = () => { logout(); navigate("/login"); };

  const handlePwSave = async () => {
    if (!pw || !me?.id) return;
    setPwSaving(true);
    setPwError("");
    try {
      await changePassword(me.id, pw);
      setPwOpen(false);
      setPw("");
    } catch (e: any) {
      setPwError(e.response?.data?.detail ?? "Fejl ved skift af adgangskode");
    } finally {
      setPwSaving(false);
    }
  };

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

          <Button
            size="small"
            sx={{ color: "rgba(255,255,255,.75)", textTransform: "none", fontSize: 12 }}
            onClick={(e) => setAnchorEl(e.currentTarget)}
          >
            {me?.email ?? role} ▾
          </Button>
          <Menu anchorEl={anchorEl} open={!!anchorEl} onClose={() => setAnchorEl(null)}>
            <MenuItem disabled sx={{ fontSize: 12, color: "text.secondary", opacity: "1 !important" }}>
              {me?.email}<br />
              <Typography component="span" variant="caption" color="text.disabled">{role}</Typography>
            </MenuItem>
            <MenuItem onClick={() => { setAnchorEl(null); setPwOpen(true); setPw(""); setPwError(""); }}>
              Skift adgangskode
            </MenuItem>
            <MenuItem onClick={handleLogout} sx={{ color: "error.main" }}>Log ud</MenuItem>
          </Menu>
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

      <Box component="footer" sx={{ py: 1.5, px: 3, borderTop: "1px solid", borderColor: "divider", display: "flex", justifyContent: "flex-end" }}>
        <Typography variant="caption" color="text.disabled">
          WeBoard Match v{__APP_VERSION__}
        </Typography>
      </Box>

      {/* Change password dialog */}
      <Dialog open={pwOpen} onClose={() => setPwOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Skift adgangskode</DialogTitle>
        <DialogContent sx={{ pt: "16px !important" }}>
          {pwError && <Alert severity="error" sx={{ mb: 2 }}>{pwError}</Alert>}
          <TextField
            fullWidth label="Ny adgangskode" type="password"
            value={pw} onChange={(e) => setPw(e.target.value)}
            autoFocus onKeyDown={(e) => e.key === "Enter" && handlePwSave()}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPwOpen(false)}>Annullér</Button>
          <Button variant="contained" disabled={!pw || pwSaving} onClick={handlePwSave}>
            {pwSaving ? "Gemmer…" : "Gem"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
