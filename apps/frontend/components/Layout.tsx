import Link from 'next/link';
import React from 'react';

interface Props {
  children: React.ReactNode;
}

export default function Layout({ children }: Props) {
  return (
    <div dir="rtl">
      <nav className="navbar">
        <Link href="/">דף הבית</Link>
        <Link href="/buildings">בניינים</Link>
        <Link href="/tickets">קריאות שירות</Link>
        <Link href="/payments">תשלומים</Link>
        <Link href="/admin/dashboard">דשבורד מנהל</Link>
        <Link href="/tech/jobs">משימות טכנאי</Link>
      </nav>
      <main className="container">{children}</main>
    </div>
  );
}
