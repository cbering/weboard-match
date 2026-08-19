import { useQuery } from "@tanstack/react-query";
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import Box from "@mui/material/Box";
import Skeleton from "@mui/material/Skeleton";
import { getDashboard } from "../api";
import { STATUS_LABELS, PHASE_LABELS } from "../types";
import type { CompanyStatus, CompanyPhase } from "../types";

const STATUS_COLOR: Record<CompanyStatus, "default" | "warning" | "info" | "success" | "error"> = {
  ny: "warning", screening: "info", matchet: "success", aktiv: "success", afvist: "error",
};

function StatCard({ num, label }: { num: number; label: string }) {
  return (
    <Card>
      <CardContent>
        <Typography variant="h3" fontWeight={800} color="primary.main" sx={{ fontVariantNumeric: "tabular-nums" }}>{num}</Typography>
        <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ textTransform: "uppercase", letterSpacing: ".05em" }}>{label}</Typography>
      </CardContent>
    </Card>
  );
}

export default function Dashboard() {
  const { data, isLoading } = useQuery({ queryKey: ["dashboard"], queryFn: () => getDashboard().then((r) => r.data) });

  if (isLoading) return <Skeleton variant="rectangular" height={200} sx={{ borderRadius: 2 }} />;
  if (!data) return null;

  return (
    <Box>
      <Typography variant="h5" mb={2}>Oversigt</Typography>
      <Grid container spacing={2} mb={3}>
        <Grid item xs={6} sm={4} md={2.4}><StatCard num={data.total_companies} label="Virksomheder" /></Grid>
        <Grid item xs={6} sm={4} md={2.4}><StatCard num={data.new_companies} label="Nye ansøgninger" /></Grid>
        <Grid item xs={6} sm={4} md={2.4}><StatCard num={data.total_members} label="Medlemmer" /></Grid>
        <Grid item xs={6} sm={4} md={2.4}><StatCard num={data.active_members} label="Aktive" /></Grid>
        <Grid item xs={6} sm={4} md={2.4}><StatCard num={data.active_boards} label="Aktive boards" /></Grid>
      </Grid>

      <Card>
        <CardContent>
          <Typography variant="h6" mb={2}>Nye ansøgninger</Typography>
          {data.recent_companies.length === 0 && <Typography color="text.secondary">Ingen nye ansøgninger.</Typography>}
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
            {data.recent_companies.map((c) => (
              <Box key={c.id} sx={{ display: "flex", alignItems: "center", gap: 1, p: 1.5, border: "1px solid", borderColor: "divider", borderRadius: 2 }}>
                <Box sx={{ flex: 1 }}>
                  <Typography fontWeight={600}>{c.name}</Typography>
                  <Typography variant="caption" color="text.secondary">{PHASE_LABELS[c.phase as CompanyPhase]}</Typography>
                </Box>
                <Chip label={STATUS_LABELS[c.status as CompanyStatus]} color={STATUS_COLOR[c.status as CompanyStatus]} size="small" />
              </Box>
            ))}
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
