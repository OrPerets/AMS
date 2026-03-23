import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import { 
  Building, 
  MapPin, 
  AlertTriangle,
  Camera,
  Send,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { authFetch } from '../lib/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { toast } from '../components/ui/use-toast';
import { getTokenPayload } from '../lib/auth';
import { triggerHaptic } from '../lib/mobile';

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
  const [showLocationEditor, setShowLocationEditor] = useState(false);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const galleryInputRef = useRef<HTMLInputElement | null>(null);
  useEffect(() => {
    loadUserInfo();
    loadBuildings();
  }, []);

  // Listen for route changes to re-read token payload (for role changes)
  useEffect(() => {
    loadUserInfo();
  }, [router.pathname]);

  useEffect(() => {
    if (selectedBuilding) {
      loadUnits(selectedBuilding as number);
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

  const loadUserInfo = async () => {
    try {
      const payload = getTokenPayload();
      setUserInfo(payload);
      
      // If user is a resident, try to get their unit automatically
      if (payload?.role === 'RESIDENT') {
        const response = await authFetch('/api/v1/users/profile');
        if (response.ok) {
          const userData = await response.json();
          if (userData.resident?.units?.[0]) {
            const unit = userData.resident.units[0];
            setSelectedBuilding(unit.buildingId);
            setSelectedUnit(unit.id);
            setShowLocationEditor(false);
          }
        }
      }
    } catch (error) {
      console.error('Error loading user info:', error);
    }
  };

  const loadBuildings = async () => {
    try {
      setLoading(true);
      const response = await authFetch('/api/v1/buildings');
      if (response.ok) {
        const data = await response.json();
        setBuildings(data);
      }
    } catch (error) {
      toast({
        title: "שגיאה בטעינת בניינים",
        description: "לא ניתן לטעון את רשימת הבניינים",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadUnits = async (buildingId: number) => {
    try {
      const response = await authFetch(`/api/v1/buildings/${buildingId}/units`);
      if (response.ok) {
        const data = await response.json();
        setUnits(data);
      }
    } catch (error) {
      console.error('Error loading units:', error);
    }
  };

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []) as File[];
    setPhotos(prev => [...prev, ...files]);
  };

  const removePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const openCameraPicker = () => {
    cameraInputRef.current?.click();
  };

  const openGalleryPicker = () => {
    galleryInputRef.current?.click();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedBuilding || !selectedUnit) {
      toast({
        title: "שגיאה",
        description: "אנא בחר בניין ויחידה",
        variant: "destructive",
      });
      return;
    }

    if (!description.trim()) {
      toast({
        title: "שגיאה",
        description: "אנא הכנס תיאור הקריאה",
        variant: "destructive",
      });
      return;
    }

    try {
      setSubmitting(true);
      
      const formData = new FormData();
      formData.append('unitId', selectedUnit.toString());
      formData.append('severity', severity);
      formData.append('description', description.trim());
      
      // Add photos
      photos.forEach((photo, index) => {
        formData.append('photos', photo);
      });

      const response = await authFetch('/api/v1/tickets', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const newTicket = await response.json();
        
        toast({
          title: "קריאה נוצרה בהצלחה!",
          description: `קריאה מספר ${newTicket.id} נפתחה והועברה לטיפול`,
          variant: "default",
        });
        triggerHaptic('success');

        // Reset form
        setDescription('');
        setPhotos([]);
        setSeverity('HIGH');
        
        setTimeout(() => {
          router.push(userInfo?.role === 'RESIDENT' ? '/resident/account' : '/tickets');
        }, 2000);
      } else {
        const error = await response.json();
        toast({
          title: "שגיאה ביצירת קריאה",
          description: error.message || "אירעה שגיאה לא צפויה",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error creating ticket:', error);
      toast({
        title: "שגיאה ביצירת קריאה",
        description: "אירעה שגיאה לא צפויה",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const getSeverityColor = (level: string) => {
    switch (level) {
      case 'URGENT': return 'destructive';
      case 'HIGH': return 'warning';
      case 'NORMAL': return 'secondary';
      default: return 'secondary';
    }
  };

  const getSeverityLabel = (level: string) => {
    switch (level) {
      case 'URGENT': return 'בהולה - דחוף';
      case 'HIGH': return 'דחופה';
      case 'NORMAL': return 'רגילה';
      default: return level;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">טוען...</p>
        </div>
      </div>
    );
  }

  return (
    <div dir="rtl" className="mx-auto max-w-2xl space-y-5 pb-32 text-right md:pb-20">
      <div className="flex items-center gap-4">
        <Button 
          variant="ghost" 
          size="icon"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-4 w-4 icon-directional" />
        </Button>
        <div>
          <h1 className="text-3xl font-black tracking-tight">קריאה / תקלה</h1>
          <p className="text-sm text-muted-foreground">מצלמים, כותבים קצר, שולחים.</p>
        </div>
      </div>

      <PrimaryLocationCard
        selectedBuilding={buildings.find((item) => item.id === selectedBuilding)}
        selectedUnit={units.find((item) => item.id === selectedUnit)}
        showLocationEditor={showLocationEditor}
        onToggle={() => setShowLocationEditor((current) => !current)}
      />

      <form id="create-call-form" onSubmit={handleSubmit} className="space-y-6">
        {showLocationEditor ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                מיקום התקלה
              </CardTitle>
              <CardDescription>אפשר לשנות בניין או דירה לפני השליחה.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Input
                placeholder="חיפוש לפי כתובת או שם בניין"
                value={buildingQuery}
                onChange={(e) => setBuildingQuery(e.target.value)}
              />
              <select
                value={selectedBuilding}
                onChange={(e) => setSelectedBuilding(Number(e.target.value) || '')}
                className="flex h-12 w-full rounded-2xl border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                required
              >
                <option value="">בחר בניין...</option>
                {filteredBuildings.map((building) => (
                  <option key={building.id} value={building.id}>
                    {building.address}
                  </option>
                ))}
              </select>

              {selectedBuilding ? (
                <select
                  value={selectedUnit}
                  onChange={(e) => setSelectedUnit(Number(e.target.value) || '')}
                  className="flex h-12 w-full rounded-2xl border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  required
                >
                  <option value="">בחר יחידה...</option>
                  {units.map((unit) => (
                    <option key={unit.id} value={unit.id}>
                      יחידה {unit.number}
                    </option>
                  ))}
                </select>
              ) : null}
            </CardContent>
          </Card>
        ) : null}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              דחיפות
            </CardTitle>
            <CardDescription>בחר מה הכי דחוף.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              {(['NORMAL', 'HIGH', 'URGENT'] as const).map((level) => (
                <button
                  key={level}
                  type="button"
                  onClick={() => setSeverity(level)}
                  className={`min-h-[92px] rounded-[24px] border p-4 text-center transition-all ${
                    severity === level
                      ? 'border-primary bg-primary/10 text-primary shadow-[0_14px_28px_rgba(59,130,246,0.14)]'
                      : 'border-border hover:bg-muted'
                  }`}
                >
                  <div className="font-medium">{getSeverityLabel(level)}</div>
                  <div className="mt-2 text-xs text-muted-foreground">{getSeverityHint(level)}</div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>מה קרה?</CardTitle>
            <CardDescription>תיאור קצר וברור.</CardDescription>
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

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Camera className="h-5 w-5" />
              תמונות
            </CardTitle>
            <CardDescription>צילום חדש הוא הדרך המהירה ביותר להסביר תקלה.</CardDescription>
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
                <Button type="button" onClick={openCameraPicker} className="min-h-16 w-full rounded-[24px] text-base shadow-[0_14px_32px_rgba(59,130,246,0.18)]">
                  <Camera className="mr-2 h-4 w-4" />
                  צלם תקלה עכשיו
                </Button>
                <Button type="button" variant="outline" onClick={openGalleryPicker} className="min-h-16 w-full rounded-[24px]">
                  בחר מהגלריה
                </Button>
              </div>

              <div className="rounded-[20px] border border-dashed border-primary/25 bg-primary/5 px-4 py-3 text-sm text-muted-foreground">
                תמונה אחת או שתיים בדרך כלל מספיקות.
              </div>
              
              {photos.length > 0 && (
                <div className="grid grid-cols-2 gap-4">
                  {photos.map((photo, index) => (
                    <div key={index} className="relative">
                      <img
                        src={URL.createObjectURL(photo)}
                        alt={`תמונה ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg border"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute top-2 right-2 h-6 w-6 p-0"
                        onClick={() => removePhoto(index)}
                      >
                        ×
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

      </form>

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
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
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
  showLocationEditor,
  onToggle,
}: {
  selectedBuilding?: Building;
  selectedUnit?: Unit;
  showLocationEditor: boolean;
  onToggle: () => void;
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
          <Button type="button" variant="outline" size="sm" onClick={onToggle} className="rounded-full">
            {showLocationEditor ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            {showLocationEditor ? 'סגור' : 'שנה מיקום'}
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

function getSeverityHint(level: string) {
  switch (level) {
    case 'URGENT':
      return 'סיכון מיידי';
    case 'HIGH':
      return 'צריך טיפול היום';
    default:
      return 'אפשר גם בהמשך';
  }
}
