import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { authFetch } from '../../lib/auth';
import { Button } from '../../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Textarea } from '../../components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { getStatusLabel } from '../../lib/utils';
import { toast } from '../../components/ui/use-toast';
import { MessageSquare, Send, Edit, Trash2 } from 'lucide-react';

interface TicketComment {
  id: number;
  content: string;
  createdAt: string;
  author: {
    id: number;
    email: string;
    role: string;
  };
}

interface Ticket {
  id: number;
  unitId: number;
  status: 'OPEN' | 'ASSIGNED' | 'IN_PROGRESS' | 'RESOLVED';
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  description?: string;
  photos: string[];
  comments: TicketComment[];
  unit?: {
    building: {
      name: string;
    };
  };
  assignedTo?: {
    id: number;
    email: string;
    role: string;
  };
}

export default function TicketDetails() {
  const router = useRouter();
  const { id } = router.query;
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [newComment, setNewComment] = useState('');
  const [editingComment, setEditingComment] = useState<number | null>(null);
  const [editCommentContent, setEditCommentContent] = useState('');

  const load = async () => {
    if (!id) return;
    const res = await authFetch(`/api/v1/tickets/${id}`);
    if (res.ok) setTicket(await res.json());
  };

  useEffect(() => {
    load();
  }, [id]);

  const updateStatus = async (status: string) => {
    try {
      await authFetch(`/api/v1/tickets/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      toast({ title: 'סטטוס עודכן' });
      load();
    } catch (e: any) {
      toast({ title: 'שגיאה', description: e?.message || 'נסו שוב', variant: 'destructive' });
    }
  };

  const assignToMe = async () => {
    try {
      await authFetch(`/api/v1/tickets/${id}/assign`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assigneeId: 1 }),
      });
      toast({ title: 'הקריאה הוקצתה' });
      load();
    } catch (e: any) {
      toast({ title: 'שגיאה', description: e?.message || 'נסו שוב', variant: 'destructive' });
    }
  };

  const addComment = async () => {
    if (!newComment.trim()) return;
    
    try {
      await authFetch(`/api/v1/tickets/${id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newComment }),
      });
      toast({ title: 'תגובה נוספה' });
      setNewComment('');
      load();
    } catch (e: any) {
      toast({ title: 'שגיאה', description: e?.message || 'נסו שוב', variant: 'destructive' });
    }
  };

  const updateComment = async (commentId: number) => {
    if (!editCommentContent.trim()) return;
    
    try {
      await authFetch(`/api/v1/tickets/comments/${commentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: editCommentContent }),
      });
      toast({ title: 'תגובה עודכנה' });
      setEditingComment(null);
      setEditCommentContent('');
      load();
    } catch (e: any) {
      toast({ title: 'שגיאה', description: e?.message || 'נסו שוב', variant: 'destructive' });
    }
  };

  const deleteComment = async (commentId: number) => {
    if (!confirm('האם אתה בטוח שברצונך למחוק את התגובה?')) return;
    
    try {
      await authFetch(`/api/v1/tickets/comments/${commentId}`, {
        method: 'DELETE',
      });
      toast({ title: 'תגובה נמחקה' });
      load();
    } catch (e: any) {
      toast({ title: 'שגיאה', description: e?.message || 'נסו שוב', variant: 'destructive' });
    }
  };

  const startEditComment = (comment: TicketComment) => {
    setEditingComment(comment.id);
    setEditCommentContent(comment.content);
  };

  const cancelEditComment = () => {
    setEditingComment(null);
    setEditCommentContent('');
  };

  if (!ticket) return <div>טוען...</div>;

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">קריאה #{ticket.id}</h1>
        {ticket.unit?.building && (
          <p className="text-sm text-muted-foreground">
            בניין: {ticket.unit.building.name}
          </p>
        )}
        <p>{ticket.description}</p>
        <div>סטטוס נוכחי: {getStatusLabel(ticket.status)}</div>
        {ticket.assignedTo && (
          <div className="text-sm text-muted-foreground">
            מוקצה ל: {ticket.assignedTo.email} ({ticket.assignedTo.role})
          </div>
        )}
        <div className="flex items-center gap-2">
          <Select value={ticket.status} onValueChange={updateStatus}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="OPEN">פתוח</SelectItem>
              <SelectItem value="ASSIGNED">הוקצה</SelectItem>
              <SelectItem value="IN_PROGRESS">בתהליך</SelectItem>
              <SelectItem value="RESOLVED">נפתרה</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={assignToMe}>הקצה לי</Button>
        </div>
        {ticket.photos?.length > 0 && (
          <div className="grid grid-cols-2 gap-2">
            {ticket.photos.map((p) => (
              <img key={p} src={p} alt="photo" className="rounded" />
            ))}
          </div>
        )}
      </div>

      {/* Comments Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            תגובות ({ticket.comments?.length || 0})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Add Comment Form */}
          <div className="space-y-2">
            <Textarea
              placeholder="הוסף תגובה..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              rows={3}
            />
            <Button onClick={addComment} disabled={!newComment.trim()}>
              <Send className="h-4 w-4 mr-2" />
              שלח תגובה
            </Button>
          </div>

          {/* Comments List */}
          <div className="space-y-3">
            {ticket.comments?.map((comment) => (
              <div key={comment.id} className="border rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{comment.author.email}</span>
                    <span className="text-xs text-muted-foreground">
                      ({comment.author.role})
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(comment.createdAt).toLocaleString('he-IL')}
                    </span>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => startEditComment(comment)}
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteComment(comment.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                
                {editingComment === comment.id ? (
                  <div className="space-y-2">
                    <Textarea
                      value={editCommentContent}
                      onChange={(e) => setEditCommentContent(e.target.value)}
                      rows={2}
                    />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => updateComment(comment.id)}>
                        שמור
                      </Button>
                      <Button size="sm" variant="outline" onClick={cancelEditComment}>
                        ביטול
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm">{comment.content}</p>
                )}
              </div>
            ))}
            
            {(!ticket.comments || ticket.comments.length === 0) && (
              <p className="text-sm text-muted-foreground text-center py-4">
                אין תגובות עדיין
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
