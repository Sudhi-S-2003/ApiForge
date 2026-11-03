'use client';

import React, { useState } from 'react';
import { inviteMemberAction } from '@/actions/workspace.actions';
import { UserPlus, Loader2, CheckCircle2 } from 'lucide-react';

export function InviteMemberForm({ workspaceId }: { workspaceId: string }) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'ADMIN' | 'EDITOR' | 'VIEWER'>('EDITOR');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsLoading(true);
    setMessage(null);

    const res = await inviteMemberAction(workspaceId, email, role);
    setIsLoading(false);

    if (res.error) {
      setMessage({ type: 'error', text: res.error });
    } else {
      setMessage({ type: 'success', text: `Invitation successfully sent to ${email}` });
      setEmail('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {message && (
        <div
          className={`flex items-center gap-2 rounded-lg p-3 text-xs ${
            message.type === 'success'
              ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
              : 'bg-destructive/10 text-destructive border border-destructive/20'
          }`}
        >
          {message.type === 'success' && <CheckCircle2 className="h-4 w-4 shrink-0" />}
          <span>{message.text}</span>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="sm:col-span-2">
          <label className="block text-xs font-medium text-muted-foreground mb-1">
            Email Address
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="colleague@company.com"
            required
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-hidden focus:ring-2 focus:ring-primary"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1">
            Role Permission
          </label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as any)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-hidden focus:ring-2 focus:ring-primary"
          >
            <option value="VIEWER">Viewer (Read Only)</option>
            <option value="EDITOR">Editor (Contracts & Specs)</option>
            <option value="ADMIN">Admin (Manage Members)</option>
          </select>
        </div>
      </div>

      <button
        type="submit"
        disabled={isLoading || !email}
        className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-xs hover:bg-primary/90 disabled:opacity-50 transition-colors"
      >
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Sending Invite...</span>
          </>
        ) : (
          <>
            <UserPlus className="h-4 w-4" />
            <span>Send Invitation</span>
          </>
        )}
      </button>
    </form>
  );
}
