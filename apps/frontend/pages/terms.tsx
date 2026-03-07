import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';

const terms = [
  'השימוש במערכת מותר למשתמשים מורשים בלבד ובהתאם לתפקיד שהוקצה להם.',
  'כל פעולה במערכת עשויה להישמר לצורכי בקרה, תמיכה, אבטחה ותיעוד רגולטורי.',
  'אין לשתף פרטי גישה, קישורי תשלום, מסמכים רגישים או נתוני דיירים עם גורמים לא מורשים.',
  'מנהלי מערכת רשאים להשעות משתמש, להגביל הרשאות או לבצע התחזות תפעולית לצורכי תמיכה ואבחון.',
  'המערכת מסופקת כפי שהיא, ומומלץ לוודא נתונים כספיים ותפעוליים קריטיים לפני פעולה בלתי הפיכה.',
];

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">תנאי שימוש</h1>
        <p className="text-muted-foreground">המסמך מסדיר שימוש במערכת ניהול הנכסים, לרבות גישה למידע ותפעול תפקידים.</p>
      </div>
      {terms.map((term, index) => (
        <Card key={index}>
          <CardHeader>
            <CardTitle>סעיף {index + 1}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm leading-7 text-muted-foreground">{term}</CardContent>
        </Card>
      ))}
    </div>
  );
}
