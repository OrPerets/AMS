import { useEffect, useState } from 'react';
import { AlertTriangle, DatabaseZap, RefreshCw } from 'lucide-react';
import { authFetch } from '../../lib/auth';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { toast } from '../../components/ui/use-toast';

type DataQualityReport = {
  summary: Record<string, number>;
  duplicates: {
    residentPhones: Array<{ key: string; entries: Array<{ residentId: number; email: string; units: string[] }> }>;
    supplierContacts: Array<{ key: string; entries: Array<{ supplierId: number; name: string; email?: string | null; phone?: string | null }> }>;
    unitNumbers: Array<{ key: string; entries: Array<{ unitId: number; buildingId: number; number: string }> }>;
  };
  completeness: {
    buildings: Array<{ id: number; name: string; missing: string[] }>;
    units: Array<{ id: number; number: string; buildingId: number; missing: string[] }>;
    suppliers: Array<{ id: number; name: string; missing: string[] }>;
    contracts: Array<{ id: number; title: string; missing: string[] }>;
  };
  warnings: {
    inactiveBuildings: Array<{ id: number; name: string }>;
    inactiveUnits: Array<{ id: number; number: string; buildingId: number }>;
    buildingsWithoutUnits: Array<{ id: number; name: string }>;
    unitsWithoutResidents: Array<{ id: number; number: string; buildingId: number }>;
    invalidDocumentLinks: Array<{ id: number; name: string; url: string }>;
  };
};

export default function AdminDataQualityPage() {
  const [report, setReport] = useState<DataQualityReport | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void loadReport();
  }, []);

  async function loadReport() {
    try {
      setLoading(true);
      const response = await authFetch('/api/admin/data-quality');
      if (!response.ok) {
        throw new Error(await response.text());
      }
      setReport(await response.json());
    } catch (error) {
      console.error(error);
      toast({ title: 'טעינת בקרת הנתונים נכשלה', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }

  const summaryEntries = Object.entries(report?.summary || {});

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold">בקרת איכות נתונים</h1>
          <p className="text-sm text-muted-foreground">איתור כפילויות, חוסרים, קישורים שבורים ורשומות לא פעילות לפני הפעלה רחבה.</p>
        </div>
        <Button variant="outline" onClick={loadReport} disabled={loading}>
          <RefreshCw className="me-2 h-4 w-4" />
          רענון
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-5">
        {summaryEntries.map(([key, value]) => (
          <Card key={key}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">{key}</CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-semibold">{value}</CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><DatabaseZap className="h-5 w-5" /> כפילויות</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          {report?.duplicates.residentPhones.map((group) => (
            <div key={`resident-${group.key}`} className="rounded-xl border p-3">
              <Badge variant="warning">טלפון דייר כפול</Badge>
              <div className="mt-2">{group.key}</div>
              <div className="mt-2 text-muted-foreground">{group.entries.map((entry) => `${entry.email} (${entry.units.join(', ')})`).join(' · ')}</div>
            </div>
          ))}
          {report?.duplicates.supplierContacts.map((group) => (
            <div key={`supplier-${group.key}`} className="rounded-xl border p-3">
              <Badge variant="warning">איש קשר ספק כפול</Badge>
              <div className="mt-2">{group.key}</div>
              <div className="mt-2 text-muted-foreground">{group.entries.map((entry) => entry.name).join(' · ')}</div>
            </div>
          ))}
          {report?.duplicates.unitNumbers.map((group) => (
            <div key={`unit-${group.key}`} className="rounded-xl border p-3">
              <Badge variant="warning">מספר יחידה כפול</Badge>
              <div className="mt-2">{group.key}</div>
              <div className="mt-2 text-muted-foreground">{group.entries.map((entry) => `יחידה #${entry.unitId}`).join(' · ')}</div>
            </div>
          ))}
          {!loading && report && !report.duplicates.residentPhones.length && !report.duplicates.supplierContacts.length && !report.duplicates.unitNumbers.length && (
            <div className="py-6 text-center text-muted-foreground">לא נמצאו כפילויות פעילות.</div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><AlertTriangle className="h-5 w-5" /> חוסרים בשדות חובה</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {report?.completeness.buildings.map((item) => (
              <div key={`building-${item.id}`} className="rounded-xl border p-3">בניין {item.name}: {item.missing.join(', ')}</div>
            ))}
            {report?.completeness.units.map((item) => (
              <div key={`unit-${item.id}`} className="rounded-xl border p-3">יחידה {item.number} / בניין {item.buildingId}: {item.missing.join(', ')}</div>
            ))}
            {report?.completeness.suppliers.map((item) => (
              <div key={`supplier-${item.id}`} className="rounded-xl border p-3">ספק {item.name}: {item.missing.join(', ')}</div>
            ))}
            {report?.completeness.contracts.map((item) => (
              <div key={`contract-${item.id}`} className="rounded-xl border p-3">חוזה {item.title}: {item.missing.join(', ')}</div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><AlertTriangle className="h-5 w-5" /> אזהרות תפעוליות</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {report?.warnings.inactiveBuildings.map((item) => (
              <div key={`inactive-building-${item.id}`} className="rounded-xl border p-3">בניין לא פעיל: {item.name}</div>
            ))}
            {report?.warnings.inactiveUnits.map((item) => (
              <div key={`inactive-unit-${item.id}`} className="rounded-xl border p-3">יחידה לא פעילה: {item.buildingId}/{item.number}</div>
            ))}
            {report?.warnings.buildingsWithoutUnits.map((item) => (
              <div key={`empty-building-${item.id}`} className="rounded-xl border p-3">בניין ללא יחידות: {item.name}</div>
            ))}
            {report?.warnings.unitsWithoutResidents.map((item) => (
              <div key={`empty-unit-${item.id}`} className="rounded-xl border p-3">יחידה ללא דיירים: {item.buildingId}/{item.number}</div>
            ))}
            {report?.warnings.invalidDocumentLinks.map((item) => (
              <div key={`doc-${item.id}`} className="rounded-xl border p-3">מסמך עם קישור לא תקין: {item.name} ({item.url})</div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
