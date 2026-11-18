// Copyright (c) 2026 Manjeet2684. All rights reserved.
"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";
import type {
  FeedResponse,
  MatchesResponse,
  SwipeResponse,
  ApiErrorResponse,
} from "../../src/shared/contracts/discovery-api.js";
import type { PublicProfileDto, MatchDto } from "../../src/modules/discovery/application/dto/discovery-dto.js";
import type { SwipeDirection } from "../../src/modules/discovery/domain/entities/swipe-decision.js";
import { getSwipeTilt, resolveSwipeDirection } from "../../src/modules/discovery/ui/swipe-gesture.js";

type Screen = "home" | "discover" | "matches";
type LoadState = "loading" | "ready" | "error";
type DragPosition = { x: number; y: number };

async function apiRequest<T>(url: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers);
  const response = await fetch(url, {
    ...init,
    cache: "no-store",
    headers,
  });
  const payload: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const errorPayload = payload as ApiErrorResponse | null;
    const message = errorPayload?.error?.message ?? "Something went wrong. Please try again.";
    throw new Error(message);
  }
  return payload as T;
}

function Icon({ name, size = 20 }: { name: "home" | "compass" | "users" | "heart" | "x" | "map" | "spark" | "arrow" | "refresh" | "close" | "check" | "calendar" | "loader"; size?: number }) {
  const common = { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true as const };
  const paths: Record<string, ReactNode> = {
    home: <><path d="m3 10 9-7 9 7"/><path d="M5 9v11h14V9M9 20v-6h6v6"/></>,
    compass: <><circle cx="12" cy="12" r="9"/><path d="m15.8 8.2-2.5 5.1-5.1 2.5 2.5-5.1 5.1-2.5Z"/></>,
    users: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></>,
    heart: <path d="M20.8 8.8c0 5.2-8.8 10-8.8 10S3.2 14 3.2 8.8A4.8 4.8 0 0 1 12 6.4a4.8 4.8 0 0 1 8.8 2.4Z"/>,
    x: <><path d="m6 6 12 12M18 6 6 18"/></>,
    map: <><path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/></>,
    spark: <><path d="m12 3 1.7 5.3L19 10l-5.3 1.7L12 17l-1.7-5.3L5 10l5.3-1.7L12 3Z"/><path d="m19 15 .8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8L19 15Z"/></>,
    arrow: <><path d="M5 12h14M13 6l6 6-6 6"/></>,
    refresh: <><path d="M20 7v5h-5M4 17v-5h5"/><path d="M5.6 9A7 7 0 0 1 18 6l2 6M4 12l2 6a7 7 0 0 0 12.4-3"/></>,
    close: <><path d="m6 6 12 12M18 6 6 18"/></>,
    check: <path d="m5 12 4 4L19 6"/>,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/></>,
    loader: <><path d="M21 12a9 9 0 1 1-6.2-8.56"/></>,
  };
  return <svg {...common}>{paths[name]}</svg>;
}

function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`brand-lockup${compact ? " brand-lockup-compact" : ""}`}>
      <span className="brand-symbol">Y</span>
      <span className="brand-word">YUGORA<span>.</span></span>
    </div>
  );
}

function ProfileImage({ profile, className = "" }: { profile: Pick<PublicProfileDto, "name" | "photoUrl">; className?: string }) {
  const [failed, setFailed] = useState(false);
  const initial = profile.name.trim().charAt(0).toUpperCase() || "Y";
  return (
    <div className={`profile-image ${className}`}>
      <div className="profile-image-fallback" aria-hidden="true">{initial}</div>
      {!failed && (
        // Profile photos are fictional local placeholders. The initials fallback remains available if an asset fails.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={profile.photoUrl} alt={`${profile.name}'s profile`} loading="lazy" referrerPolicy="no-referrer" onError={() => setFailed(true)} />
      )}
    </div>
  );
}

function Navigation({ screen, onNavigate, matchCount }: { screen: Screen; onNavigate: (screen: Screen) => void; matchCount: number }) {
  const items: { id: Screen; label: string; icon: "home" | "compass" | "users" }[] = [
    { id: "home", label: "Home", icon: "home" },
    { id: "discover", label: "Discover", icon: "compass" },
    { id: "matches", label: "Matches", icon: "users" },
  ];
  return (
    <>
      <aside className="sidebar">
        <Brand />
        <div className="sidebar-caption">YOUR NEXT CHAPTER</div>
        <nav className="side-navigation" aria-label="Main navigation">
          {items.map((item) => (
            <button className={`nav-item${screen === item.id ? " nav-item-active" : ""}`} key={item.id} onClick={() => onNavigate(item.id)} aria-current={screen === item.id ? "page" : undefined}>
              <Icon name={item.icon} size={19} />
              <span>{item.label}</span>
              {item.id === "matches" && matchCount > 0 && <span className="nav-count">{matchCount}</span>}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="privacy-card">
            <span className="privacy-icon"><Icon name="heart" size={17}/></span>
            <strong>Mutual by nature.</strong>
            <p>Your interest stays yours until it is returned.</p>
          </div>
          <div className="sidebar-footnote">A LITTLE MORE HUMAN.<br/>A LITTLE LESS NOISE.</div>
        </div>
      </aside>
      <nav className="mobile-navigation" aria-label="Main navigation">
        {items.map((item) => (
          <button key={item.id} onClick={() => onNavigate(item.id)} className={`mobile-nav-item${screen === item.id ? " mobile-nav-active" : ""}`} aria-current={screen === item.id ? "page" : undefined}>
            <Icon name={item.icon} size={20}/><span>{item.label}</span>
            {item.id === "matches" && matchCount > 0 && <i>{matchCount}</i>}
          </button>
        ))}
      </nav>
    </>
  );
}

function LoadingCard() {
  return (
    <div className="loading-card" aria-label="Loading profiles" role="status">
      <div className="skeleton skeleton-photo" />
      <div className="skeleton-lines"><span/><span/><span/></div>
    </div>
  );
}

function EmptyFeed({ onRefresh }: { onRefresh: () => void }) {
  return (
    <div className="empty-state">
      <div className="empty-art"><span className="empty-orbit empty-orbit-one"/><span className="empty-orbit empty-orbit-two"/><span className="empty-heart"><Icon name="heart" size={34}/></span></div>
      <span className="eyebrow">YOU ARE ALL CAUGHT UP</span>
      <h2>That&apos;s everyone<br/>for now.</h2>
      <p>You have seen every available profile. Good connections take their time.</p>
      <button className="secondary-button" onClick={onRefresh}><Icon name="refresh" size={16}/> Check again</button>
    </div>
  );
}

function ProfileCard({
  profile,
  drag,
  exitDirection,
  busy,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onPointerCancel,
}: {
  profile: PublicProfileDto;
  drag: DragPosition;
  exitDirection: SwipeDirection | null;
  busy: boolean;
  onPointerDown: (event: ReactPointerEvent<HTMLElement>) => void;
  onPointerMove: (event: ReactPointerEvent<HTMLElement>) => void;
  onPointerUp: (event: ReactPointerEvent<HTMLElement>) => void;
  onPointerCancel: (event: ReactPointerEvent<HTMLElement>) => void;
}) {
  const tilt = getSwipeTilt(drag.x);
  const style = {
    transform: exitDirection
      ? `translate3d(${exitDirection === "LIKE" ? "130%" : "-130%"}, -5%, 0) rotate(${exitDirection === "LIKE" ? 18 : -18}deg)`
      : `translate3d(${drag.x}px, ${drag.y * 0.18}px, 0) rotate(${tilt}deg)`,
    transition: exitDirection ? "transform 260ms cubic-bezier(.2,.8,.2,1), opacity 260ms ease" : drag.x === 0 && drag.y === 0 ? "transform 220ms ease" : "none",
    opacity: exitDirection ? 0 : 1,
  };
  const likeOpacity = Math.min(1, Math.max(0, drag.x / 100));
  const passOpacity = Math.min(1, Math.max(0, -drag.x / 100));
  return (
    <article
      className={`profile-card${busy ? " profile-card-busy" : ""}`}
      style={style}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
      aria-label={`${profile.name}, ${profile.age}. Swipe right to like or left to pass.`}
    >
      <ProfileImage profile={profile} className="profile-card-photo" />
      <div className="photo-scrim" />
      <div className="card-topline">
        <span className="photo-index"><span/> A FACE, A STORY</span>
        <span className="photo-number">01 <i>/</i> 01</span>
      </div>
      <div className="swipe-stamp swipe-stamp-like" style={{ opacity: likeOpacity }}>LIKE</div>
      <div className="swipe-stamp swipe-stamp-pass" style={{ opacity: passOpacity }}>PASS</div>
      <div className="profile-card-content">
        <div className="profile-location"><Icon name="map" size={14}/>{profile.locationLabel}</div>
        <h2>{profile.name}<span>, {profile.age}</span></h2>
        <p className="profile-bio">{profile.bio}</p>
        <div className="interest-list" aria-label="Interests">
          {profile.interests.slice(0, 4).map((interest) => <span key={interest}>{interest}</span>)}
        </div>
      </div>
      {busy && <div className="card-pending"><span className="spinner"/> SAVING YOUR DECISION</div>}
    </article>
  );
}

function MatchCelebration({ match, onClose, onViewMatches }: { match: MatchDto; onClose: () => void; onViewMatches: () => void }) {
  const dialogRef = useRef<HTMLElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    const previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== "Tab") return;
      const focusable = Array.from(
        dialogRef.current?.querySelectorAll<HTMLElement>(
          'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ) ?? [],
      );
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (!first || !last) return;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    closeButtonRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      if (previouslyFocused?.isConnected) previouslyFocused.focus();
    };
  }, [onClose]);

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section ref={dialogRef} className="match-modal" role="dialog" aria-modal="true" aria-labelledby="match-title">
        <button ref={closeButtonRef} className="modal-close" aria-label="Close match celebration" onClick={onClose}><Icon name="close" size={19}/></button>
        <div className="match-confetti" aria-hidden="true"><span/><span/><span/><span/><span/></div>
        <span className="eyebrow">WELL, THIS IS SOMETHING</span>
        <div className="match-photo-wrap"><ProfileImage profile={match.profile} className="match-photo"/><span className="match-heart"><Icon name="heart" size={21}/></span></div>
        <h2 id="match-title">It&apos;s a match<span>.</span></h2>
        <p>You and {match.profile.name.split(" ")[0]} chose each other. A good thing, from both sides.</p>
        <div className="match-modal-actions">
          <button className="primary-button" onClick={onViewMatches}>See your matches <Icon name="arrow" size={16}/></button>
          <button className="text-button" onClick={onClose}>Keep discovering</button>
        </div>
      </section>
    </div>
  );
}

function MatchesView({ matches, status, error, onRetry }: { matches: readonly MatchDto[]; status: LoadState; error: string | null; onRetry: () => void }) {
  return (
    <section className="matches-view" aria-labelledby="matches-heading">
      <div className="section-heading matches-heading">
        <div><span className="eyebrow">THE FEELING IS MUTUAL</span><h1 id="matches-heading">Your matches<span>.</span></h1><p>Every connection here started with two yeses.</p></div>
        <span className="matches-count">{matches.length.toString().padStart(2, "0")} <i>CONNECTIONS</i></span>
      </div>
      {status === "loading" && <div className="matches-loading" role="status"><span className="spinner spinner-dark"/> Finding your connections…</div>}
      {status === "error" && <div className="inline-error"><strong>We couldn&apos;t load your matches.</strong><span>{error}</span><button className="secondary-button" onClick={onRetry}>Try again</button></div>}
      {status === "ready" && matches.length === 0 && (
        <div className="matches-empty"><div className="matches-empty-icon"><Icon name="heart" size={27}/></div><span className="eyebrow">NOT YET, BUT MAYBE SOON</span><h2>Your story is still unfolding.</h2><p>When someone you like chooses you too, you&apos;ll find that connection here.</p><span className="matches-private-note"><Icon name="check" size={15}/> Only mutual connections appear here.</span></div>
      )}
      {status === "ready" && matches.length > 0 && (
        <div className="matches-grid">
          {matches.map((match) => (
            <article className="match-card" key={match.id}>
              <ProfileImage profile={match.profile} className="match-card-photo"/>
              <div className="match-card-body"><span className="match-card-kicker"><Icon name="heart" size={12}/> MUTUAL CONNECTION</span><h2>{match.profile.name}, {match.profile.age}</h2><span className="match-card-location"><Icon name="map" size={13}/>{match.profile.locationLabel}</span><p>{match.profile.bio}</p><div className="interest-list interest-list-light">{match.profile.interests.slice(0,3).map((interest)=><span key={interest}>{interest}</span>)}</div><div className="match-date"><Icon name="calendar" size={13}/> Connected {new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(new Date(match.matchedAt))}</div></div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

export default function YugoraApp() {
  const [screen, setScreen] = useState<Screen>("discover");
  const [profiles, setProfiles] = useState<readonly PublicProfileDto[]>([]);
  const [feedStatus, setFeedStatus] = useState<LoadState>("loading");
  const [feedError, setFeedError] = useState<string | null>(null);
  const [matches, setMatches] = useState<readonly MatchDto[]>([]);
  const [matchesStatus, setMatchesStatus] = useState<LoadState>("loading");
  const [matchesError, setMatchesError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [drag, setDrag] = useState<DragPosition>({ x: 0, y: 0 });
  const [exitDirection, setExitDirection] = useState<SwipeDirection | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState("");
  const [celebration, setCelebration] = useState<MatchDto | null>(null);
  const dragOrigin = useRef<{ x: number; y: number; pointerId: number } | null>(null);

  const currentProfile = profiles[0] ?? null;
  const remainingCount = profiles.length;

  const loadFeed = useCallback(async () => {
    setFeedStatus("loading"); setFeedError(null);
    try {
      const data = await apiRequest<FeedResponse>("/feed");
      setProfiles(data.profiles);
      setFeedStatus("ready");
    } catch (error) {
      setFeedError(error instanceof Error ? error.message : "We couldn't load profiles.");
      setFeedStatus("error");
    }
  }, []);

  const loadMatches = useCallback(async () => {
    setMatchesStatus("loading"); setMatchesError(null);
    try {
      const data = await apiRequest<MatchesResponse>("/matches");
      setMatches(data.matches);
      setMatchesStatus("ready");
    } catch (error) {
      setMatchesError(error instanceof Error ? error.message : "We couldn't load your matches.");
      setMatchesStatus("error");
    }
  }, []);

  useEffect(() => { void loadFeed(); }, [loadFeed]);
  useEffect(() => { if (screen === "matches") void loadMatches(); }, [screen, loadMatches]);

  const submitSwipe = useCallback(async (direction: SwipeDirection) => {
    const profile = profiles[0];
    if (!profile || busy) return;
    setBusy(true); setNotice(null); setStatusMessage("Saving your decision.");
    try {
      const result = await apiRequest<SwipeResponse>("/swipe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profileId: profile.id, direction }),
      });
      // Only animate away after the server has committed the decision.
      setExitDirection(direction);
      await new Promise<void>((resolve) => window.setTimeout(resolve, 270));
      setProfiles((current) => current.filter((item) => item.id !== profile.id));
      setDrag({ x: 0, y: 0 });
      setExitDirection(null);
      setStatusMessage(result.matched ? `You and ${profile.name} matched.` : direction === "LIKE" ? `You liked ${profile.name}.` : `You passed on ${profile.name}.`);
      if (result.matched && result.match) {
        setCelebration(result.match);
        setMatches((current) => current.some((item) => item.id === result.match?.id) ? current : [result.match!, ...current]);
      }
    } catch (error) {
      setDrag({ x: 0, y: 0 }); setExitDirection(null); setStatusMessage("");
      setNotice(error instanceof Error ? error.message : "Your decision could not be saved. Please try again.");
    } finally {
      setBusy(false);
    }
  }, [profiles, busy]);

  const handlePointerDown = (event: ReactPointerEvent<HTMLElement>) => {
    if (busy || event.button !== 0) return;
    dragOrigin.current = { x: event.clientX, y: event.clientY, pointerId: event.pointerId };
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const handlePointerMove = (event: ReactPointerEvent<HTMLElement>) => {
    const origin = dragOrigin.current;
    if (!origin || origin.pointerId !== event.pointerId || busy) return;
    setDrag({ x: event.clientX - origin.x, y: event.clientY - origin.y });
  };
  const handlePointerUp = (event: ReactPointerEvent<HTMLElement>) => {
    const origin = dragOrigin.current;
    if (!origin || origin.pointerId !== event.pointerId) return;
    const deltaX = event.clientX - origin.x;
    const deltaY = event.clientY - origin.y;
    dragOrigin.current = null;
    const direction = resolveSwipeDirection(deltaX, deltaY);
    if (direction) void submitSwipe(direction); else setDrag({ x: 0, y: 0 });
  };
  const handlePointerCancel = () => { dragOrigin.current = null; setDrag({ x: 0, y: 0 }); };

  useEffect(() => {
    if (screen !== "discover" || !currentProfile || celebration) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) return;
      const target = event.target as HTMLElement | null;
      if (target && ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)) return;
      if (event.key === "ArrowRight") { event.preventDefault(); void submitSwipe("LIKE"); }
      if (event.key === "ArrowLeft") { event.preventDefault(); void submitSwipe("PASS"); }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [screen, currentProfile, celebration, submitSwipe]);

  const activeScreenTitle = useMemo(() => screen === "discover" ? "Discover" : screen === "matches" ? "Matches" : "Home", [screen]);

  return (
    <main className="app-frame">
      <Navigation screen={screen} onNavigate={setScreen} matchCount={matches.length}/>
      <div className="app-main">
        <header className="mobile-topbar"><Brand compact/><span className="topbar-caption">A CONNECTION, ONLY WHEN IT&apos;S MUTUAL</span></header>
        {screen === "home" ? (
          <section className="home-blank" aria-label="Home tab placeholder" />
        ) : screen === "discover" ? (
          <section className="discover-screen" aria-labelledby="discover-heading">
            <div className="section-heading discover-heading">
              <div><span className="eyebrow">A LITTLE CURIOUS LOOKS GOOD ON YOU</span><h1 id="discover-heading">Discover<span>.</span></h1><p>Meet someone new. Keep the good things mutual.</p></div>
              <div className="discover-progress"><span className="progress-label">YOUR DISCOVERY LIST</span><strong>{remainingCount.toString().padStart(2, "0")} <i>LEFT</i></strong><div className="progress-track"><span style={{ width: `${Math.min(100, remainingCount / 30 * 100)}%` }}/></div></div>
            </div>
            <div className="discover-layout">
              <div className="deck-column">
                {feedStatus === "loading" && <LoadingCard/>}
                {feedStatus === "error" && <div className="inline-error feed-error"><span className="eyebrow">A SMALL PAUSE</span><h2>We couldn&apos;t find your people.</h2><p>{feedError}</p><button className="primary-button" onClick={() => void loadFeed()}><Icon name="refresh" size={16}/> Try again</button></div>}
                {feedStatus === "ready" && currentProfile && (
                  <>
                    <div className="card-stack-back card-stack-back-two"/><div className="card-stack-back card-stack-back-one"/>
                    <ProfileCard profile={currentProfile} drag={drag} exitDirection={exitDirection} busy={busy} onPointerDown={handlePointerDown} onPointerMove={handlePointerMove} onPointerUp={handlePointerUp} onPointerCancel={handlePointerCancel}/>
                    <div className="swipe-actions" aria-label="Profile actions">
                      <button className="action-button action-pass" onClick={() => void submitSwipe("PASS")} disabled={busy} aria-label="Pass on this profile"><Icon name="x" size={25}/></button>
                      <span className="action-hint">NOT A MATCH? <b>THAT&apos;S OKAY.</b></span>
                      <button className="action-button action-like" onClick={() => void submitSwipe("LIKE")} disabled={busy} aria-label="Like this profile"><Icon name="heart" size={24}/></button>
                    </div>
                    <div className="keyboard-hint">USE <kbd>←</kbd> TO PASS <span>·</span> <kbd>→</kbd> TO LIKE</div>
                  </>
                )}
                {feedStatus === "ready" && !currentProfile && <EmptyFeed onRefresh={() => void loadFeed()}/>}
                {notice && <div className="toast-error" role="alert"><span>{notice}</span><button onClick={() => setNotice(null)} aria-label="Dismiss message"><Icon name="close" size={15}/></button></div>}
              </div>
              <aside className="discover-aside">
                <div className="aside-note"><span className="aside-ornament"><Icon name="spark" size={19}/></span><span className="eyebrow">THE YUGORA PROMISE</span><h3>Good things<br/>go both ways.</h3><p>Your likes are private. No hints, no lists, no pressure. Only a mutual yes becomes a connection.</p><div className="aside-divider"/><div className="aside-note-bottom"><span className="aside-dot"/> PRIVATE BY DESIGN</div></div>
                <div className="aside-quote"><span>“</span><p>Let curiosity lead.<br/>Let mutuality decide.</p><small>THE YUGORA WAY</small></div>
              </aside>
            </div>
          </section>
        ) : (
          <MatchesView matches={matches} status={matchesStatus} error={matchesError} onRetry={() => void loadMatches()}/>
        )}
        {screen !== "home" && <footer className="content-footer"><span>YUGORA <i>·</i> TWO SIDES. ONE GENUINE CONNECTION.</span><span>MADE FOR MUTUALITY <b>♡</b></span></footer>}
      </div>
      {celebration && <MatchCelebration match={celebration} onClose={() => setCelebration(null)} onViewMatches={() => { setCelebration(null); setScreen("matches"); }}/>} 
      <div className="screen-reader-status" aria-live="polite" aria-atomic="true">{busy ? "Saving your swipe" : statusMessage || notice || ""}</div>
      <span className="sr-only">Current view: {activeScreenTitle}</span>
    </main>
  );
}
