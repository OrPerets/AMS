import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { 
  Phone, 
  Building, 
  MapPin, 
  AlertTriangle,
  Camera,
  Send,
  ArrowLeft,
  CheckCircle
} from 'lucide-react';
import { authFetch } from '../lib/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Badge } from '../components/ui/badge';
import { useLocale } from '../lib/providers';
import { toast } from '../components/ui/use-toast';
import { getTokenPayload } from '../lib/auth';

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
  const { t } = useLocale();

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
    const files = Array.from(event.target.files || []);
    setPhotos(prev => [...prev, ...files]);
  };

  const removePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
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

        // Reset form
        setDescription('');
        setPhotos([]);
        setSeverity('HIGH');
        
        // Redirect to tickets page or show success message
        setTimeout(() => {
          router.push('/tickets');
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
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button 
          variant="ghost" 
          size="icon"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">פתיחת קריאת שירות</h1>
          <p className="text-muted-foreground">
            דווח על בעיה שדורשת טיפול טכני
          </p>
        </div>
      </div>

      {/* User Info */}
      {userInfo && (
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Phone className="h-5 w-5 text-blue-600" />
              מידע אישי
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-sm">
              <span className="font-medium">{userInfo.email}</span>
              <Badge variant="outline">{userInfo.role === 'RESIDENT' ? 'דייר' : userInfo.role}</Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Building Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              בחירת בניין
            </CardTitle>
            <CardDescription>
              בחר את הבניין שבו נמצאת הבעיה
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Input
              placeholder="חיפוש לפי כתובת או שם בניין"
              value={buildingQuery}
              onChange={(e) => setBuildingQuery(e.target.value)}
              className="mb-3"
            />
            <select
              value={selectedBuilding}
              onChange={(e) => setSelectedBuilding(Number(e.target.value) || '')}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              required
            >
              <option value="">בחר בניין...</option>
              {filteredBuildings.map((building) => (
                <option key={building.id} value={building.id}>
                  {building.address}
                </option>
              ))}
            </select>
          </CardContent>
        </Card>

        {/* Unit Selection */}
        {selectedBuilding && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                בחירת יחידה
              </CardTitle>
              <CardDescription>
                בחר את היחידה הספציפית
              </CardDescription>
            </CardHeader>
            <CardContent>
              <select
                value={selectedUnit}
                onChange={(e) => setSelectedUnit(Number(e.target.value) || '')}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                required
              >
                <option value="">בחר יחידה...</option>
                {units.map((unit) => (
                  <option key={unit.id} value={unit.id}>
                    יחידה {unit.number}
                  </option>
                ))}
              </select>
            </CardContent>
          </Card>
        )}

        {/* Severity Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              רמת חומרה
            </CardTitle>
            <CardDescription>
              בחר את רמת החומרה של הבעיה
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              {(['NORMAL', 'HIGH', 'URGENT'] as const).map((level) => (
                <button
                  key={level}
                  type="button"
                  onClick={() => setSeverity(level)}
                  className={`p-4 border rounded-lg text-center transition-colors ${
                    severity === level
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border hover:bg-muted'
                  }`}
                >
                  <div className="font-medium">{getSeverityLabel(level)}</div>
                  <Badge variant={getSeverityColor(level)} className="mt-2">
                    {level}
                  </Badge>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Description */}
        <Card>
          <CardHeader>
            <CardTitle>פתיחת קריאה</CardTitle>
            <CardDescription>
              תאר בפירוט את הבעיה שדורשת טיפול
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="תאר את הבעיה בפירוט... (למשל: ברז דולף, בעיית חשמל, בעיית מיזוג אוויר וכו')"
              className="min-h-[120px]"
              required
            />
          </CardContent>
        </Card>

        {/* Photo Upload */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Camera className="h-5 w-5" />
              צירוף תמונות (אופציונלי)
            </CardTitle>
            <CardDescription>
              צרף תמונות שיכולות לעזור להבין את הבעיה
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Input
                type="file"
                accept="image/*"
                multiple
                onChange={handlePhotoUpload}
                className="cursor-pointer"
              />
              
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

        {/* Submit Button */}
        <Card>
          <CardContent className="pt-6">
            <Button 
              type="submit" 
              className="w-full" 
              size="lg"
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  שולח קריאה...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  פתח קריאת שירות
                </>
              )}
            </Button>
            
            <p className="text-sm text-muted-foreground text-center mt-4">
              הקריאה תועבר מיד לצוות הטכני ותופיע בלוח הקריאות של מאיה
            </p>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
