// Copyright (c) 2026 Manjeet2684. All rights reserved.
const endpoints = [
  { method: "GET", path: "/feed", description: "Discover profiles you have not decided on." },
  { method: "POST", path: "/swipe", description: "Record a private LIKE or PASS decision." },
  { method: "GET", path: "/matches", description: "Retrieve confirmed mutual connections." },
] as const;

export default function ServiceLandingPage() {
  return (
    <main className="service-shell">
      <div className="service-orb service-orb-one" aria-hidden="true" />
      <div className="service-orb service-orb-two" aria-hidden="true" />
      <section className="service-content" aria-labelledby="brand-title">
        <div className="brand-kicker"><span className="brand-mark">Y</span> A DIFFERENT KIND OF CONNECTION</div>
        <h1 id="brand-title">YUGORA<span>.</span></h1>
        <p className="brand-tagline">A connection, only when it&apos;s mutual.</p>
        <p className="service-copy">
          The discovery backend is ready. Interest stays private until both people choose each other.
        </p>

        <div className="endpoint-panel" aria-label="Available API endpoints">
          <div className="panel-heading">
            <span>BACKEND ENDPOINTS</span>
            <span className="status-pill"><span /> SERVICE READY</span>
          </div>
          {endpoints.map((endpoint) => (
            <div className="endpoint-row" key={endpoint.path}>
              <code className={`method method-${endpoint.method.toLowerCase()}`}>{endpoint.method}</code>
              <div className="endpoint-info">
                <code>{endpoint.path}</code>
                <span>{endpoint.description}</span>
              </div>
            </div>
          ))}
        </div>

        <p className="service-footnote">
          Discover experience is the next build milestone. This service uses fictional demo profiles only.
        </p>
      </section>
      <footer className="service-footer">YUGORA <span>·</span> TWO SIDES. ONE GENUINE CONNECTION.</footer>
    </main>
  );
}
