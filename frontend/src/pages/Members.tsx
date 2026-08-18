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
import Divider from "@mui/material/Divider";
import Slider from "@mui/material/Slider";
import { getMembers, getMember, createMember, updateMember, deleteMember } from "../api";
import { COMPETENCIES, MEMBER_STATUS_LABELS, PHASE_LABELS } from "../types";
import type { Member, MemberStatus, MemberWithBoards } from "../types";

const FAGLIGE   = COMPETENCIES.filter((c) => c.kat === "Faglig");
const PERSONLIGE = COMPETENCIES.filter((c) => c.kat === "Personlig");

type MemberStatus3 = "aktiv" | "optaget" | "inaktiv";
const STATUS_COLOR: Record<MemberStatus3, "success" | "info" | "default"> = { aktiv: "success", optaget: "info", inaktiv: "default" };

const EMPTY: Partial<Member> = { name: "", branche: "", email: "", phone: "", status: "aktiv", ratings: {} };

export default function Members() {
  const qc = useQueryClient();
  const { data: members = [], isLoading } = useQuery({ queryKey: ["members"], queryFn: () => getMembers().then((r) => r.data) });

  const [editing, setEditing] = useState<Partial<Member> | null>(null);
  const [detail, setDetail] = useState<MemberWithBoards | null>(null);

  const openEdit = async (id?: number) => {
    if (id) {
      const { data } = await getMember(id);
      setDetail(data);
      setEditing({ ...data });
    } else {
      setDetail(null);
      setEditing({ ...EMPTY, ratings: Object.fromEntries(COMPETENCIES.map((c) => [c.id, 0])) });
    }
  };

  const save = useMutation({
    mutationFn: (d: Partial<Member>) => d.id ? updateMember(d.id, d) : createMember(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["members"] }); setEditing(null); },
  });

  const del = useMutation({
    mutationFn: (id: number) => deleteMember(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["members"] }); setEditing(null); },
  });

  const onCellValueChanged = useCallback(async (e: any) => {
    await updateMember(e.data.id, { [e.colDef.field]: e.newValue });
    qc.invalidateQueries({ queryKey: ["members"] });
  }, [qc]);

  const colDefs = useMemo<ColDef<Member>[]>(() => [
    { field: "name",    headerName: "Navn",             flex: 1.2, editable: true },
    { field: "branche", headerName: "Branchekendskab",  flex: 1,   editable: true },
    { field: "status",  headerName: "Status",           width: 120, editable: true,
      cellEditor: "agSelectCellEditor",
      cellEditorParams: { values: ["aktiv", "optaget", "inaktiv"] },
      cellRenderer: (p: ICellRendererParams) => p.value
        ? <Chip label={MEMBER_STATUS_LABELS[p.value as MemberStatus3] ?? p.value} size="small" color={STATUS_COLOR[p.value as MemberStatus3] ?? "default"} />
        : null },
    { field: "email",   headerName: "E-mail",           flex: 1,   editable: true },
    { headerName: "Top-kompetencer", flex: 1.5, sortable: false,
      valueGetter: (p) => {
        if (!p.data?.ratings) return "";
        return Object.entries(p.data.ratings)
          .filter(([, v]) => v > 0)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 3)
          .map(([id, v]) => `${COMPETENCIES.find((c) => c.id === id)?.short ?? id} (${v})`)
          .join(", ");
      }},
    { headerName: "Virksomheder", flex: 1, sortable: false,
      valueGetter: () => "" },
    { headerName: "", width: 110, sortable: false, filter: false,
      cellRenderer: (p: ICellRendererParams<Member>) =>
        <Button size="small" variant="outlined" sx={{ fontSize: 11 }} onClick={() => openEdit(p.data!.id)}>Kompetencer</Button> },
  ], []);

  const ratings = editing?.ratings ?? {};
  const setRating = (id: string, val: number) => setEditing((e) => ({ ...e!, ratings: { ...e!.ratings, [id]: val } }));

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h5">Medlemmer</Typography>
        <Button variant="contained" onClick={() => openEdit()}>+ Nyt medlem</Button>
      </Stack>

      <Box className="ag-theme-quartz" sx={{ height: "calc(100vh - 200px)" }}>
        <AgGridReact
          rowData={members}
          columnDefs={colDefs}
          defaultColDef={{ sortable: true, filter: true, resizable: true }}
          onCellValueChanged={onCellValueChanged}
          loading={isLoading}
          animateRows
        />
      </Box>

      <Dialog open={!!editing} onClose={() => setEditing(null)} maxWidth="sm" fullWidth>
        <DialogTitle>{editing?.id ? `Redigér: ${editing.name}` : "Nyt medlem"}</DialogTitle>
        <DialogContent sx={{ pt: "16px !important" }}>
          <Stack gap={2}>
            <Stack direction="row" gap={2}>
              <TextField fullWidth label="Navn *" value={editing?.name ?? ""} onChange={(e) => setEditing({ ...editing!, name: e.target.value })} />
              <TextField fullWidth label="Branchekendskab" value={editing?.branche ?? ""} onChange={(e) => setEditing({ ...editing!, branche: e.target.value })} />
            </Stack>
            <Stack direction="row" gap={2}>
              <TextField fullWidth label="E-mail" type="email" value={editing?.email ?? ""} onChange={(e) => setEditing({ ...editing!, email: e.target.value })} />
              <TextField fullWidth select label="Status" value={editing?.status ?? "aktiv"} onChange={(e) => setEditing({ ...editing!, status: e.target.value as MemberStatus })}>
                {Object.entries(MEMBER_STATUS_LABELS).map(([v, l]) => <MenuItem key={v} value={v}>{l}</MenuItem>)}
              </TextField>
            </Stack>

            {/* Boards (read-only) */}
            {detail?.boards && detail.boards.length > 0 && (
              <Box>
                <Typography variant="overline" color="primary" fontWeight={700}>Tilknyttede virksomheder</Typography>
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, mt: 0.5 }}>
                  {detail.boards.map((b) => <Chip key={b.id} label={b.name} size="small" />)}
                </Box>
              </Box>
            )}

            <Divider />
            <Typography variant="overline" color="primary" fontWeight={700}>Faglige kompetencer (0=ingen · 3=ekspert)</Typography>
            {FAGLIGE.map((c) => (
              <Box key={c.id}>
                <Typography variant="caption">{c.navn} — <strong>{ratings[c.id] ?? 0}</strong></Typography>
                <Slider min={0} max={3} step={1} marks value={ratings[c.id] ?? 0} onChange={(_, v) => setRating(c.id, v as number)} color="primary" size="small" />
              </Box>
            ))}
            <Divider />
            <Typography variant="overline" color="primary" fontWeight={700}>Personlige kompetencer</Typography>
            {PERSONLIGE.map((c) => (
              <Box key={c.id}>
                <Typography variant="caption">{c.navn} — <strong>{ratings[c.id] ?? 0}</strong></Typography>
                <Slider min={0} max={3} step={1} marks value={ratings[c.id] ?? 0} onChange={(_, v) => setRating(c.id, v as number)} color="primary" size="small" />
              </Box>
            ))}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ justifyContent: "space-between" }}>
          {editing?.id ? <Button color="error" onClick={() => { if (confirm("Slet?")) del.mutate(editing.id!); }}>Slet</Button> : <span />}
          <Box sx={{ display: "flex", gap: 1 }}>
            <Button onClick={() => setEditing(null)}>Annullér</Button>
            <Button variant="contained" onClick={() => save.mutate(editing!)} disabled={!editing?.name}>Gem</Button>
          </Box>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
