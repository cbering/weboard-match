import { useState, useEffect } from "react";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import LinearProgress from "@mui/material/LinearProgress";
import Divider from "@mui/material/Divider";
import CircularProgress from "@mui/material/CircularProgress";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { matchCompany, addToBoard, removeFromBoard } from "../api";
import { COMPETENCIES, PHASE_LABELS } from "../types";
import type { Company } from "../types";

const compName = (id: string) => COMPETENCIES.find((c) => c.id === id)?.navn ?? id;

interface Props {
  company: Company | null;
  onClose: () => void;
}

export default function MatchModal({ company, onClose }: Props) {
  const qc = useQueryClient();

  const { data: match, isLoading } = useQuery({
    queryKey: ["match", company?.id],
    queryFn: () => matchCompany(company!.id).then((r) => r.data),
    enabled: !!company,
  });

  const addMutation = useMutation({
    mutationFn: ({ mid }: { mid: number }) => addToBoard(company!.id, mid),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["match", company?.id] }); qc.invalidateQueries({ queryKey: ["companies"] }); },
  });

  const removeMutation = useMutation({
    mutationFn: ({ mid }: { mid: number }) => removeFromBoard(company!.id, mid),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["match", company?.id] }); qc.invalidateQueries({ queryKey: ["companies"] }); },
  });

  if (!company) return null;

  const boardIds = new Set((company.board ?? []).map((m) => m.id));
  const boardMembers = match?.scores.filter((s) => s.on_board) ?? [];
  const candidates = match?.scores.filter((s) => !s.on_board) ?? [];

  return (
    <Dialog open={!!company} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ pb: 0 }}>
        Advisory board: {company.name}
      </DialogTitle>
      <DialogContent sx={{ pt: 1 }}>
        {/* Company info */}
        <Box sx={{ p: 1.5, bgcolor: "action.hover", borderRadius: 2, mb: 2 }}>
          <Typography variant="body2" color="text.secondary">
            {company.branche ?? "—"} · Fase: <strong>{PHASE_LABELS[company.phase]}</strong>
            {company.contact ? ` · ${company.contact}` : ""}
          </Typography>
          {company.notes && <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5, fontStyle: "italic" }}>{company.notes}</Typography>}
          {match && match.relevant_competencies.length > 0 && (
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, mt: 1 }}>
              {match.relevant_competencies.map((id) => (
                <Chip key={id} label={compName(id)} size="small" variant="outlined" color="primary" />
              ))}
            </Box>
          )}
        </Box>

        {isLoading && <CircularProgress size={24} />}

        {/* Current board */}
        <Typography variant="overline" color="primary" fontWeight={700}>Nuværende board ({boardMembers.length})</Typography>
        {boardMembers.length === 0 && <Typography variant="body2" color="text.secondary" mb={2}>Ingen boardmedlemmer endnu.</Typography>}
        {boardMembers.map(({ member, pct }) => (
          <Box key={member.id} sx={{ display: "flex", alignItems: "center", gap: 1, py: 1, borderBottom: "1px solid", borderColor: "divider" }}>
            <Box sx={{ flex: 1 }}>
              <Typography fontWeight={600} variant="body2">{member.name}</Typography>
              <Typography variant="caption" color="text.secondary">{member.branche ?? ""}</Typography>
            </Box>
            <Chip label={`${pct}%`} size="small" color="primary" sx={{ fontVariantNumeric: "tabular-nums" }} />
            <Button size="small" color="error" variant="outlined" onClick={() => removeMutation.mutate({ mid: member.id })}>Fjern</Button>
          </Box>
        ))}

        <Divider sx={{ my: 2 }} />

        {/* Candidates */}
        <Typography variant="overline" color="primary" fontWeight={700}>Kandidater ({candidates.length})</Typography>
        {candidates.slice(0, 12).map(({ member, pct, matched_competencies, industry_match }) => (
          <Box key={member.id} sx={{ display: "flex", alignItems: "flex-start", gap: 1.5, py: 1.5, borderBottom: "1px solid", borderColor: "divider" }}>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
                <Typography fontWeight={600} variant="body2">{member.name}</Typography>
                <Chip label={member.status} size="small" color={member.status === "aktiv" ? "success" : "default"} />
              </Box>
              <Typography variant="caption" color="text.secondary" display="block">{member.branche ?? ""}</Typography>
              <LinearProgress variant="determinate" value={pct} sx={{ height: 4, borderRadius: 2, my: 0.5 }} />
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, mt: 0.5 }}>
                {matched_competencies.map((c) => (
                  <Chip key={c.id} label={`${compName(c.id)} · ${c.val}`} size="small" />
                ))}
                {industry_match && <Chip label="Branchekendskab" size="small" color="info" />}
              </Box>
            </Box>
            <Box sx={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 0.5, flexShrink: 0 }}>
              <Typography fontWeight={700} color="primary" sx={{ fontVariantNumeric: "tabular-nums" }}>{pct}%</Typography>
              <Button size="small" variant="contained" onClick={() => addMutation.mutate({ mid: member.id })}>+ Tilføj</Button>
            </Box>
          </Box>
        ))}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Luk</Button>
      </DialogActions>
    </Dialog>
  );
}
