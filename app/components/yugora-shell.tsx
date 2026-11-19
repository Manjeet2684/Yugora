// Copyright (c) 2026 Manjeet2684. All rights reserved.
"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import YugoraApp, { type ViewerProfile } from "./yugora-app.js";

type SessionUser = { id: string; email: string; name?: string };
type Mode = "checking" | "landing" | "sign-in" | "verify" | "profile" | "app";

const SUGGESTED_HOBBIES = [
  "Swimming", "Reading", "Tennis", "Hockey", "Music", "Singing",
  "Photography", "Cooking", "Travel", "Gaming", "Yoga", "Football",
  "Cycling", "Painting", "Movies", "Coffee", "Dancing", "Hiking",
];

async function requestJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    credentials: "same-origin",
    cache: "no-store",
    headers: { ...(init?.headers ?? {}), ...(init?.body ? { "Content-Type": "application/json" } : {}) },
  });
  const payload = await response.json().catch(() => ({})) as Record<string, unknown>;
  if (!response.ok) {
    const nested = payload.error && typeof payload.error === "object"
      ? (payload.error as Record<string, unknown>).message
      : null;
    throw new Error(typeof payload.message === "string" ? payload.message
      : typeof nested === "string" ? nested
      : "Something went wrong. Please try again.");
  }
  return payload as T;
}

function Brand() {
  return <div className="brand-lockup"><span className="brand-symbol">Y</span><span className="brand-word">YUGORA<span>.</span></span></div>;
}

function SiteFooter() {
  return <footer className="site-footer"><Brand/><span>TWO SIDES. ONE GENUINE CONNECTION.</span><small>© YUGORA · MADE FOR MUTUALITY</small></footer>;
}

function ProfileEditor({
  profile, email, firstSetup, onCancel, onSaved,
}: {
  profile: ViewerProfile | null;
  email: string;
  firstSetup: boolean;
  onCancel: () => void;
  onSaved: (profile: ViewerProfile) => void;
}) {
  const [name, setName] = useState(profile?.name ?? "");
  const [age, setAge] = useState(String(profile?.age ?? 25));
  const [locationLabel, setLocationLabel] = useState(profile?.locationLabel ?? "");
  const [bio, setBio] = useState(profile?.bio ?? "");
  const [interests, setInterests] = useState<string[]>([...(profile?.interests ?? [])]);
  const [customInterest, setCustomInterest] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const available = useMemo(
    () => SUGGESTED_HOBBIES.filter((item) => !interests.some((current) => current.toLocaleLowerCase("en-US") === item.toLocaleLowerCase("en-US"))),
    [interests],
  );

  const toggleInterest = (value: string) => {
    setInterests((current) => current.some((item) => item.toLocaleLowerCase("en-US") === value.toLocaleLowerCase("en-US"))
      ? current.filter((item) => item.toLocaleLowerCase("en-US") !== value.toLocaleLowerCase("en-US"))
      : current.length < 10 ? [...current, value] : current);
  };

  const addCustomInterest = () => {
    const value = customInterest.trim().replace(/\s+/gu, " ");
    if (!value || value.length > 32) return;
    if (!interests.some((item) => item.toLocaleLowerCase("en-US") === value.toLocaleLowerCase("en-US"))) {
      setInterests((current) => current.length < 10 ? [...current, value] : current);
    }
    setCustomInterest("");
  };

  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true); setError(null);
    try {
      const result = await requestJson<{ profile: ViewerProfile }>("/api/profile", {
        method: "PUT",
        body: JSON.stringify({ name, age: Number(age), locationLabel, bio, interests }),
      });
      onSaved(result.profile);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Your profile could not be saved.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="profile-setup-page">
      <header className="shell-topbar"><Brand/><span>{firstSetup ? "YOUR STORY STARTS HERE" : "YOUR PROFILE"}</span></header>
      <section className="profile-setup-card">
        <span className="eyebrow">{firstSetup ? "A FEW DETAILS, THEN YOU'RE IN" : "MAKE IT YOURS"}</span>
        <h1>{firstSetup ? "Let's introduce you." : "Your profile."}</h1>
        <p className="profile-setup-intro">Share a little about yourself. You can update these details and hobbies whenever you like.</p>
        <form onSubmit={save} className="profile-form">
          <label>Your name<input required maxLength={70} autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} placeholder="What should people call you?"/></label>
          <div className="profile-form-row">
            <label>Age<input required type="number" min={18} max={100} value={age} onChange={(event) => setAge(event.target.value)}/></label>
            <label>City / location<input required maxLength={80} autoComplete="address-level2" value={locationLabel} onChange={(event) => setLocationLabel(event.target.value)} placeholder="e.g. New Delhi"/></label>
          </div>
          <label>A little about you <span className="field-hint">Optional · 420 characters</span><textarea maxLength={420} rows={4} value={bio} onChange={(event) => setBio(event.target.value)} placeholder="A small introduction, a favourite weekend ritual, or what makes you smile…"/></label>
          <fieldset className="hobby-fieldset">
            <legend>Your hobbies and interests <span className="field-hint">Choose up to 10</span></legend>
            <div className="selected-hobbies" aria-live="polite">
              {interests.map((item) => <button type="button" key={item} className="hobby-chip hobby-chip-selected" onClick={() => toggleInterest(item)} aria-label={`Remove ${item}`}>{item}<span>×</span></button>)}
              {interests.length === 0 && <span className="hobby-empty">Pick a few things you enjoy.</span>}
            </div>
            <div className="hobby-suggestions">
              {available.map((item) => <button type="button" key={item} className="hobby-chip" onClick={() => toggleInterest(item)} disabled={interests.length >= 10}>{item}<span>+</span></button>)}
            </div>
            <div className="custom-hobby-row">
              <input value={customInterest} maxLength={32} onChange={(event) => setCustomInterest(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); addCustomInterest(); } }} placeholder="Or write your own hobby…"/>
              <button type="button" className="secondary-button" onClick={addCustomInterest} disabled={!customInterest.trim() || interests.length >= 10}>Add hobby</button>
            </div>
          </fieldset>
          <div className="profile-email-note"><span>EMAIL</span><strong>{email}</strong><small>Your sign-in email is private and is not displayed on your discovery card.</small></div>
          {error && <p className="form-error" role="alert">{error}</p>}
          <div className="profile-form-actions">
            {!firstSetup && <button type="button" className="text-button" onClick={onCancel}>Cancel</button>}
            <button type="submit" className="primary-button" disabled={saving || interests.length === 0}>{saving ? "Saving profile…" : firstSetup ? "Save and continue" : "Save changes"}</button>
          </div>
        </form>
      </section>
      <SiteFooter/>
    </main>
  );
}

export default function YugoraShell() {
  const [mode, setMode] = useState<Mode>("checking");
  const [user, setUser] = useState<SessionUser | null>(null);
  const [profile, setProfile] = useState<ViewerProfile | null>(null);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [authBusy, setAuthBusy] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const loadAccount = useCallback(async (nextUser: SessionUser) => {
    setUser(nextUser);
    const result = await requestJson<{ profile: ViewerProfile | null }>("/api/profile");
    if (result.profile) {
      setProfile(result.profile);
      setMode("app");
    } else {
      setProfile(null);
      setMode("profile");
    }
  }, []);

  useEffect(() => {
    let active = true;
    void requestJson<{ user?: SessionUser | null }>("/api/auth/get-session")
      .then(async (result) => {
        if (!active) return;
        if (result.user?.id) await loadAccount(result.user);
        else if (active) setMode("landing");
      })
      .catch(() => { if (active) setMode("landing"); });
    return () => { active = false; };
  }, [loadAccount]);

  const sendCode = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAuthBusy(true); setAuthError(null);
    try {
      await requestJson("/api/auth/email-otp/send-verification-otp", {
        method: "POST",
        body: JSON.stringify({ email: email.trim().toLowerCase(), type: "sign-in" }),
      });
      setMode("verify");
      setNotice("A one-time sign-in code has been sent to " + email.trim() + ".");
    } catch (cause) {
      setAuthError(cause instanceof Error ? cause.message : "We couldn't send the sign-in code.");
    } finally { setAuthBusy(false); }
  };

  const verifyCode = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAuthBusy(true); setAuthError(null);
    try {
      const result = await requestJson<{ user?: SessionUser }>("/api/auth/sign-in/email-otp", {
        method: "POST",
        body: JSON.stringify({ email: email.trim().toLowerCase(), otp: otp.trim() }),
      });
      const session = result.user?.id
        ? result
        : await requestJson<{ user?: SessionUser }>("/api/auth/get-session");
      if (!session.user?.id) throw new Error("The code was accepted, but no signed-in session was returned. Please try again.");
      setNotice(null);
      await loadAccount(session.user);
    } catch (cause) {
      setAuthError(cause instanceof Error ? cause.message : "That code could not be verified.");
    } finally { setAuthBusy(false); }
  };

  const enterDemo = async () => {
    setAuthBusy(true);
    setAuthError(null);
    setNotice(null);
    try {
      await loadAccount({ id: "demo-user", email: "demo@yugora.test", name: "YUGORA Guest" });
    } catch (cause) {
      setUser(null);
      setProfile(null);
      setMode("landing");
      setAuthError(cause instanceof Error ? cause.message : "The assignment demo is unavailable right now.");
    } finally {
      setAuthBusy(false);
    }
  };

  const signOut = async () => {
    try { await requestJson("/api/auth/sign-out", { method: "POST", body: "{}" }); } catch { /* Expired sessions can still leave the local screen. */ }
    setUser(null); setProfile(null); setEmail(""); setOtp(""); setAuthError(null); setNotice(null); setMode("landing");
  };

  const enterApp = (saved: ViewerProfile) => {
    setProfile(saved);
    setMode("app");
  };

  if (mode === "checking") {
    return <main className="shell-loading"><Brand/><span>Making room for a genuine connection…</span></main>;
  }

  if (mode === "profile") {
    return <ProfileEditor profile={profile} email={user?.email ?? email} firstSetup={!profile} onCancel={() => setMode("app")} onSaved={enterApp}/>;
  }

  if (mode === "app" && user && profile) {
    return <YugoraApp profile={profile} onEditProfile={() => setMode("profile")} onSignOut={() => void signOut()}/>;
  }

  return (
    <main className="yugora-landing">
      <header className="landing-nav">
        <Brand/>
        <nav><a href="#vision">Our vision</a><a href="#how-it-works">How it works</a><button className="landing-nav-cta" onClick={() => { setAuthError(null); setNotice(null); setMode("sign-in"); }}>Sign in <span>↗</span></button></nav>
      </header>
      <section className="landing-hero">
        <div className="landing-hero-copy">
          <span className="eyebrow">A LITTLE MORE HUMAN. A LITTLE LESS NOISE.</span>
          <h1>A connection,<br/>only when it&apos;s <em>mutual.</em></h1>
          <p>Meet people with room to be themselves. Share what matters to you. And discover a connection only when the feeling goes both ways.</p>
          <div className="landing-hero-actions">
            <button className="primary-button" onClick={() => { setAuthError(null); setNotice(null); setMode("sign-in"); }}>Get started <span>↗</span></button>
            <button className="secondary-button demo-entry-button" onClick={() => void enterDemo()} disabled={authBusy}>{authBusy ? "Opening demo…" : "Explore assignment demo"}</button>
            <a href="#vision" className="landing-secondary-link">Discover the YUGORA way</a>
          </div>
          <p className="demo-entry-note">Review the 30-profile Discover experience without creating an account.</p>
          <div className="landing-proof"><span>30 CURATED PROFILES IN THIS EXPERIENCE</span><i/> <span>ONE SIMPLE RULE: TWO YESSES</span></div>
        </div>
        <div className="landing-hero-art" aria-hidden="true"><div className="hero-orbit hero-orbit-one"/><div className="hero-orbit hero-orbit-two"/><div className="hero-glow"/><span className="hero-art-caption">LET MUTUALITY DECIDE</span></div>
      </section>
      <section className="vision-section" id="vision">
        <div className="vision-heading"><span className="eyebrow">WHAT WE BELIEVE</span><h2>Better connections<br/>start with <em>respect.</em></h2><p>YUGORA is built around a simple social idea: people deserve the freedom to show interest without feeling watched, scored, or pressured.</p></div>
        <div className="vision-grid">
          <article><span>01</span><h3>Privacy without games.</h3><p>Your Likes are private. We never reveal one-sided interest or turn it into a public leaderboard.</p></article>
          <article><span>02</span><h3>Mutual, by design.</h3><p>A connection appears only after both people say yes. No shortcuts, no manufactured matches.</p></article>
          <article><span>03</span><h3>People before metrics.</h3><p>Profiles focus on interests and personality, not popularity counts or endless swiping.</p></article>
        </div>
      </section>
      <section className="how-section" id="how-it-works">
        <span className="eyebrow">A MORE THOUGHTFUL WAY TO DISCOVER</span>
        <h2>Simple by design.<br/><em>Meaningful by choice.</em></h2>
        <div className="how-steps"><div><b>01</b><strong>Make it yours</strong><p>Set up a profile with your name, a few words, and the hobbies that make you, you.</p></div><div><b>02</b><strong>Discover at your pace</strong><p>Like or pass on up to 30 curated profiles, one at a time.</p></div><div><b>03</b><strong>Meet in the middle</strong><p>Only mutual Likes become matches. Your one-sided interest stays yours.</p></div></div>
        <button className="primary-button how-cta" onClick={() => { setAuthError(null); setNotice(null); setMode("sign-in"); }}>Find your YUGORA space <span>↗</span></button>
      </section>
      <SiteFooter/>
      {mode === "sign-in" && (
        <div className="auth-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setMode("landing"); }}>
          <section className="auth-card" role="dialog" aria-modal="true" aria-labelledby="auth-heading">
            <button className="auth-close" onClick={() => setMode("landing")} aria-label="Close sign in">×</button>
            <Brand/>
            <span className="eyebrow">YOUR NEXT CHAPTER STARTS WITH YOU</span>
            <h2 id="auth-heading">Sign in with your email.</h2>
            <p>Use your Gmail, Yahoo, or another email address. We&apos;ll send a one-time code. No password to remember.</p>
            <form onSubmit={sendCode}>
              <label>Email address<input required type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@gmail.com"/></label>
              {authError && <p className="form-error" role="alert">{authError}</p>}
              {notice && <p className="form-success" role="status">{notice}</p>}
              <button className="primary-button auth-submit" disabled={authBusy || !email.trim()}>{authBusy ? "Sending code…" : "Send me a sign-in code"}</button>
            </form>
            <button className="text-button demo-modal-entry" onClick={() => void enterDemo()} disabled={authBusy}>Or explore the assignment demo without signing in</button>
            <small>Your email is used for sign-in only. Your Likes are never shown to other people unless the feeling is mutual.</small>
          </section>
        </div>
      )}
      {mode === "verify" && (
        <div className="auth-backdrop" role="presentation">
          <section className="auth-card" role="dialog" aria-modal="true" aria-labelledby="verify-heading">
            <button className="auth-close" onClick={() => { setMode("sign-in"); setOtp(""); }} aria-label="Back to email">←</button>
            <Brand/>
            <span className="eyebrow">CHECK YOUR INBOX</span>
            <h2 id="verify-heading">Enter your code.</h2>
            <p>We sent a one-time code to <strong>{email}</strong>. It expires shortly.</p>
            <form onSubmit={verifyCode}>
              <label>Six-digit code<input required inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} value={otp} onChange={(event) => setOtp(event.target.value.replace(/\D/gu, "").slice(0, 6))} placeholder="000000"/></label>
              {authError && <p className="form-error" role="alert">{authError}</p>}
              <button className="primary-button auth-submit" disabled={authBusy || otp.length !== 6}>{authBusy ? "Checking code…" : "Verify and continue"}</button>
            </form>
            <button className="text-button auth-resend" onClick={() => { setMode("sign-in"); setOtp(""); }}>Use another email or resend code</button>
          </section>
        </div>
      )}
    </main>
  );
}
