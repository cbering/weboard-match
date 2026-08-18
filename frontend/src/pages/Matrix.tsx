import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Tooltip from "@mui/material/Tooltip";
import CircularProgress from "@mui/material/CircularProgress";
import { getMembers, updateMember } from "../api";
import { COMPETENCIES } from "../types";
import type { Member } from "../types";

const FAGLIGE    = COMPETENCIES.filter((c) => c.kat === "Faglig");
const PERSONLIGE = COMPETENCIES.filter((c) => c.kat === "Personlig");
const ALL_COLS   = [...FAGLIGE, ...PERSONLIGE];

const BG = ["#f0f2f1", "#c8ede7", "#7dcbbf", "#1f8a7a"];
const FG = ["#647079", "#206050", "#fff", "#fff"];

export default function Matrix() {
  const qc = useQueryClient();
  const { data: members = [], isLoading } = useQuery({ queryKey: ["members"], queryFn: () => getMembers().then((r) => r.data) });

  const mut = useMutation({
    mutationFn: ({ id, ratings }: { id: number; ratings: Record<string, number> }) => updateMember(id, { ratings }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["members"] }),
  });

  const toggle = (member: Member, compId: string) => {
    const cur = member.ratings?.[compId] ?? 0;
    const next = (cur + 1) % 4;
    mut.mutate({ id: member.id, ratings: { ...member.ratings, [compId]: next } });
  };

  const active = members.filter((m) => m.status !== "inaktiv");

  if (isLoading) return <CircularProgress />;

  return (
    <Box>
      <Typography variant="h5" mb={1}>Kompetencematrix</Typography>
      <Typography variant="caption" color="text.secondary" display="block" mb={2}>
        Klik en celle for at ændre niveau · 0 = ingen · 1 = grundlæggende · 2 = erfaren · 3 = ekspert
      </Typography>
      <Box sx={{ overflowX: "auto" }}>
        <table style={{ borderCollapse: "collapse", fontSize: 12 }}>
          <thead>
            <tr>
              <th style={{ minWidth: 140, textAlign: "left", padding: "4px 10px", borderBottom: "2px solid #e0e3df" }}>Navn</th>
              {ALL_COLS.map((c, i) => (
                <>
                  {i === FAGLIGE.length && <th key="sep" style={{ width: 4, background: "#e0e3df" }} />}
                  <Tooltip title={c.navn} key={c.id}>
                    <th style={{ width: 44, padding: "4px 2px", borderBottom: "2px solid #e0e3df", verticalAlign: "bottom" }}>
                      <div style={{ writingMode: "vertical-rl", transform: "rotate(180deg)", fontSize: 10, fontWeight: 700, letterSpacing: "0.04em", color: "#647079", maxHeight: 80, overflow: "hidden" }}>
                        {c.short}
                      </div>
                    </th>
                  </Tooltip>
                </>
              ))}
            </tr>
          </thead>
          <tbody>
            {active.map((m) => (
              <tr key={m.id} style={{ borderBottom: "1px solid #e0e3df" }}>
                <td style={{ padding: "4px 10px", fontWeight: 500, whiteSpace: "nowrap" }}>{m.name}</td>
                {ALL_COLS.map((c, i) => {
                  const v = m.ratings?.[c.id] ?? 0;
                  return (
                    <>
                      {i === FAGLIGE.length && <td key="sep" style={{ background: "#e0e3df", width: 4, padding: 0 }} />}
                      <Tooltip title={`${c.navn}: ${v}`} key={c.id}>
                        <td
                          onClick={() => toggle(m, c.id)}
                          style={{
                            textAlign: "center", cursor: "pointer", width: 44, height: 32,
                            background: BG[v], color: FG[v], fontWeight: 700, fontSize: 11,
                            transition: "background .15s",
                          }}
                        >
                          {v || ""}
                        </td>
                      </Tooltip>
                    </>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </Box>
    </Box>
  );
}
