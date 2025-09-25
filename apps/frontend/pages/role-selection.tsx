import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Building, User, Wrench, Shield, Settings } from 'lucide-react';
import { startImpersonation, getTokenPayload, logout } from '../lib/auth';
import { toast } from '../components/ui/use-toast';

const roleConfig = {
  ADMIN: {
    label: 'מנהל',
    description: 'ניהול כללי של המערכת',
    icon: Settings,
    color: 'bg-blue-500',
  },
  PM: {
    label: 'מנהל נכס',
    description: 'ניהול נכסים ותחזוקה',
    icon: Building,
    color: 'bg-green-500',
  },
  TECH: {
    label: 'מפקח',
    description: 'פיקוח וביצוע עבודות תחזוקה',
    icon: Wrench,
    color: 'bg-orange-500',
  },
  RESIDENT: {
    label: 'דייר',
    description: 'הגשת בקשות ותקלות',
    icon: User,
    color: 'bg-purple-500',
  },
  MASTER: {
    label: 'מנהל ראשי',
    description: 'גישה מלאה למערכת',
    icon: Shield,
    color: 'bg-gray-500',
  },
};

export default function RoleSelectionPage() {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Check if user is authenticated and is master
    const payload = getTokenPayload();
    if (!payload || payload.role !== 'MASTER') {
      router.replace('/login');
      return;
    }
  }, [router]);

  // Don't render on server or before mount to prevent hydration mismatch
  if (!mounted) {
    return null;
  }

  async function handleRoleSelection(role: string) {
    setLoading(role);
    try {
      // For master user, we'll impersonate as the selected role with tenant 1
      await startImpersonation(role, 1, 'Role selection from login');
      
      toast({
        title: "התחברת בהצלחה",
        description: `עברת לתפקיד ${roleConfig[role as keyof typeof roleConfig]?.label}`,
        variant: "success",
      });

      // Redirect to the appropriate route for the selected role
      const next = typeof router.query.next === 'string' ? router.query.next : getDefaultRoute(role);
      router.replace(next);
    } catch (error) {
      toast({
        title: "שגיאה בהתחברות",
        description: "לא ניתן להתחבר לתפקיד הנבחר כרגע",
        variant: "destructive",
      });
    } finally {
      setLoading(null);
    }
  }

  function getDefaultRoute(role: string): string {
    switch (role) {
      case 'ADMIN':
      case 'PM':
      case 'MASTER':
        return '/admin/dashboard';
      case 'TECH':
        return '/tech/jobs';
      case 'ACCOUNTANT':
        return '/payments';
      case 'RESIDENT':
        return '/tickets';
      default:
        return '/home';
    }
  }

  function handleLogout() {
    logout();
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="h-16 w-16 bg-primary rounded-xl flex items-center justify-center shadow-lg">
              <Building className="h-8 w-8 text-primary-foreground" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            עמית אקסלנס
          </h1>
          <p className="text-xl text-muted-foreground mb-2">
            באיזה תפקיד תרצה לצפות?
          </p>
          <p className="text-sm text-muted-foreground">
            בחר את התפקיד שבו תרצה להשתמש במערכת
          </p>
        </div>

        {/* Role Selection Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {Object.entries(roleConfig).map(([role, config]) => {
            const IconComponent = config.icon;
            return (
              <Card 
                key={role} 
                className="cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-105 border-2 hover:border-primary/50"
                onClick={() => handleRoleSelection(role)}
              >
                <CardHeader className="text-center pb-4">
                  <div className={`w-16 h-16 ${config.color} rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg`}>
                    <IconComponent className="h-8 w-8 text-white" />
                  </div>
                  <CardTitle className="text-xl">{config.label}</CardTitle>
                  <CardDescription className="text-sm">
                    {config.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <Button 
                    className="w-full" 
                    disabled={loading === role}
                    loading={loading === role}
                  >
                    {loading === role ? 'מתחבר...' : 'בחר תפקיד'}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Logout Button */}
        <div className="text-center">
          <Button 
            variant="outline" 
            onClick={handleLogout}
            className="text-muted-foreground hover:text-foreground"
          >
            התנתק
          </Button>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-xs text-muted-foreground">
          © 2024 עמית אקסלנס. כל הזכויות שמורות.
        </div>
      </div>
    </div>
  );
}
