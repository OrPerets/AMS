// /Users/orperetz/Documents/AMS/apps/frontend/components/RoleSwitcher.tsx
"use client";

import React, { useEffect, useState } from 'react';
import { Crown, UserX } from 'lucide-react';
import { getTokenPayload, startImpersonation, stopImpersonation } from '../lib/auth';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Card, CardContent } from './ui/card';
import { cn } from '../lib/utils';
import { toast } from './ui/use-toast';

const roles = ['ADMIN', 'PM', 'TECH', 'RESIDENT', 'ACCOUNTANT'];

const roleLabels = {
  ADMIN: 'מנהל',
  PM: 'מנהל נכס',
  TECH: 'טכנאי',
  RESIDENT: 'דייר',
  ACCOUNTANT: 'רואה חשבון',
  MASTER: 'מנהל ראשי'
};

export default function RoleSwitcher() {
  const [payload, setPayload] = useState<any | null>(null);
  const [role, setRole] = useState('ADMIN');
  const [tenantId, setTenantId] = useState(1);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setPayload(getTokenPayload());
  }, []);

  // Don't render on server or before mount to prevent hydration mismatch
  if (!mounted) {
    return null;
  }

  async function handleImpersonate() {
    setLoading(true);
    try {
      await startImpersonation(role, tenantId);
      setPayload(getTokenPayload());
      toast({
        title: "התחזות החלה",
        description: `עברת לתפקיד ${roleLabels[role as keyof typeof roleLabels]} בדייר ${tenantId}`,
        variant: "success",
      });
    } catch (error) {
      toast({
        title: "שגיאה בהתחזות",
        description: "לא ניתן להחליף תפקיד כרגע",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleStop() {
    setLoading(true);
    try {
      await stopImpersonation();
      setPayload(getTokenPayload());
      toast({
        title: "התחזות הופסקה",
        description: "חזרת למשתמש המקורי",
        variant: "info",
      });
    } catch (error) {
      toast({
        title: "שגיאה בהפסקת התחזות",
        description: "לא ניתן לחזור למשתמש המקורי כרגע",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  // Don't show for non-master users
  if (!payload || payload.role !== 'MASTER') return null;

  // Currently impersonating
  if (payload.actAsRole) {
    return (
      <Card className="bg-warning/10 border-warning/20">
        <CardContent className="flex items-center gap-3 p-3">
          <Crown className="h-4 w-4 text-warning" />
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">
              צפייה כ–{roleLabels[payload.actAsRole as keyof typeof roleLabels]}
            </span>
            <Badge variant="warning" className="text-xs">
              התחזות
            </Badge>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleStop}
            loading={loading}
            className="ms-auto"
          >
            <UserX className="me-1 h-3 w-3" />
            חזור למקורי
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Master user controls
  return (
    <Card className="bg-primary/5 border-primary/20">
      <CardContent className="flex items-center gap-3 p-3">
        <Crown className="h-4 w-4 text-primary" />
        <div className="flex items-center gap-2">
          <Select value={role} onValueChange={setRole}>
            <SelectTrigger className="h-8 w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {roles.map((r) => (
                <SelectItem key={r} value={r}>
                  {roleLabels[r as keyof typeof roleLabels]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Input
            type="number"
            value={tenantId}
            onChange={(e) => setTenantId(parseInt(e.target.value, 10))}
            className="h-8 w-20"
            placeholder="דייר"
            min={1}
          />
          
          <Button 
            variant="default" 
            size="sm" 
            onClick={handleImpersonate}
            loading={loading}
          >
            החלף תפקיד
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
