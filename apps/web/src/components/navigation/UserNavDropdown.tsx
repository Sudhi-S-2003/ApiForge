'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { User, LogOut, LayoutDashboard, Users, Settings, ChevronDown } from 'lucide-react';
import { logoutAction } from '@/actions/auth.actions';

export interface UserNavProps {
  user: {
    id: string;
    name: string;
    email: string;
    avatarUrl?: string | null;
  };
}

export function UserNavDropdown({ user }: { user?: UserNavProps['user'] | null }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  if (!user) return null;

  const initial = (user.name || user.email || 'U').charAt(0).toUpperCase();

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2.5 rounded-full border border-border bg-card p-1.5 pr-3 text-sm font-medium hover:bg-accent transition-colors shadow-xs"
        aria-expanded={isOpen}
      >
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold text-xs shadow-xs">
          {initial}
        </div>
        <div className="hidden sm:flex flex-col text-left">
          <span className="text-xs font-semibold leading-none truncate max-w-[120px]">{user.name || user.email}</span>
          <span className="text-[10px] text-muted-foreground truncate max-w-[120px]">{user.email}</span>
        </div>
        <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
      </button>

      {isOpen && (
        <div className="absolute right-0 z-50 mt-2 w-56 origin-top-right rounded-xl border border-border bg-card p-1.5 shadow-xl ring-1 ring-black/5 animate-in fade-in-50 zoom-in-95">
          <div className="px-3 py-2 border-b border-border mb-1">
            <p className="text-xs font-semibold text-foreground truncate">{user.name}</p>
            <p className="text-[11px] text-muted-foreground truncate">{user.email}</p>
          </div>

          <Link
            href="/dashboard"
            onClick={() => setIsOpen(false)}
            className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-foreground hover:bg-accent transition-colors"
          >
            <LayoutDashboard className="h-4 w-4 text-muted-foreground" />
            <span>Dashboard</span>
          </Link>

          <Link
            href="/team"
            onClick={() => setIsOpen(false)}
            className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-foreground hover:bg-accent transition-colors"
          >
            <Users className="h-4 w-4 text-muted-foreground" />
            <span>Team & RBAC</span>
          </Link>

          <Link
            href="/settings"
            onClick={() => setIsOpen(false)}
            className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-foreground hover:bg-accent transition-colors"
          >
            <Settings className="h-4 w-4 text-muted-foreground" />
            <span>Settings</span>
          </Link>

          <div className="my-1 border-t border-border" />

          <form action={logoutAction}>
            <button
              type="submit"
              className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-destructive hover:bg-destructive/10 transition-colors"
            >
              <LogOut className="h-4 w-4" />
              <span>Sign Out</span>
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
