import { createFileRoute } from "@tanstack/react-router";

import { PageHeader, Panel, Pill } from "@/components/shell";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/teams")({
  head: () => ({
    meta: [
      { title: "Teams & Mentorship — ChartFusionX" },
      {
        name: "description",
        content:
          "Mentor dashboards, shared playbooks, trade reviews and permission controls for trading academies and communities.",
      },
      { property: "og:title", content: "Teams & Mentorship — ChartFusionX" },
      { property: "og:description", content: "Coach a room of traders with AI assistance." },
    ],
  }),
  component: Teams,
});

const students = [
  { name: "A. Rivera", trades: 34, wr: 62, adherence: 88, flag: "On track" },
  { name: "M. Okafor", trades: 51, wr: 47, adherence: 54, flag: "Overtrading" },
  { name: "J. Lindqvist", trades: 19, wr: 68, adherence: 91, flag: "On track" },
  { name: "S. Haddad", trades: 27, wr: 39, adherence: 61, flag: "Revenge pattern" },
];

function Teams() {
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader
        eyebrow="Module 14 · Premium"
        title="Teams & Mentorship"
        description="For mentors, communities and trading academies. Student dashboards, shared playbooks and AI-assisted coaching."
        action={<Button>Invite student</Button>}
      />

      <Panel className="overflow-x-auto p-0">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-border text-left text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
              <th className="px-4 py-3 font-medium">Student</th>
              <th className="px-4 py-3 font-medium">Trades</th>
              <th className="px-4 py-3 font-medium">Win rate</th>
              <th className="px-4 py-3 font-medium">Playbook adherence</th>
              <th className="px-4 py-3 font-medium">AI flag</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {students.map((s) => (
              <tr key={s.name} className="transition-colors hover:bg-muted/50">
                <td className="px-4 py-3 font-medium">{s.name}</td>
                <td className="num px-4 py-3 text-muted-foreground">{s.trades}</td>
                <td className="num px-4 py-3">{s.wr}%</td>
                <td className="num px-4 py-3">{s.adherence}%</td>
                <td className="px-4 py-3">
                  <Pill tone={s.flag === "On track" ? "positive" : "negative"}>{s.flag}</Pill>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { k: "Shared playbooks", v: "Publish your system once; every student's trades are graded against it." },
          { k: "Mentor feedback", v: "Comment directly on a student's trade alongside the AI review." },
          { k: "Permission controls", v: "Choose exactly what each student and assistant coach can see." },
        ].map(({ k, v }) => (
          <Panel key={k} title={k}>
            <p className="text-xs leading-relaxed text-muted-foreground">{v}</p>
          </Panel>
        ))}
      </div>
    </div>
  );
}
