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
    tone: 'finance',
  },
  PM: {
    label: 'מנהל נכס',
    description: 'ניהול נכסים ותחזוקה',
    icon: Building,
    tone: 'success',
  },
  TECH: {
    label: 'מפקח',
    description: 'פיקוח וביצוע עבודות תחזוקה',
    icon: Wrench,
    tone: 'warning',
  },
  RESIDENT: {
    label: 'דייר',
    description: 'הגשת בקשות ותקלות',
    icon: User,
    tone: 'default',
  },
  MASTER: {
    label: 'מנהל ראשי',
    description: 'גישה מלאה למערכת',
    icon: Shield,
    tone: 'accent',
  },
};

export default function RoleSelectionPage() {
  const year = new Date().getFullYear();
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
      case 'MASTER':
        return '/admin/dashboard';
      case 'PM':
        return '/tickets';
      case 'TECH':
        return '/tech/jobs';
      case 'ACCOUNTANT':
        return '/payments';
      case 'RESIDENT':
        return '/resident/account';
      default:
        return '/home';
    }
  }

  function handleLogout() {
    logout();
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(201,156,72,0.14),transparent_30%),linear-gradient(180deg,rgba(250,247,240,0.96),rgba(245,240,230,0.86))] p-3 sm:p-4">
      <div className="mx-auto flex min-h-screen w-full max-w-5xl items-center">
        <div className="w-full">
        {/* Header */}
        <div className="mb-6 sm:mb-8 text-center">
          <div className="mb-3 sm:mb-4 flex items-center justify-center">
            <div className="flex h-12 w-12 sm:h-16 sm:w-16 items-center justify-center rounded-xl sm:rounded-[22px] bg-primary text-primary-foreground shadow-raised">
              <Building className="h-6 w-6 sm:h-8 sm:w-8 text-primary-foreground" />
            </div>
          </div>
          <h1 className="mb-1.5 sm:mb-2 text-xl sm:text-3xl font-bold text-foreground">
            עמית אקסלנס
          </h1>
          <p className="mb-1 sm:mb-2 text-base sm:text-xl text-muted-foreground">
            באיזה תפקיד תרצה לצפות?
          </p>
          <p className="text-xs sm:text-sm text-muted-foreground">
            בחר את התפקיד שבו תרצה להשתמש במערכת
          </p>
        </div>

        {/* Role Selection Grid */}
        <div className="mb-6 sm:mb-8 grid grid-cols-2 gap-3 sm:gap-6 md:grid-cols-3 lg:grid-cols-3">
          {Object.entries(roleConfig).map(([role, config]) => {
            const IconComponent = config.icon;
            const chipClass =
              config.tone === 'success'
                ? 'bg-success text-success-foreground'
                : config.tone === 'warning'
                  ? 'bg-warning text-warning-foreground'
                  : config.tone === 'accent'
                    ? 'bg-accent text-accent-foreground'
                    : config.tone === 'default'
                      ? 'bg-secondary text-secondary-foreground'
                      : 'bg-primary text-primary-foreground';
            return (
              <Card 
                key={role} 
                variant="elevated"
                className="cursor-pointer border-2 border-subtle-border transition-all duration-200 hover:scale-[1.02] hover:border-primary/35 hover:shadow-raised active:scale-[0.98]"
                onClick={() => handleRoleSelection(role)}
              >
                <CardHeader className="text-center pb-2 sm:pb-4">
                  <div className={`mx-auto mb-2 sm:mb-4 flex h-10 w-10 sm:h-14 sm:w-14 items-center justify-center rounded-xl sm:rounded-[20px] shadow-card ${chipClass}`}>
                    <IconComponent className="h-5 w-5 sm:h-7 sm:w-7" />
                  </div>
                  <CardTitle className="text-sm sm:text-lg">{config.label}</CardTitle>
                  <CardDescription className="text-[11px] sm:text-sm hidden sm:block">
                    {config.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <Button 
                    className="w-full" 
                    size="sm"
                    disabled={loading === role}
                    loading={loading === role}
                  >
                    {loading === role ? 'מתחבר...' : 'בחר'}
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
          © {year} עמית אקסלנס. כל הזכויות שמורות.
        </div>
        </div>
      </div>
    </div>
  );
}
