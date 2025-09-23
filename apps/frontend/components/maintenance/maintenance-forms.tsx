"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";

const handleSubmit: React.FormEventHandler<HTMLFormElement> = (event) => {
  event.preventDefault();
};

export const MaintenanceForms: React.FC = () => {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <form onSubmit={handleSubmit} className="space-y-4">
          <CardHeader>
            <CardTitle className="text-lg">טופס בקשת תחזוקה</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label htmlFor="request-building">בניין</Label>
              <Input id="request-building" placeholder="מגדל האופרה" required />
            </div>
            <div>
              <Label htmlFor="request-unit">יחידה / מיקום</Label>
              <Input id="request-unit" placeholder="קומה 7 - חדר מכונות" required />
            </div>
            <div>
              <Label htmlFor="request-description">תיאור בעיה</Label>
              <Textarea id="request-description" placeholder="תאר את הבעיה" rows={4} required />
            </div>
            <Button type="submit" className="w-full">
              שליחת בקשה
            </Button>
          </CardContent>
        </form>
      </Card>

      <Card>
        <form onSubmit={handleSubmit} className="space-y-4">
          <CardHeader>
            <CardTitle className="text-lg">תכנון משימת תחזוקה</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label htmlFor="schedule-title">כותרת משימה</Label>
              <Input id="schedule-title" placeholder="בדיקת מערכת ספרינקלרים" required />
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <Label htmlFor="schedule-date">תאריך התחלה</Label>
                <Input id="schedule-date" type="date" required />
              </div>
              <div>
                <Label>תדירות</Label>
                <Select defaultValue="monthly">
                  <SelectTrigger>
                    <SelectValue placeholder="בחר תדירות" />
                  </SelectTrigger>
                  <SelectContent align="end">
                    <SelectItem value="weekly">שבועי</SelectItem>
                    <SelectItem value="monthly">חודשי</SelectItem>
                    <SelectItem value="quarterly">רבעוני</SelectItem>
                    <SelectItem value="yearly">שנתי</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="schedule-assignee">אחראי</Label>
              <Input id="schedule-assignee" placeholder="שם טכנאי" />
            </div>
            <Button type="submit" className="w-full" variant="secondary">
              שמירת תכנון
            </Button>
          </CardContent>
        </form>
      </Card>

      <Card>
        <form onSubmit={handleSubmit} className="space-y-4">
          <CardHeader>
            <CardTitle className="text-lg">יצירת הזמנת עבודה</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label htmlFor="work-title">כותרת עבודה</Label>
              <Input id="work-title" placeholder="שיפוץ חדר מכונות" required />
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <Label htmlFor="work-supplier">ספק</Label>
                <Input id="work-supplier" placeholder="שם חברה" required />
              </div>
              <div>
                <Label htmlFor="work-cost">עלות משוערת</Label>
                <Input id="work-cost" type="number" min={0} step={100} placeholder="0" />
              </div>
            </div>
            <div>
              <Label htmlFor="work-notes">הערות</Label>
              <Textarea id="work-notes" rows={3} placeholder="פרטי ביצוע" />
            </div>
            <Button type="submit" className="w-full" variant="outline">
              יצירת הזמנה
            </Button>
          </CardContent>
        </form>
      </Card>

      <Card>
        <form onSubmit={handleSubmit} className="space-y-4">
          <CardHeader>
            <CardTitle className="text-lg">רישום נכס חדש</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <Label htmlFor="asset-name">שם ציוד</Label>
                <Input id="asset-name" placeholder="יחידת צ'ילר" required />
              </div>
              <div>
                <Label htmlFor="asset-category">קטגוריה</Label>
                <Select defaultValue="HVAC">
                  <SelectTrigger>
                    <SelectValue placeholder="בחר קטגוריה" />
                  </SelectTrigger>
                  <SelectContent align="end">
                    <SelectItem value="HVAC">מערכות מיזוג</SelectItem>
                    <SelectItem value="ELECTRICAL">חשמל</SelectItem>
                    <SelectItem value="PLUMBING">אינסטלציה</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <Label htmlFor="asset-location">מיקום</Label>
                <Input id="asset-location" placeholder="חדר מכונות קומה -2" />
              </div>
              <div>
                <Label htmlFor="asset-value">עלות רכישה</Label>
                <Input id="asset-value" type="number" min={0} step={500} placeholder="0" />
              </div>
            </div>
            <Button type="submit" className="w-full" variant="secondary">
              שמירת נכס
            </Button>
          </CardContent>
        </form>
      </Card>

      <Card className="lg:col-span-2">
        <form onSubmit={handleSubmit} className="space-y-4">
          <CardHeader>
            <CardTitle className="text-lg">העלאת תיעוד תחזוקה</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-[2fr_1fr] md:items-end">
            <div className="space-y-3">
              <div>
                <Label htmlFor="photo-title">כותרת</Label>
                <Input id="photo-title" placeholder="תמונות לפני/אחרי" required />
              </div>
              <div>
                <Label htmlFor="photo-notes">תיאור</Label>
                <Textarea id="photo-notes" rows={3} placeholder="פרטים על הביצוע" />
              </div>
              <div>
                <Label htmlFor="photo-file">קבצים</Label>
                <Input id="photo-file" type="file" multiple accept="image/*" />
              </div>
            </div>
            <Button type="submit" className="w-full h-12">
              העלאת קבצים
            </Button>
          </CardContent>
        </form>
      </Card>
    </div>
  );
};
