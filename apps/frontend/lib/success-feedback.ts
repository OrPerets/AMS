import { toast } from '../components/ui/use-toast';
import { trackSuccessNextStep } from './analytics';
import { triggerHaptic } from './mobile';

type SuccessFeedbackOptions = {
  title: string;
  description?: string;
  nextStep?: {
    label: string;
    href: string;
  };
  screen?: string;
};

export function showSuccessFeedback({ title, description, nextStep, screen }: SuccessFeedbackOptions) {
  triggerHaptic('success');

  const toastResult = toast({
    title,
    description: description
      ? nextStep
        ? `${description} → ${nextStep.label}`
        : description
      : undefined,
    variant: 'success',
  });

  if (nextStep && screen) {
    trackSuccessNextStep(screen, nextStep.label);
  }

  return toastResult;
}

export function showLoginSuccess(role?: string | null) {
  const roleLabels: Record<string, string> = {
    ADMIN: 'מנהל מערכת',
    PM: 'מנהל נכס',
    TECH: 'טכנאי',
    RESIDENT: 'דייר',
    ACCOUNTANT: 'כספים',
    MASTER: 'מנהל-על',
  };

  const roleLabel = role ? roleLabels[role] || role : '';
  showSuccessFeedback({
    title: 'ההתחברות הצליחה',
    description: roleLabel ? `מועבר למרחב העבודה של ${roleLabel}` : 'מועבר למסך העבודה שלך',
    screen: 'login',
  });
}

export function showWorkspaceEntrySuccess(workspace: 'ams' | 'gardens' | 'supervision') {
  const labels: Record<string, { title: string; description: string }> = {
    ams: { title: 'נכנסת ל-AMS', description: 'מרחב העבודה הראשי פתוח ומוכן.' },
    gardens: { title: 'מודול הגינון', description: 'מעבר ישיר למודול הגינון.' },
    supervision: { title: 'דוח פיקוח', description: 'פותח מערכת חיצונית בחלון חדש.' },
  };

  const entry = labels[workspace] || labels.ams;
  showSuccessFeedback({ title: entry.title, description: entry.description, screen: 'role-selection' });
}

export function showPaymentSuccess(amount?: string) {
  showSuccessFeedback({
    title: 'התשלום בוצע בהצלחה',
    description: amount ? `סכום ${amount} שולם` : 'החשבונית סומנה כשולמה',
    nextStep: { label: 'חזרה לחשבון', href: '/resident/account' },
    screen: 'payments',
  });
}

export function showRequestSubmitted(requestType?: string) {
  showSuccessFeedback({
    title: 'הבקשה הוגשה בהצלחה',
    description: requestType ? `בקשת ${requestType} נשמרה ותטופל בהקדם` : 'הבקשה נשמרה ותטופל בהקדם',
    nextStep: { label: 'צפה בהיסטוריה', href: '/resident/requests?view=history' },
    screen: 'requests',
  });
}

export function showTicketCreated() {
  showSuccessFeedback({
    title: 'הקריאה נפתחה בהצלחה',
    description: 'הצוות קיבל את הפנייה ויטפל בה. אפשר לעקוב מהאזור האישי.',
    nextStep: { label: 'חזרה לבית', href: '/resident/account' },
    screen: 'create-call',
  });
}

export function showGardensMonthCreated(planLabel: string) {
  showSuccessFeedback({
    title: 'חודש גינון חדש נוצר',
    description: `החודש ${planLabel} מוכן לעבודה. העובדים יכולים להתחיל להגיש.`,
    screen: 'gardens',
  });
}

export function showGardensApproval(workerName?: string) {
  showSuccessFeedback({
    title: 'ההגשה אושרה',
    description: workerName ? `${workerName} קיבל אישור` : 'ההגשה אושרה בהצלחה',
    nextStep: { label: 'המשך לאישורים', href: '/gardens' },
    screen: 'gardens',
  });
}

export function showSettingsSaved(section: string) {
  const sectionLabels: Record<string, string> = {
    profile: 'הפרופיל',
    password: 'הסיסמה',
    preferences: 'העדפות ההתראה',
    language: 'הגדרות השפה',
  };

  showSuccessFeedback({
    title: `${sectionLabels[section] || section} נשמרו`,
    description: 'השינויים נכנסו לתוקף באופן מיידי.',
    screen: 'settings',
  });
}
