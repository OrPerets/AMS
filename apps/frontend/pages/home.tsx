import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  Building, 
  Ticket, 
  CreditCard, 
  Wrench, 
  BarChart3,
  Users,
  ArrowLeft,
  Calendar,
  Clock,
  CheckCircle
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { getTokenPayload } from '../lib/auth';
import { useLocale } from '../lib/providers';

const quickActions = [
  {
    title: 'קריאות שירות',
    description: 'צפייה וניהול קריאות שירות',
    icon: Ticket,
    href: '/tickets',
    color: 'bg-blue-500',
    roles: ['ADMIN', 'PM', 'TECH', 'RESIDENT']
  },
  {
    title: 'דשבורד ניהול',
    description: 'סקירה כללית של המערכת',
    icon: BarChart3,
    href: '/admin/dashboard',
    color: 'bg-purple-500',
    roles: ['ADMIN', 'PM']
  },
  {
    title: 'משימות היום',
    description: 'רשימת משימות לטכנאי',
    icon: Wrench,
    href: '/tech/jobs',
    color: 'bg-green-500',
    roles: ['TECH']
  },
  {
    title: 'תשלומים',
    description: 'ניהול חשבוניות ותשלומים',
    icon: CreditCard,
    href: '/payments',
    color: 'bg-yellow-500',
    roles: ['ADMIN', 'PM', 'RESIDENT', 'ACCOUNTANT']
  },
  {
    title: 'ניהול בניינים',
    description: 'מידע על בניינים ויחידות',
    icon: Building,
    href: '/buildings',
    color: 'bg-indigo-500',
    roles: ['ADMIN', 'PM']
  },
];

export default function Home() {
  const [userRole, setUserRole] = useState<string>('RESIDENT');
  const [mounted, setMounted] = useState(false);
  const { t } = useLocale();

  useEffect(() => {
    setMounted(true);
    const payload = getTokenPayload();
    setUserRole(payload?.actAsRole || payload?.role || 'RESIDENT');
  }, []);

  if (!mounted) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">טוען...</p>
        </div>
      </div>
    );
  }

  const userActions = quickActions.filter(action => 
    action.roles.includes(userRole)
  );

  const getRoleTitle = (role: string) => {
    const roleTitles = {
      'ADMIN': 'מנהל מערכת',
      'PM': 'מנהל נכס',
      'TECH': 'טכנאי',
      'RESIDENT': 'דייר',
      'ACCOUNTANT': 'רואה חשבון',
      'MASTER': 'מנהל ראשי'
    };
    return roleTitles[role as keyof typeof roleTitles] || 'משתמש';
  };

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center space-x-3 mb-6">
          <div className="h-12 w-12 bg-primary rounded-lg flex items-center justify-center">
            <span className="text-2xl font-bold text-primary-foreground">ע</span>
          </div>
          <div className="text-right">
            <h1 className="text-4xl font-bold text-foreground">
              ברוכים הבאים לעמית אקסלנס
            </h1>
            <p className="text-xl text-muted-foreground">
              מערכת ניהול אחזקות מתקדמת
            </p>
          </div>
        </div>
        
        <div className="flex items-center justify-center gap-2">
          <Badge variant="outline" className="text-sm">
            <Users className="h-3 w-3 me-1" />
            {getRoleTitle(userRole)}
          </Badge>
          <Badge variant="outline" className="text-sm">
            <Calendar className="h-3 w-3 me-1" />
            {new Date().toLocaleDateString('he-IL')}
          </Badge>
        </div>
      </div>

      {/* Quick Actions Grid */}
      <div>
        <h2 className="text-2xl font-semibold mb-6 text-center">פעולות מהירות</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {userActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link key={action.href} href={action.href}>
                <Card className="group cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.02] border-2 hover:border-primary/20">
                  <CardHeader className="text-center pb-4">
                    <div className={`w-16 h-16 rounded-full ${action.color} mx-auto mb-4 flex items-center justify-center group-hover:scale-110 transition-transform duration-200`}>
                      <Icon className="h-8 w-8 text-white" />
                    </div>
                    <CardTitle className="text-xl">{action.title}</CardTitle>
                    <CardDescription className="text-center">
                      {action.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="text-center pt-0">
                    <Button variant="outline" className="group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                      כניסה
                      <ArrowLeft className="ms-2 h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">מערכת פעילה</CardTitle>
            <CheckCircle className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">תקינה</div>
            <p className="text-xs text-muted-foreground">
              כל המערכות פועלות כהלכה
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">זמן תגובה</CardTitle>
            <Clock className="h-4 w-4 text-info" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">&lt; 2 שעות</div>
            <p className="text-xs text-muted-foreground">
              זמן תגובה ממוצע
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">שביעות רצון</CardTitle>
            <Users className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">98%</div>
            <p className="text-xs text-muted-foreground">
              מהדיירים מרוצים מהשירות
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Help Section */}
      <Card className="bg-muted/30">
        <CardHeader>
          <CardTitle>זקוקים לעזרה?</CardTitle>
          <CardDescription>
            אנחנו כאן כדי לעזור לכם. ניתן לפנות אלינו בכל שאלה או בעיה.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Button variant="outline">
              צור קשר עם התמיכה
            </Button>
            <Button variant="ghost">
              מדריך למשתמש
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


