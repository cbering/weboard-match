import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import Chip from "@mui/material/Chip";
import Paper from "@mui/material/Paper";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Divider from "@mui/material/Divider";
import Table from "@mui/material/Table";
import TableHead from "@mui/material/TableHead";
import TableBody from "@mui/material/TableBody";
import TableRow from "@mui/material/TableRow";
import TableCell from "@mui/material/TableCell";
import Switch from "@mui/material/Switch";
import {
  getAllLookups, createLookupValue, updateLookupValue, deleteLookupValue,
  getUsers, createUser, updateUser, changePassword, deleteUser, getMembers,
} from "../api";
import type { LookupValue, UserRecord } from "../types";
import { useAuthStore } from "../store";

const CATEGORY_LABELS: Record<string, string> = {
  branche: "Branchekendskab",
};

// ── Users ────────────────────────────────────────────────────────────

type UserForm = {
  id?: number;
  email: string;
  password: string;
  role: "admin" | "member";
  member_id: number | null;
  is_active: boolean;
};

const EMPTY_USER: UserForm = { email: "", password: "", role: "member", member_id: null, is_active: true };

function UsersPanel() {
  const qc = useQueryClient();
  const selfId = useAuthStore((s) => s.memberId); // used to prevent self-delete
  const { data: users = [] } = useQuery({ queryKey: ["users"], queryFn: () => getUsers().then((r) => r.data) });
  const { data: members = [] } = useQuery({ queryKey: ["members"], queryFn: () => getMembers().then((r) => r.data) });

  const [editing, setEditing] = useState<UserForm | null>(null);
  const [pwDialog, setPwDialog] = useState<{ id: number; email: string } | null>(null);
  const [newPw, setNewPw] = useState("");

  const save = useMutation({
    mutationFn: (d: UserForm) =>
      d.id
        ? updateUser(d.id, { email: d.email, role: d.role, member_id: d.member_id, is_active: d.is_active })
        : createUser({ email: d.email, password: d.password, role: d.role, member_id: d.member_id }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["users"] }); setEditing(null); },
  });

  const del = useMutation({
    mutationFn: (id: number) => deleteUser(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["users"] }),
  });

  const savePw = useMutation({
    mutationFn: ({ id, pw }: { id: number; pw: string }) => changePassword(id, pw),
    onSuccess: () => { setPwDialog(null); setNewPw(""); },
  });

  const toggleActive = useMutation({
    mutationFn: ({ id, is_active }: { id: number; is_active: boolean }) => updateUser(id, { is_active }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["users"] }),
  });

  const memberName = (id: number | null) =>
    id ? (members.find((m) => m.id === id)?.name ?? `#${id}`) : "—";

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="subtitle1" fontWeight={700}>Brugere</Typography>
        <Button variant="outlined" size="small" onClick={() => setEditing({ ...EMPTY_USER })}>+ Opret bruger</Button>
      </Stack>

      <Paper variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow sx={{ "& th": { fontWeight: 700, fontSize: 12, color: "text.secondary" } }}>
              <TableCell>E-mail</TableCell>
              <TableCell>Rolle</TableCell>
              <TableCell>Tilknyttet medlem</TableCell>
              <TableCell align="center">Aktiv</TableCell>
              <TableCell align="right">Handlinger</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((u) => (
              <TableRow key={u.id} hover sx={{ opacity: u.is_active ? 1 : 0.5 }}>
                <TableCell sx={{ fontSize: 13 }}>{u.email}</TableCell>
                <TableCell>
                  <Chip
                    label={u.role === "admin" ? "Admin" : "Medlem"}
                    size="small"
                    color={u.role === "admin" ? "primary" : "default"}
                  />
                </TableCell>
                <TableCell sx={{ fontSize: 13 }}>{memberName(u.member_id)}</TableCell>
                <TableCell align="center">
                  <Switch
                    size="small"
                    checked={u.is_active}
                    onChange={() => toggleActive.mutate({ id: u.id, is_active: !u.is_active })}
                  />
                </TableCell>
                <TableCell align="right">
                  <Stack direction="row" gap={0.5} justifyContent="flex-end">
                    <Button size="small" sx={{ fontSize: 11 }}
                      onClick={() => setEditing({ id: u.id, email: u.email, password: "", role: u.role, member_id: u.member_id, is_active: u.is_active })}>
                      Redigér
                    </Button>
                    <Button size="small" sx={{ fontSize: 11 }}
                      onClick={() => { setPwDialog({ id: u.id, email: u.email }); setNewPw(""); }}>
                      Adgangskode
                    </Button>
                    <Button size="small" color="error" sx={{ fontSize: 11 }}
                      onClick={() => { if (confirm(`Slet ${u.email}?`)) del.mutate(u.id); }}>
                      Slet
                    </Button>
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
            {users.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ color: "text.secondary", py: 3, fontSize: 13 }}>
                  Ingen brugere endnu.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Paper>

      {/* Create / Edit user dialog */}
      <Dialog open={!!editing} onClose={() => setEditing(null)} maxWidth="sm" fullWidth>
        <DialogTitle>{editing?.id ? `Redigér: ${editing.email}` : "Opret ny bruger"}</DialogTitle>
        <DialogContent sx={{ pt: "16px !important" }}>
          <Stack gap={2}>
            <TextField
              label="E-mail *"
              type="email"
              value={editing?.email ?? ""}
              onChange={(e) => setEditing((d) => ({ ...d!, email: e.target.value }))}
              autoFocus
            />
            {!editing?.id && (
              <TextField
                label="Adgangskode *"
                type="password"
                value={editing?.password ?? ""}
                onChange={(e) => setEditing((d) => ({ ...d!, password: e.target.value }))}
                helperText="Brugeren kan ændre den selv efterfølgende."
              />
            )}
            <TextField
              select
              label="Rolle"
              value={editing?.role ?? "member"}
              onChange={(e) => setEditing((d) => ({ ...d!, role: e.target.value as "admin" | "member" }))}
            >
              <MenuItem value="member">Medlem</MenuItem>
              <MenuItem value="admin">Admin</MenuItem>
            </TextField>
            <TextField
              select
              label="Tilknyttet medlem"
              value={editing?.member_id ?? ""}
              onChange={(e) => setEditing((d) => ({ ...d!, member_id: e.target.value === "" ? null : Number(e.target.value) }))}
              helperText="Valgfri — giver brugeren adgang til at redigere det pågældende medlems profil."
            >
              <MenuItem value=""><em>— Ingen —</em></MenuItem>
              {members.map((m) => <MenuItem key={m.id} value={m.id}>{m.name}</MenuItem>)}
            </TextField>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditing(null)}>Annullér</Button>
          <Button
            variant="contained"
            disabled={!editing?.email || (!editing?.id && !editing?.password)}
            onClick={() => save.mutate(editing!)}
          >
            {save.isPending ? "Gemmer…" : "Gem"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Password reset dialog */}
      <Dialog open={!!pwDialog} onClose={() => setPwDialog(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Nulstil adgangskode</DialogTitle>
        <DialogContent sx={{ pt: "16px !important" }}>
          <Typography variant="body2" color="text.secondary" mb={2}>{pwDialog?.email}</Typography>
          <TextField
            fullWidth
            label="Ny adgangskode *"
            type="password"
            value={newPw}
            onChange={(e) => setNewPw(e.target.value)}
            autoFocus
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPwDialog(null)}>Annullér</Button>
          <Button
            variant="contained"
            disabled={!newPw || savePw.isPending}
            onClick={() => savePw.mutate({ id: pwDialog!.id, pw: newPw })}
          >
            {savePw.isPending ? "Gemmer…" : "Gem"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

// ── Lookups ───────────────────────────────────────────────────────────

type LookupEdit = { id?: number; category: string; value: string; sort_order: number };

function LookupsPanel() {
  const qc = useQueryClient();
  const { data: allValues = [] } = useQuery({
    queryKey: ["lookups"],
    queryFn: () => getAllLookups().then((r) => r.data),
  });

  const [editing, setEditing] = useState<LookupEdit | null>(null);
  const [newCategory, setNewCategory] = useState("");

  const categories = [...new Set(allValues.map((v) => v.category))];

  const save = useMutation({
    mutationFn: (d: LookupEdit) =>
      d.id
        ? updateLookupValue(d.id, { value: d.value, sort_order: d.sort_order })
        : createLookupValue({ category: d.category, value: d.value, sort_order: d.sort_order, is_active: true }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["lookups"] }); setEditing(null); },
  });

  const del = useMutation({
    mutationFn: (id: number) => deleteLookupValue(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["lookups"] }),
  });

  const toggle = useMutation({
    mutationFn: ({ id, is_active }: { id: number; is_active: boolean }) => updateLookupValue(id, { is_active }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["lookups"] }),
  });

  const addCategory = () => {
    const cat = newCategory.trim().toLowerCase().replace(/\s+/g, "_");
    if (cat) { setEditing({ category: cat, value: "", sort_order: 0 }); setNewCategory(""); }
  };

  return (
    <Box>
      {categories.length === 0 && (
        <Typography color="text.secondary" mb={2}>Ingen dropdown-lister endnu.</Typography>
      )}

      {categories.map((cat) => {
        const items = allValues
          .filter((v) => v.category === cat)
          .sort((a, b) => a.sort_order - b.sort_order || a.value.localeCompare(b.value));
        return (
          <Paper key={cat} variant="outlined" sx={{ mb: 3, p: 2 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1.5}>
              <Typography variant="subtitle1" fontWeight={700}>
                {CATEGORY_LABELS[cat] ?? cat}
                <Typography component="span" variant="caption" color="text.secondary" ml={1}>({cat})</Typography>
              </Typography>
              <Button size="small" variant="outlined"
                onClick={() => setEditing({ category: cat, value: "", sort_order: items.length })}>
                + Tilføj værdi
              </Button>
            </Stack>
            <Divider sx={{ mb: 1.5 }} />
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
              {items.map((item) => (
                <Box key={item.id} sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                  <Chip
                    label={item.value}
                    size="small"
                    color={item.is_active ? "default" : "error"}
                    variant={item.is_active ? "outlined" : "filled"}
                    onClick={() => setEditing({ id: item.id, category: item.category, value: item.value, sort_order: item.sort_order })}
                    onDelete={() => toggle.mutate({ id: item.id, is_active: !item.is_active })}
                    deleteIcon={
                      <Box component="span" sx={{ fontSize: 11, px: 0.5 }}>
                        {item.is_active ? "▪" : "▸"}
                      </Box>
                    }
                  />
                  <IconButton size="small" sx={{ p: 0.25, color: "error.main" }}
                    onClick={() => { if (confirm(`Slet "${item.value}"?`)) del.mutate(item.id); }}>
                    <Box component="span" sx={{ fontSize: 12 }}>✕</Box>
                  </IconButton>
                </Box>
              ))}
              {items.length === 0 && <Typography variant="caption" color="text.secondary">Ingen værdier endnu.</Typography>}
            </Box>
          </Paper>
        );
      })}

      <Paper variant="outlined" sx={{ p: 2 }}>
        <Typography variant="subtitle2" mb={1.5}>Tilføj ny dropdown-liste</Typography>
        <Stack direction="row" gap={1} alignItems="center">
          <TextField
            size="small" label="Kategori (teknisk nøgle)" placeholder="f.eks. branche"
            value={newCategory} onChange={(e) => setNewCategory(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addCategory()}
          />
          <Button variant="outlined" onClick={addCategory} disabled={!newCategory.trim()}>Opret</Button>
        </Stack>
      </Paper>

      <Dialog open={!!editing} onClose={() => setEditing(null)} maxWidth="xs" fullWidth>
        <DialogTitle>{editing?.id ? "Redigér værdi" : "Ny værdi"}</DialogTitle>
        <DialogContent sx={{ pt: "16px !important" }}>
          <Stack gap={2}>
            <TextField label="Kategori" value={editing?.category ?? ""} disabled={!!editing?.id}
              onChange={(e) => setEditing((d) => ({ ...d!, category: e.target.value }))} />
            <TextField label="Værdi *" value={editing?.value ?? ""} autoFocus
              onChange={(e) => setEditing((d) => ({ ...d!, value: e.target.value }))} />
            <TextField label="Sorteringsorden" type="number" value={editing?.sort_order ?? 0}
              onChange={(e) => setEditing((d) => ({ ...d!, sort_order: parseInt(e.target.value) || 0 }))} />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditing(null)}>Annullér</Button>
          <Button variant="contained" onClick={() => save.mutate(editing!)} disabled={!editing?.value?.trim()}>Gem</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

// ── Admin page ────────────────────────────────────────────────────────

export default function Admin() {
  const [tab, setTab] = useState(0);

  return (
    <Box>
      <Typography variant="h5" mb={2}>Administration</Typography>
      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ borderBottom: 1, borderColor: "divider", mb: 3 }}>
        <Tab label="Brugere" />
        <Tab label="Dropdown-lister" />
      </Tabs>
      {tab === 0 && <UsersPanel />}
      {tab === 1 && <LookupsPanel />}
    </Box>
  );
}
