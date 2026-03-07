import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';

const sections = [
  {
    title: 'איסוף מידע',
    body: 'המערכת שומרת נתוני משתמש, פעילות תפעולית, מסמכים, והתראות כדי לאפשר ניהול נכסים, תחזוקה ופיננסים בצורה רציפה ומבוקרת.',
  },
  {
    title: 'שימוש במידע',
    body: 'המידע משמש לתפעול המוצר, שליחת התראות, תיעוד היסטוריית פעולות, תמיכה, ובקרת הרשאות לפי תפקידים וחשבונות.',
  },
  {
    title: 'שיתוף והרשאות',
    body: 'הגישה למידע מוגבלת לפי תפקיד. מסמכים, הודעות ונתוני משתמש נחשפים רק למשתמשים מורשים או לספקי שירות הנדרשים להפעלת המערכת.',
  },
  {
    title: 'שמירה ואבטחה',
    body: 'סיסמאות נשמרות כשהן מוצפנות, קריאות API מוגנות ב-JWT, והמערכת שומרת לוגים של פעולות ניהוליות כגון התחזות והרשאות.',
  },
];

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">מדיניות פרטיות</h1>
        <p className="text-muted-foreground">הצהרת פרטיות תפעולית למשתמשי AMS בסביבת הניהול והשטח.</p>
      </div>
      {sections.map((section) => (
        <Card key={section.title}>
          <CardHeader>
            <CardTitle>{section.title}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm leading-7 text-muted-foreground">{section.body}</CardContent>
        </Card>
      ))}
    </div>
  );
}
