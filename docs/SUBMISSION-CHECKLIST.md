# Submission checklist — Coy SDE Intern Assignment

## Part B — YUGORA Discover implementation

### Reviewer journey
1. Open the protected Preview link supplied with the submission.
2. On the public YUGORA landing page, choose **Explore assignment demo**. No OTP or account creation is required for this assignment path.
3. Open **Discover** from the app navigation.
4. Like and Pass profiles using the desktop buttons or mobile drag gestures.
5. Confirm that a mutual Like produces the match celebration and that only confirmed mutual matches appear under **Matches**.
6. Continue until the round is exhausted. Choose **Start a new round** to bring back passed profiles; previous Likes and matches remain preserved.

### Requirement evidence
- [x] Standalone Next.js application with Home, Discover and Matches navigation.
- [x] Thirty fictional seeded profiles, including incoming demo Likes.
- [x] One card at a time; mobile pointer/touch gestures and desktop Like/Pass buttons.
- [x] Smooth card transitions, status feedback, keyboard support and reduced-motion handling.
- [x] Viewer decisions persist in PostgreSQL and are excluded from the feed on reload.
- [x] Empty-feed state and explicit new-round recovery. Only PASS decisions are cleared.
- [x] Match creation requires reciprocal LIKE decisions; only mutual matches are returned.
- [x] GET /feed, POST /swipe, and GET /matches implemented.
- [x] Browser and integration coverage for gestures, matching, privacy and persistence.
- [x] One-click assignment demo path; the real email OTP product path remains available separately.

## Part A — Coy product walkthrough (candidate must complete manually)

**Not yet complete. Do not claim this section is personally verified until you have performed it in Coy.**

- [ ] Phone OTP sign-up.
- [ ] Add a crush; inspect validation and duplicate/contact edge cases.
- [ ] Complete email verification.
- [ ] Open and test the invite link.
- [ ] Inspect the extra-slots screen without purchasing.
- [ ] Record the pricing/slot explanation and relevant notification, stop and deletion controls.
- [ ] Revisit docs/PART-A-PRODUCT-RECOMMENDATIONS.md and adjust the two recommendations using actual observations.

## Before sending the submission
- [ ] Open the reviewer link in a fresh/incognito browser and confirm the demo CTA works.
- [ ] Confirm the review link is still valid when sent to the recruiter.
- [ ] Include the GitHub repository, Preview URL, and a short Part B implementation summary.
- [ ] Include the Part A recommendations only with the walkthrough's evidence boundary clearly stated.
- [ ] Keep PR #8 unmerged unless the project owner separately decides to merge it.

## Important demo note
The assignment preview uses one shared demo identity as permitted by the brief. Decisions made by a reviewer are persisted and therefore visible to later visitors of that same demo identity. The demo switch is Preview-only and must not be enabled in Production.
