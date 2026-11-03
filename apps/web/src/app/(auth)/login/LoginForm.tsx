'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  loginAction,
  rememberLoginAction,
} from '@/actions/auth.actions';
import {
  getRememberedAccounts,
  saveRememberedAccount,
  removeRememberedAccount,
  RememberedAccount,
} from '@/lib/remember-me';
import {
  Mail,
  Lock,
  ArrowRight,
  AlertCircle,
  UserCheck,
  UserPlus,
  Trash2,
  ChevronDown,
  Loader2,
  ShieldCheck,
} from 'lucide-react';

export function LoginForm() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);

  const [rememberedAccounts, setRememberedAccounts] = useState<RememberedAccount[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isOtherUserMode, setIsOtherUserMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [authenticatingAccount, setAuthenticatingAccount] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load remembered accounts from localStorage on mount (filters out expired accounts automatically)
  useEffect(() => {
    refreshAccounts();
  }, []);

  const refreshAccounts = () => {
    const validAccounts = getRememberedAccounts();
    setRememberedAccounts(validAccounts);
  };

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputFocus = () => {
    if (rememberedAccounts.length > 0 && !isOtherUserMode) {
      setIsDropdownOpen(true);
    }
  };

  const handleInputClick = () => {
    if (rememberedAccounts.length > 0 && !isOtherUserMode) {
      setIsDropdownOpen((prev) => !prev);
    }
  };

  const handleSelectOtherUser = () => {
    setIsDropdownOpen(false);
    setIsOtherUserMode(true);
    setEmail('');
    setPassword('');
    setTimeout(() => {
      inputRef.current?.focus();
    }, 50);
  };

  const handleSwitchToSaved = () => {
    setIsOtherUserMode(false);
    setIsDropdownOpen(true);
    setEmail('');
  };

  // 1. Passwordless instant login using Remember-Me token (3rd token)
  const handleSelectAccount = async (account: RememberedAccount) => {
    setIsDropdownOpen(false);
    setError(null);
    setAuthenticatingAccount(account.id);
    setLoading(true);

    try {
      const res = await rememberLoginAction({
        rememberToken: account.rememberToken,
        userId: account.id,
      });

      if (res.error) {
        // If expired or revoked, purge this account from device
        removeRememberedAccount(account.id);
        refreshAccounts();
        setEmail(account.email);
        setError(res.error);
        setLoading(false);
        setAuthenticatingAccount(null);
        return;
      }

      // If rotation returned fresh rememberToken, persist it
      if (res.rememberToken && res.rememberExpiresAt) {
        saveRememberedAccount({
          id: res.user.id,
          name: res.user.name,
          email: res.user.email,
          rememberToken: res.rememberToken,
          expiresAt: res.rememberExpiresAt,
        });
      }

      router.push('/dashboard');
      router.refresh();
    } catch {
      setError('Unable to authenticate with saved session. Please sign in manually.');
      setLoading(false);
      setAuthenticatingAccount(null);
    }
  };

  // 2. Standard username/password login
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData();
    formData.append('email', email);
    formData.append('password', password);
    formData.append('rememberMe', rememberMe ? 'true' : 'false');

    try {
      const res = await loginAction(null, formData);

      if (res?.error) {
        setError(res.error);
        setLoading(false);
        return;
      }

      // If Remember Me was requested and server returned a remember token, store it
      if (rememberMe && res?.rememberToken && res?.rememberExpiresAt && res?.user) {
        saveRememberedAccount({
          id: res.user.id,
          name: res.user.name,
          email: res.user.email,
          rememberToken: res.rememberToken,
          expiresAt: res.rememberExpiresAt,
        });
      }

      router.push('/dashboard');
      router.refresh();
    } catch {
      setError('An unexpected error occurred during sign-in.');
      setLoading(false);
    }
  };

  const handleRemoveAccount = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    removeRememberedAccount(id);
    refreshAccounts();
  };

  // Determines if the form is in saved account picker mode vs manual credential entry mode
  const isSavedAccountMode = rememberedAccounts.length > 0 && !isOtherUserMode;

  return (
    <div className="space-y-6">
      {error && (
        <div className="flex items-center gap-3 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Remembered Quick Switcher Banner (if accounts exist) */}
      {rememberedAccounts.length > 0 && (
        <div className="rounded-lg border border-border bg-muted/30 p-3 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-muted-foreground">
            <UserCheck className="h-4 w-4 text-primary" />
            <span>
              {rememberedAccounts.length} saved account{rememberedAccounts.length > 1 ? 's' : ''} on this device
            </span>
          </div>
          <button
            type="button"
            onClick={handleSwitchToSaved}
            className="text-primary font-medium hover:underline flex items-center gap-1"
          >
            <span>{isOtherUserMode ? 'Choose Saved Account' : 'Switch'}</span>
            <ChevronDown className="h-3 w-3" />
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Username / Email with Dropdown */}
        <div className="space-y-2 relative" ref={dropdownRef}>
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium leading-none" htmlFor="email">
              Username or Email Address
            </label>
            {isOtherUserMode && rememberedAccounts.length > 0 && (
              <button
                type="button"
                onClick={handleSwitchToSaved}
                className="text-xs text-primary hover:underline font-medium"
              >
                ← Use Saved Account
              </button>
            )}
          </div>

          <div className="relative">
            <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            {/* Hidden fallback email field ensuring form submit receives the value */}
            <input type="hidden" name="email" value={email} />
            <input
              ref={inputRef}
              id={isSavedAccountMode ? 'account_selector' : 'email'}
              name={isSavedAccountMode ? 'account_selector' : 'email'}
              type="text"
              readOnly={isSavedAccountMode}
              autoComplete={isSavedAccountMode ? 'off' : 'username'}
              data-lpignore={isSavedAccountMode ? 'true' : 'false'}
              data-1p-ignore={isSavedAccountMode ? 'true' : 'false'}
              data-form-type={isSavedAccountMode ? 'other' : 'email'}
              placeholder={isSavedAccountMode ? 'Click to select saved account' : 'e.g. developer@example.com'}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onFocus={handleInputFocus}
              onClick={handleInputClick}
              required
              className={`flex h-10 w-full rounded-md border border-input bg-background pl-9 pr-9 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                isSavedAccountMode ? 'cursor-pointer select-none' : ''
              }`}
            />
            {rememberedAccounts.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  if (isOtherUserMode) {
                    setIsOtherUserMode(false);
                    setIsDropdownOpen(true);
                  } else {
                    setIsDropdownOpen(!isDropdownOpen);
                  }
                }}
                className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
                title="Select from saved accounts"
              >
                <ChevronDown className={`h-4 w-4 transition-transform ${isDropdownOpen && !isOtherUserMode ? 'rotate-180' : ''}`} />
              </button>
            )}
          </div>

          {/* Account Dropdown List */}
          {isDropdownOpen && isSavedAccountMode && (
            <div className="absolute left-0 right-0 top-full z-50 mt-1 rounded-xl border border-border bg-card p-1.5 shadow-xl ring-1 ring-black/5 animate-in fade-in-50 zoom-in-95">
              <div className="px-3 py-1.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center justify-between border-b border-border/60 mb-1">
                <span>Select a Saved Account</span>
                <span className="text-[10px] lowercase text-muted-foreground/80 font-normal">
                  (passwordless sign-in)
                </span>
              </div>

              <div className="max-h-56 overflow-y-auto space-y-1">
                {rememberedAccounts.map((account) => {
                  const initial = (account.name || account.email || 'U').charAt(0).toUpperCase();
                  const isAuthenticating = authenticatingAccount === account.id;

                  return (
                    <div
                      key={account.id}
                      onClick={() => handleSelectAccount(account)}
                      className="group flex items-center justify-between rounded-lg px-3 py-2 text-xs hover:bg-accent cursor-pointer transition-colors"
                    >
                      <div className="flex items-center gap-2.5 overflow-hidden">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-xs">
                          {isAuthenticating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : initial}
                        </div>
                        <div className="overflow-hidden text-left">
                          <div className="flex items-center gap-1.5 font-semibold text-foreground">
                            <span>{account.name || 'User'}</span>
                            <span className="rounded bg-muted px-1.5 py-0.2 text-[10px] font-mono text-muted-foreground">
                              {account.maskedUsername}
                            </span>
                          </div>
                          <div className="text-[11px] text-muted-foreground truncate max-w-[210px]">
                            {account.email}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={(e) => handleRemoveAccount(e, account.id)}
                          className="opacity-0 group-hover:opacity-100 rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all"
                          title="Remove from saved accounts"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Option for 'Other User' */}
              <div className="border-t border-border/60 mt-1 pt-1">
                <button
                  type="button"
                  onClick={handleSelectOtherUser}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-primary hover:bg-primary/10 transition-colors"
                >
                  <UserPlus className="h-3.5 w-3.5" />
                  <span>Other User (Log in with different credentials)</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Password */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium leading-none" htmlFor="password">
              Password
            </label>
            <Link
              href="/forgot-password"
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="flex h-10 w-full rounded-md border border-input bg-background pl-9 pr-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
        </div>

        {/* Remember Me Checkbox */}
        <div className="flex items-center justify-between pt-1">
          <label className="flex items-center gap-2 text-xs font-medium text-muted-foreground cursor-pointer select-none">
            <input
              type="checkbox"
              id="rememberMe"
              name="rememberMe"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="h-4 w-4 rounded border-input text-primary focus:ring-primary cursor-pointer"
            />
            <span>Remember me on this browser (30 days)</span>
          </label>
          <span className="flex items-center gap-1 text-[11px] text-emerald-500 font-medium">
            <ShieldCheck className="h-3 w-3" />
            <span>3-Token Secure</span>
          </span>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Authenticating...</span>
            </>
          ) : (
            <>
              <span>Sign In</span>
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>
      </form>

      <div className="text-center text-xs text-muted-foreground">
        Don&apos;t have an account?{' '}
        <Link href="/register" className="font-semibold text-primary underline underline-offset-4">
          Create an account
        </Link>
      </div>
    </div>
  );
}
