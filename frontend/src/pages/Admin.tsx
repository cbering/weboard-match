import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import TextField from "@mui/material/TextField";
import Chip from "@mui/material/Chip";
import Paper from "@mui/material/Paper";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Divider from "@mui/material/Divider";
import { getAllLookups, createLookupValue, updateLookupValue, deleteLookupValue } from "../api";
import type { LookupValue } from "../types";

const CATEGORY_LABELS: Record<string, string> = {
  branche: "Branchekendskab",
};

type EditState = { id?: number; category: string; value: string; sort_order: number };

export default function Admin() {
  const qc = useQueryClient();
  const { data: allValues = [] } = useQuery({
    queryKey: ["lookups"],
    queryFn: () => getAllLookups().then((r) => r.data),
  });

  const [editing, setEditing] = useState<EditState | null>(null);
  const [newCategory, setNewCategory] = useState("");

  const categories = [...new Set(allValues.map((v) => v.category))];

  const save = useMutation({
    mutationFn: (d: EditState) =>
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
    mutationFn: ({ id, is_active }: { id: number; is_active: boolean }) =>
      updateLookupValue(id, { is_active }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["lookups"] }),
  });

  const addCategory = () => {
    const cat = newCategory.trim().toLowerCase().replace(/\s+/g, "_");
    if (cat) {
      setEditing({ category: cat, value: "", sort_order: 0 });
      setNewCategory("");
    }
  };

  return (
    <Box>
      <Typography variant="h5" mb={3}>Administration</Typography>

      {categories.length === 0 && (
        <Typography color="text.secondary" mb={2}>Ingen dropdown-lister endnu.</Typography>
      )}

      {categories.map((cat) => {
        const items = allValues.filter((v) => v.category === cat).sort((a, b) => a.sort_order - b.sort_order || a.value.localeCompare(b.value));
        return (
          <Paper key={cat} variant="outlined" sx={{ mb: 3, p: 2 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1.5}>
              <Typography variant="subtitle1" fontWeight={700}>
                {CATEGORY_LABELS[cat] ?? cat}
                <Typography component="span" variant="caption" color="text.secondary" ml={1}>({cat})</Typography>
              </Typography>
              <Button size="small" variant="outlined" onClick={() => setEditing({ category: cat, value: "", sort_order: items.length })}>
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
                      <Box component="span" sx={{ fontSize: 11, px: 0.5, lineHeight: 1 }}>
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
            size="small"
            label="Kategori (teknisk nøgle)"
            placeholder="f.eks. branche"
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addCategory()}
          />
          <Button variant="outlined" onClick={addCategory} disabled={!newCategory.trim()}>Opret</Button>
        </Stack>
      </Paper>

      <Dialog open={!!editing} onClose={() => setEditing(null)} maxWidth="xs" fullWidth>
        <DialogTitle>{editing?.id ? "Redigér værdi" : "Ny værdi"}</DialogTitle>
        <DialogContent sx={{ pt: "16px !important" }}>
          <Stack gap={2}>
            <TextField
              label="Kategori"
              value={editing?.category ?? ""}
              disabled={!!editing?.id}
              onChange={(e) => setEditing((d) => ({ ...d!, category: e.target.value }))}
            />
            <TextField
              label="Værdi *"
              value={editing?.value ?? ""}
              onChange={(e) => setEditing((d) => ({ ...d!, value: e.target.value }))}
              autoFocus
            />
            <TextField
              label="Sorteringsorden"
              type="number"
              value={editing?.sort_order ?? 0}
              onChange={(e) => setEditing((d) => ({ ...d!, sort_order: parseInt(e.target.value) || 0 }))}
            />
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
