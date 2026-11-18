# Part A — Preliminary product recommendations for Coy

**Evidence boundary:** These are product recommendations based on Coy's publicly available product description and Terms. The private in-app walkthrough requested in Part A (OTP sign-up, adding a crush, email verification, invite link, and extra-slots screen) has **not been personally completed or verified in this repository**. No account access or payment was used, and no claim of having tested those screens is made. The applicant should complete that walkthrough and adjust these notes against the actual in-app experience before representing Part A as personally researched.

## Product context

Coy describes itself as a double-blind crush-matching product: an added person does not learn who added them unless they independently add that person too. Its public materials also emphasise that adding is final, that the product avoids revealing counts that could expose the sender, and that it does not offer profiles, photos, swiping, or chat. The public site describes three free crush slots, one-time extra slots, and a referral reward. See [Coy's public website](https://getcoy.com/).

The Terms prohibit using the product to harass, prank, embarrass, or pressure someone, prohibit adding someone using contact details obtained without their knowledge, and describe account deletion and one-click stop links in reminder messages. See [Coy's Terms of Use](https://app.getcoy.com/terms).

## Feature recommendation 1 — Mutual-only next-step card

**Proposal:** After a mutual match, show a short, structured “what happens next?” card. Each person independently chooses whether they are open to a next step, such as a low-pressure coffee, a phone call, or exchanging an additional contact channel. A choice remains private until the other person independently opts into the same action. Only then is the shared result revealed.

**Why it helps:** Coy's differentiator is mutuality, not an open social feed or unsolicited messaging. A structured, double-opt-in follow-through gives matched people a useful next step without introducing pre-match chat, exposing one-sided interest, or allowing a sender to probe whether someone has responded. It extends the core promise rather than weakening it.

**Privacy guardrails:** No “seen”, “pending”, or one-sided status; no reveal of who opted in first; no delivery of contact details until both sides consent; both participants can decline without a notification that identifies the other person's choice.

## Feature recommendation 2 — In-product safety and invitation controls

**Proposal:** Add a compact Safety & Privacy centre for reporting abusive invitations, blocking future attempts from a contact, controlling reminder channels, reviewing active invitations, and finding account deletion and stop-message controls. The report flow should not reveal who submitted a crush or whether a specific person liked the user.

**Why it helps:** The Terms explicitly prohibit harassment and pressure, while the public product emphasises controlled reminder frequency and stop links. Bringing safety controls into one predictable place makes those principles easier for users to understand and act on, and gives the product a path to handle misuse without compromising the double-blind model.

**Privacy guardrails:** Rate-limit invitations and reports; protect reports from the reported person; use minimal evidence retention; make stop/block actions idempotent; never expose incoming-like counts or sender identity as part of the safety flow.

## Validation still required in the actual app

- Complete phone OTP sign-up and note error/retry behaviour.
- Add a test contact and inspect duplicate, invalid, and already-registered contact handling.
- Complete email verification and inspect how the app communicates verified/unverified state.
- Open and test the invite link flow, including referral attribution and bonus-slot conditions.
- Inspect the extra-slots screen without purchasing; record the pricing and slot-balance explanation shown in the UI.
- Verify the exact notification cadence, stop-message behaviour, and account deletion flow against the live product.

These recommendations are intentionally preliminary until that walkthrough is completed.
