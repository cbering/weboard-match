import { useState, useCallback, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AgGridReact } from "@ag-grid-community/react";
import type { ColDef, ICellRendererParams } from "@ag-grid-community/core";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import { getCompanies, createCompany, updateCompany, deleteCompany } from "../api";
import { PHASE_LABELS, STATUS_LABELS, COMPETENCIES } from "../types";
import type { Company, CompanyPhase, CompanyStatus } from "../types";
import MatchModal from "../components/MatchModal";

const STATUS_COLOR: Record<CompanyStatus, "default" | "warning" | "info" | "success" | "error"> = {
  ny: "warning", screening: "info", matchet: "success", aktiv: "success", afvist: "error",
};

const EMPTY: Partial<Company> = { name: "", branche: "", contact: "", email: "", phone: "", phase: "eksistens", status: "ny", notes: "", desired: [] };

export default function Companies() {
  const qc = useQueryClient();
  const { data: companies = [], isLoading } = useQuery({ queryKey: ["companies"], queryFn: () => getCompanies().then((r) => r.data) });

  const [editing, setEditing] = useState<Partial<Company> | null>(null);
  const [matchCo, setMatchCo] = useState<Company | null>(null);

  const save = useMutation({
    mutationFn: (d: Partial<Company>) => d.id ? updateCompany(d.id, d) : createCompany(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["companies"] }); setEditing(null); },
  });

  const del = useMutation({
    mutationFn: (id: number) => deleteCompany(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["companies"] }); setEditing(null); },
  });

  const onCellValueChanged = useCallback(async (e: any) => {
    await updateCompany(e.data.id, { [e.colDef.field]: e.newValue });
    qc.invalidateQueries({ queryKey: ["companies"] });
  }, [qc]);

  const colDefs = useMemo<ColDef<Company>[]>(() => [
    { field: "name",    headerName: "Virksomhed",   flex: 1.5, editable: true },
    { field: "branche", headerName: "Branche",      flex: 1,   editable: true },
    { field: "phase",   headerName: "Fase",         flex: 1,   editable: true,
      cellEditor: "agSelectCellEditor",
      cellEditorParams: { values: Object.keys(PHASE_LABELS) },
      valueFormatter: (p) => PHASE_LABELS[p.value as CompanyPhase] ?? p.value },
    { field: "status",  headerName: "Status",       width: 130, editable: true,
      cellEditor: "agSelectCellEditor",
      cellEditorParams: { values: Object.keys(STATUS_LABELS) },
      cellRenderer: (p: ICellRendererParams) => p.value
        ? <Chip label={STATUS_LABELS[p.value as CompanyStatus] ?? p.value} size="small" color={STATUS_COLOR[p.value as CompanyStatus] ?? "default"} />
        : null },
    { field: "contact", headerName: "Kontakt",      flex: 1,   editable: true },
    { headerName: "Board", width: 180,
      valueGetter: (p) => (p.data?.board ?? []).map((m: any) => m.name).join(", ") || "—",
      cellStyle: { color: "#647079", fontSize: 12 } },
    { headerName: "",   width: 80, sortable: false, filter: false,
      cellRenderer: (p: ICellRendererParams<Company>) =>
        <Button size="small" variant="outlined" sx={{ fontSize: 11 }} onClick={() => setMatchCo(p.data!)}>Match</Button> },
    { headerName: "",   width: 60, sortable: false, filter: false,
      cellRenderer: (p: ICellRendererParams<Company>) =>
        <Button size="small" sx={{ fontSize: 11, minWidth: 0 }} onClick={() => setEditing(p.data!)}>✏</Button> },
  ], []);

  const form = editing ?? EMPTY;

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h5">Virksomheder</Typography>
        <Button variant="contained" onClick={() => setEditing(EMPTY)}>+ Ny virksomhed</Button>
      </Stack>

      <Box className="ag-theme-quartz" sx={{ height: "calc(100vh - 200px)" }}>
        <AgGridReact
          rowData={companies}
          columnDefs={colDefs}
          defaultColDef={{ sortable: true, filter: true, resizable: true }}
          onCellValueChanged={onCellValueChanged}
          loading={isLoading}
          animateRows
        />
      </Box>

      {/* Edit / Create dialog */}
      <Dialog open={!!editing} onClose={() => setEditing(null)} maxWidth="sm" fullWidth>
        <DialogTitle>{form.id ? "Redigér virksomhed" : "Ny virksomhed"}</DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: "16px !important" }}>
          <TextField label="Virksomhedsnavn *" value={form.name ?? ""} onChange={(e) => setEditing({ ...form, name: e.target.value })} />
          <Stack direction="row" gap={2}>
            <TextField fullWidth label="Branche" value={form.branche ?? ""} onChange={(e) => setEditing({ ...form, branche: e.target.value })} />
            <TextField fullWidth select label="Fase" value={form.phase ?? "eksistens"} onChange={(e) => setEditing({ ...form, phase: e.target.value as CompanyPhase })}>
              {Object.entries(PHASE_LABELS).map(([v, l]) => <MenuItem key={v} value={v}>{l}</MenuItem>)}
            </TextField>
          </Stack>
          <Stack direction="row" gap={2}>
            <TextField fullWidth label="Kontakt" value={form.contact ?? ""} onChange={(e) => setEditing({ ...form, contact: e.target.value })} />
            <TextField fullWidth label="E-mail" type="email" value={form.email ?? ""} onChange={(e) => setEditing({ ...form, email: e.target.value })} />
          </Stack>
          <TextField select label="Status" value={form.status ?? "ny"} onChange={(e) => setEditing({ ...form, status: e.target.value as CompanyStatus })}>
            {Object.entries(STATUS_LABELS).map(([v, l]) => <MenuItem key={v} value={v}>{l}</MenuItem>)}
          </TextField>
          <TextField label="Noter" multiline rows={2} value={form.notes ?? ""} onChange={(e) => setEditing({ ...form, notes: e.target.value })} />
        </DialogContent>
        <DialogActions sx={{ justifyContent: "space-between" }}>
          {form.id ? <Button color="error" onClick={() => { if (confirm("Slet?")) del.mutate(form.id!); }}>Slet</Button> : <span />}
          <Box sx={{ display: "flex", gap: 1 }}>
            <Button onClick={() => setEditing(null)}>Annullér</Button>
            <Button variant="contained" onClick={() => save.mutate(form)} disabled={!form.name}>Gem</Button>
          </Box>
        </DialogActions>
      </Dialog>

      <MatchModal company={matchCo} onClose={() => { setMatchCo(null); qc.invalidateQueries({ queryKey: ["companies"] }); }} />
    </Box>
  );
}
