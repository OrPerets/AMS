import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import {
  AlertTriangle,
  ArrowLeft,
  Building,
  Camera,
  MapPin,
  Send,
  ShieldCheck,
} from 'lucide-react';
import { authFetch, getTokenPayload } from '../lib/auth';
import { triggerHaptic } from '../lib/mobile';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { toast } from '../components/ui/use-toast';
import { AmsDisclosure } from '../components/ui/ams-disclosure';
import { AmsDrawer } from '../components/ui/ams-drawer';
import { AmsSegmentedChoice } from '../components/ui/ams-segmented-choice';

interface Building {
  id: number;
  name: string;
  address: string;
}

interface Unit {
  id: number;
  number: string;
  buildingId: number;
  building: Building;
}

export default function CreateCall() {
  const router = useRouter();
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [selectedBuilding, setSelectedBuilding] = useState<number | ''>('');
  const [selectedUnit, setSelectedUnit] = useState<number | ''>('');
  const [buildingQuery, setBuildingQuery] = useState('');
  const [severity, setSeverity] = useState<'NORMAL' | 'HIGH' | 'URGENT'>('HIGH');
  const [description, setDescription] = useState('');
  const [photos, setPhotos] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [userInfo, setUserInfo] = useState<any>(null);
  const [locationDrawerOpen, setLocationDrawerOpen] = useState(false);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const galleryInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    void loadUserInfo();
    void loadBuildings();
  }, []);

  useEffect(() => {
    void loadUserInfo();
  }, [router.pathname]);

  useEffect(() => {
    if (selectedBuilding) {
      void loadUnits(selectedBuilding as number);
    } else {
      setUnits([]);
      setSelectedUnit('');
    }
  }, [selectedBuilding]);

  const filteredBuildings = buildings.filter((building) => {
    const query = buildingQuery.trim().toLowerCase();
    if (!query) return true;
    return `${building.name} ${building.address}`.toLowerCase().includes(query);
  });
  const activeBuilding = buildings.find((item) => item.id === selectedBuilding);
  const mapQuery = encodeURIComponent(activeBuilding?.address || activeBuilding?.name || 'תל אביב');
  const mapEmbedUrl = `https://maps.google.com/maps?q=${mapQuery}&z=15&output=embed`;

  async function loadUserInfo() {
    try {
      const payload = getTokenPayload();
      setUserInfo(payload);

      if (payload?.role === 'RESIDENT') {
        const response = await authFetch('/api/v1/users/profile');
        if (response.ok) {
          const userData = await response.json();
          if (userData.resident?.units?.[0]) {
            const unit = userData.resident.units[0];
            setSelectedBuilding(unit.buildingId);
            setSelectedUnit(unit.id);
            setLocationDrawerOpen(false);
          }
        }
      }
    } catch (error) {
      console.error('Error loading user info:', error);
    }
  }

  async function loadBuildings() {
    try {
      setLoading(true);
      const response = await authFetch('/api/v1/buildings');
      if (response.ok) {
        const data = await response.json();
        setBuildings(data);
      }
    } catch (error) {
      toast({
        title: 'שגיאה בטעינת בניינים',
        description: 'לא ניתן לטעון את רשימת הבניינים',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }

  async function loadUnits(buildingId: number) {
    try {
      const response = await authFetch(`/api/v1/buildings/${buildingId}/units`);
      if (response.ok) {
        const data = await response.json();
        setUnits(data);
      }
    } catch (error) {
      console.error('Error loading units:', error);
    }
  }

  function handlePhotoUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files || []) as File[];
    setPhotos((prev) => [...prev, ...files]);
  }

  function removePhoto(index: number) {
    setPhotos((prev) => prev.filter((_, photoIndex) => photoIndex !== index));
  }

  function openCameraPicker() {
    cameraInputRef.current?.click();
  }

  function openGalleryPicker() {
    galleryInputRef.current?.click();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!selectedBuilding || !selectedUnit) {
      toast({
        title: 'שגיאה',
        description: 'אנא בחר בניין ויחידה',
        variant: 'destructive',
      });
      return;
    }

    if (!description.trim()) {
      toast({
        title: 'שגיאה',
        description: 'אנא הכנס תיאור הקריאה',
        variant: 'destructive',
      });
      return;
    }

    try {
      setSubmitting(true);

      const formData = new FormData();
      formData.append('unitId', selectedUnit.toString());
      formData.append('severity', severity);
      formData.append('description', description.trim());

      photos.forEach((photo) => {
        formData.append('photos', photo);
      });

      const response = await authFetch('/api/v1/tickets', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const newTicket = await response.json();

        toast({
          title: 'קריאה נוצרה בהצלחה!',
          description: `קריאה מספר ${newTicket.id} נפתחה והועברה לטיפול`,
          variant: 'default',
        });
        triggerHaptic('success');

        setDescription('');
        setPhotos([]);
        setSeverity('HIGH');

        setTimeout(() => {
          void router.push(userInfo?.role === 'RESIDENT' ? '/resident/account' : '/tickets');
        }, 2000);
      } else {
        const error = await response.json();
        toast({
          title: 'שגיאה ביצירת קריאה',
          description: error.message || 'אירעה שגיאה לא צפויה',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error creating ticket:', error);
      toast({
        title: 'שגיאה ביצירת קריאה',
        description: 'אירעה שגיאה לא צפויה',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
          <p className="mt-2 text-muted-foreground">טוען...</p>
        </div>
      </div>
    );
  }

  return (
    <div dir="rtl" className="mx-auto max-w-2xl space-y-5 pb-32 text-right md:pb-20">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="icon-directional h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-black tracking-tight">קריאה / תקלה</h1>
          <p className="text-sm text-muted-foreground">מצלמים, כותבים קצר, שולחים.</p>
        </div>
      </div>

      <PrimaryLocationCard
        selectedBuilding={buildings.find((item) => item.id === selectedBuilding)}
        selectedUnit={units.find((item) => item.id === selectedUnit)}
        onEdit={() => setLocationDrawerOpen(true)}
      />

      <form id="create-call-form" onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Camera className="h-5 w-5" />
              תמונות
            </CardTitle>
            <CardDescription>מתחילים בצילום. תמונה אחת טובה חוסכת הרבה הסברים.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                multiple
                onChange={handlePhotoUpload}
                className="hidden"
              />
              <input
                ref={galleryInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handlePhotoUpload}
                className="hidden"
              />

              <div className="grid gap-3 sm:grid-cols-2">
                <Button
                  type="button"
                  onClick={openCameraPicker}
                  className="min-h-16 w-full rounded-[24px] text-base shadow-[0_14px_32px_rgba(59,130,246,0.18)]"
                >
                  <Camera className="mr-2 h-4 w-4" />
                  צלם תקלה עכשיו
                </Button>
                <Button type="button" variant="outline" onClick={openGalleryPicker} className="min-h-16 w-full rounded-[24px]">
                  בחר מהגלריה
                </Button>
              </div>

              <div className="rounded-[22px] border border-primary/15 bg-primary/8 px-4 py-3 text-sm text-muted-foreground">
                צילום רחב ועוד צילום מקרוב בדרך כלל מספיקים.
              </div>

              {photos.length > 0 ? (
                <div className="grid grid-cols-2 gap-4">
                  {photos.map((photo, index) => (
                    <div key={`${photo.name}-${index}`} className="relative">
                      <img
                        src={URL.createObjectURL(photo)}
                        alt={`תמונה ${index + 1}`}
                        className="h-32 w-full rounded-lg border object-cover"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute right-2 top-2 h-6 w-6 p-0"
                        onClick={() => removePhoto(index)}
                      >
                        ×
                      </Button>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              דחיפות
            </CardTitle>
            <CardDescription>בחר מה הכי דחוף עכשיו.</CardDescription>
          </CardHeader>
          <CardContent>
            <AmsSegmentedChoice
              value={severity}
              className="grid-cols-3 min-[390px]:grid-cols-3 gap-1.5 [&>button]:px-2.5 [&>button]:py-2 [&>button_span]:text-[13px] [&>button_div:last-child]:text-[11px] [&>button_div:last-child]:leading-4"
              onChange={(value) => setSeverity(value as 'NORMAL' | 'HIGH' | 'URGENT')}
              options={[
                { value: 'URGENT', label: getSeverityLabel('URGENT'), description: getSeverityHint('URGENT') },
                { value: 'HIGH', label: getSeverityLabel('HIGH'), description: getSeverityHint('HIGH') },
                { value: 'NORMAL', label: getSeverityLabel('NORMAL'), description: getSeverityHint('NORMAL') },
              ]}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>מה קרה?</CardTitle>
            <CardDescription>משפט אחד או שניים עם מה רואים ומה נדרש.</CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="למשל: יש נזילה מתחת לכיור במטבח."
              className="min-h-[120px]"
              required
            />
          </CardContent>
        </Card>

        <AmsDisclosure
          items={[
            {
              key: 'submission-help',
              title: 'מה עוזר לנו לטפל מהר יותר',
              subtitle: 'מיקום מדויק, תמונה ברורה ודחיפות נכונה.',
              startContent: <ShieldCheck className="h-4 w-4 text-primary" strokeWidth={1.75} />,
              content: (
                <div className="space-y-2">
                  <div>אם יש ריח חריג, מים זורמים או סכנה מיידית, בחרו "בהולה - דחוף".</div>
                  <div>אם המיקום לא נכון, עדכנו אותו דרך כפתור "שנה מיקום".</div>
                  <div>תמונה אחת טובה ותיאור קצר מספיקים כדי לפתוח טיפול.</div>
                </div>
              ),
            },
          ]}
        />
      </form>

      <AmsDrawer
        isOpen={locationDrawerOpen}
        onOpenChange={setLocationDrawerOpen}
        title="בחירת מיקום"
        description="אפשר לעדכן בניין ודירה בלי להעמיס על המסך הראשי."
        tone="light"
        scrollBehavior="outside"
        footer={(onClose) => (
          <div className="w-full space-y-2">
            <Button size="lg" className="min-h-[52px] w-full" onClick={onClose}>
              אישור מיקום
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="w-full rounded-full border-white/30 bg-white/10 text-white hover:bg-white/18"
              onClick={onClose}
            >
              בטל
            </Button>
          </div>
        )}
      >
        <div className="space-y-4 pb-2">
          <div className="overflow-hidden rounded-2xl border border-subtle-border bg-muted/30">
            <iframe
              key={mapQuery}
              title="מפת הבניין"
              src={mapEmbedUrl}
              className="h-52 w-full border-0"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
          <div className="text-xs text-secondary-foreground">
            {activeBuilding ? `תצוגת מפה עבור ${activeBuilding.address}` : 'בחר בניין כדי למקד את המפה.'}
          </div>
          <Input
            placeholder="חיפוש לפי כתובת או שם בניין"
            value={buildingQuery}
            onChange={(e) => setBuildingQuery(e.target.value)}
            className="bg-white text-slate-900 placeholder:text-slate-500"
          />
          <select
            value={selectedBuilding}
            onChange={(e) => setSelectedBuilding(Number(e.target.value) || '')}
            className="flex h-12 w-full rounded-2xl border border-input bg-background px-3 py-2 text-sm text-foreground ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            required
          >
            <option value="" className="text-slate-900">
              בחר בניין...
            </option>
            {filteredBuildings.map((building) => (
              <option key={building.id} value={building.id} className="text-slate-900">
                {building.address}
              </option>
            ))}
          </select>

          {selectedBuilding ? (
            <select
              value={selectedUnit}
              onChange={(e) => setSelectedUnit(Number(e.target.value) || '')}
              className="flex h-12 w-full rounded-2xl border border-input bg-background px-3 py-2 text-sm text-foreground ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              required
            >
              <option value="" className="text-slate-900">
                בחר יחידה...
              </option>
              {units.map((unit) => (
                <option key={unit.id} value={unit.id} className="text-slate-900">
                  יחידה {unit.number}
                </option>
              ))}
            </select>
          ) : null}
        </div>
      </AmsDrawer>

      <div className="fixed inset-x-0 bottom-20 z-30 mx-auto max-w-2xl px-4 md:bottom-6">
        <div className="rounded-[28px] border border-subtle-border bg-background/95 p-3 shadow-[0_20px_45px_rgba(15,23,42,0.16)] backdrop-blur">
          <div className="mb-2 text-center text-xs text-muted-foreground">
            {selectedUnit && description.trim() ? 'הכול מוכן לשליחה' : 'בחר מיקום וכתוב תיאור קצר'}
          </div>
          <Button
            type="submit"
            form="create-call-form"
            className="min-h-[56px] w-full rounded-[22px] text-base"
            size="lg"
            disabled={submitting}
          >
            {submitting ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-white" />
                שולח...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                פתח קריאה
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

function PrimaryLocationCard({
  selectedBuilding,
  selectedUnit,
  onEdit,
}: {
  selectedBuilding?: Building;
  selectedUnit?: Unit;
  onEdit: () => void;
}) {
  return (
    <Card className="rounded-[28px] border-0 bg-[linear-gradient(180deg,rgba(37,99,235,0.08)_0%,rgba(255,255,255,1)_100%)]">
      <CardContent className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">מיקום</div>
            <div className="mt-2 text-lg font-bold text-foreground">
              {selectedBuilding ? selectedBuilding.name : 'בחר בניין'}
            </div>
            <div className="mt-1 text-sm text-muted-foreground">
              {selectedUnit ? `יחידה ${selectedUnit.number}` : 'צריך לבחור דירה לפני השליחה'}
            </div>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={onEdit} className="rounded-full">
            שנה מיקום
          </Button>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <MapPin className="h-3.5 w-3.5 text-primary" />
          אם זו תקלה בדירה אחרת, שנה כאן את המיקום.
        </div>
      </CardContent>
    </Card>
  );
}

function getSeverityLabel(level: 'NORMAL' | 'HIGH' | 'URGENT') {
  switch (level) {
    case 'URGENT':
      return 'בהולה - דחוף';
    case 'HIGH':
      return 'דחופה';
    default:
      return 'רגילה';
  }
}

function getSeverityHint(level: 'NORMAL' | 'HIGH' | 'URGENT') {
  switch (level) {
    case 'URGENT':
      return 'סיכון מיידי';
    case 'HIGH':
      return 'צריך טיפול היום';
    default:
      return 'אפשר גם בהמשך';
  }
}
