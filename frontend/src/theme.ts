import { createTheme } from "@mui/material/styles";

export const theme = createTheme({
  palette: {
    primary:   { main: "#1f8a7a", contrastText: "#fff" },
    secondary: { main: "#132a3a" },
    background: { default: "#f0f2f1", paper: "#ffffff" },
  },
  typography: {
    fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
    h5: { fontWeight: 700 },
    h6: { fontWeight: 700 },
  },
  shape: { borderRadius: 10 },
  components: {
    MuiButton:     { defaultProps: { disableElevation: true } },
    MuiCard:       { defaultProps: { elevation: 0 }, styleOverrides: { root: { border: "1px solid #e0e3df" } } },
    MuiChip:       { styleOverrides: { root: { fontWeight: 600 } } },
    MuiTableHead:  { styleOverrides: { root: { "& th": { fontWeight: 700, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em", color: "#647079" } } } },
  },
});
