import React from 'react';

export default function SettingsPage() {
  return (
    <div className="container mx-auto p-6 space-y-8">
      <section>
        <h1 className="text-2xl font-bold mb-2">פרופיל</h1>
        <p className="text-muted-foreground">עדכון פרטי הפרופיל שלך.</p>
      </section>
      <section>
        <h2 className="text-xl font-semibold mb-2">סיסמה</h2>
        <p className="text-muted-foreground">שנה את הסיסמה שלך.</p>
      </section>
      <section>
        <h2 className="text-xl font-semibold mb-2">העדפות</h2>
        <p className="text-muted-foreground">נהל הגדרות והתראות.</p>
      </section>
    </div>
  );
}
