import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import { Calendar, FileText, MapPin, Users } from 'lucide-react';
import { getGardensWorkerPlanDetail, type GardensWorkerPlanDetail } from '../../lib/gardens';

export function GardensWorkerReport({
  plan,
  workerProfileId,
}: {
  plan: string;
  workerProfileId: number;
}) {
  const router = useRouter();
  const [detail, setDetail] = useState<GardensWorkerPlanDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      try {
        const data = await getGardensWorkerPlanDetail(plan, workerProfileId);
        setDetail(data);
        if (router.query.download === '1') {
          window.setTimeout(() => window.print(), 250);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [plan, router.query.download, workerProfileId]);

  const summary = useMemo(() => {
    const assignments = detail?.assignments ?? [];
    return {
      totalAssignments: assignments.length,
      uniqueLocations: new Set(assignments.map((assignment) => assignment.location)).size,
      withNotes: assignments.filter((assignment) => assignment.notes).length,
    };
  }, [detail]);

  if (loading || !detail) {
    return <div className="p-6 text-center">טוען...</div>;
  }

  return (
    <div className="min-h-screen bg-white p-6 print:p-4">
      <div className="mb-6 rounded-3xl bg-gradient-to-r from-green-600 to-green-700 p-6 text-white">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-white/15 p-3">
              <Users className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">דו"ח עבודה חודשי</h1>
              <p className="text-green-100">
                {detail.worker.displayName} | {plan}
              </p>
            </div>
          </div>
          <div className="text-right text-sm text-green-100">
            <div>תאריך הפקה</div>
            <div className="font-semibold text-white">
              {new Intl.DateTimeFormat('he-IL', {
                dateStyle: 'medium',
                timeStyle: 'short',
              }).format(new Date())}
            </div>
          </div>
        </div>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4">
          <div className="mb-2 flex items-center gap-2 text-blue-700">
            <Calendar className="h-4 w-4" />
            <span className="text-sm font-medium">ימי עבודה</span>
          </div>
          <div className="text-2xl font-bold text-blue-900">{summary.totalAssignments}</div>
        </div>
        <div className="rounded-2xl border border-green-200 bg-green-50 p-4">
          <div className="mb-2 flex items-center gap-2 text-green-700">
            <MapPin className="h-4 w-4" />
            <span className="text-sm font-medium">מיקומים שונים</span>
          </div>
          <div className="text-2xl font-bold text-green-900">{summary.uniqueLocations}</div>
        </div>
        <div className="rounded-2xl border border-purple-200 bg-purple-50 p-4">
          <div className="mb-2 flex items-center gap-2 text-purple-700">
            <FileText className="h-4 w-4" />
            <span className="text-sm font-medium">שורות עם הערות</span>
          </div>
          <div className="text-2xl font-bold text-purple-900">{summary.withNotes}</div>
        </div>
      </div>

      <div className="overflow-hidden rounded-3xl border border-border">
        <table className="min-w-full text-right">
          <thead className="border-b border-border bg-muted/30">
            <tr>
              <th className="px-4 py-4 text-sm font-medium">תאריך</th>
              <th className="px-4 py-4 text-sm font-medium">מיקום</th>
              <th className="px-4 py-4 text-sm font-medium">הערות</th>
            </tr>
          </thead>
          <tbody>
            {detail.assignments.map((assignment) => (
              <tr key={assignment.id} className="border-b border-border last:border-b-0">
                <td className="px-4 py-4 text-sm">
                  {new Intl.DateTimeFormat('he-IL', { dateStyle: 'medium' }).format(
                    new Date(assignment.date),
                  )}
                </td>
                <td className="px-4 py-4 text-sm font-medium">{assignment.location}</td>
                <td className="px-4 py-4 text-sm text-muted-foreground">{assignment.notes || 'ללא הערה'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
