# SID — Slide Note Bar
**Master Spec & Project Memory Compendium**  
Last updated: 2025-01-27 16:45:30

---

## 1) Vision (One-liner)
> **SID** is a **side slide bar** that **opens on hover** and **closes automatically**, letting anyone **capture long notes fast**, **organize with tabs**, **search instantly**, and **control everything by voice or shortcuts**. Local-first. Ultra-light. Elegance first.

---

## 2) Non-negotiable UX constraints
- **Open on hover** (near screen edge), **no click required**.
- **Auto-close** after **1–2 s** of inactivity (configurable).
- **Widths**: closed ≈ **20 px**, open ≈ **20% of viewport** (configurable).
- **Zero friction**: paste long text, scroll, keep caret position.
- **No Electron bloat**. Target **Web / PWA** first. (NW.js optional later.)
- **Theme Atlas** + **Montserrat** font. Quiet, elegant, minimal.
- **Local-first storage** (no account needed). Optional sync later.
- **Always responsive** (desktop primary; works on small screens too).

---

## 3) Key capabilities (today → ready)
| Area | Capability | Details |
|---|---|---|
| Slide | Auto-hover open | Edge hotspot with hysteresis (X px from left). |
| Slide | Auto-close | Inactivity timer (default 1200 ms). |
| Notes | Long text editor | Soft wrap, multi-paragraph, paste large blocks. |
| Notes | Tabs | Add/rename/close/reorder tabs; per-tab notes. |
| Notes | Pin/Favorites | Pin tab or note to keep visible. |
| Storage | Local-first | IndexedDB via localForage; JSON schema below. |
| Storage | Export/Import | `.txt`, `.md`, `.sid.json` (bundle). |
| Search | Instant | Fuzzy search across titles + body. |
| Voice | Push-to-talk + wakeword | "Atlas"/"Sid" → intent router; Whisper/ASR plug. |
| Shortcuts | Global & in-editor | See §10. |
| Theme | Tokens | Color, spacing, radii, shadows (Atlas). |
| PWA | Installable | Offline cache, fast startup. |
| Privacy | Local only by default | No telemetry unless enabled. |

---

## 4) Student/Pro "Magic Tools" (Mode STUDY)
- **Quick Summarize**: highlight → `Summarize` → bullets + TL;DR.
- **Flashcard/Cloze**: generate Q/A or cloze from selection.
- **Mindmap draft**: extract headings/relations → lightweight JSON.
- **Lecture capture**: voice record → speech-to-text → clean notes.
- **Reference collector**: paste URL/PDF → auto title + source block.
- **Timed focus**: Pomodoro mini-timer per tab with progress marks.
- **Export pack**: notebook → `.md` + optional `anki.csv` + mindmap JSON.

> All tools are optional modules. Local-first with deterministic outputs.

---

## 5) Data model (TypeScript)
```ts
export type NoteID = string;
export type TabID = string;

export interface Note {
  id: NoteID;
  title: string;
  body: string;
  createdAt: number;
  updatedAt: number;
  pinned?: boolean;
  sources?: Array<{type: 'url'|'pdf'|'image', href?: string, meta?: any}>;
  tags?: string[];
  studyTags?: StudyTag[];
  reviewHistory?: Array<{ts:number; score:0|1|2|3|4|5}>;
}

export interface Tab {
  id: TabID;
  name: string;
  notes: NoteID[];       // ordering
  activeNoteId?: NoteID; // caret state
}

export interface Workspace {
  id: string;
  tabs: Tab[];
  notes: Record<NoteID, Note>;
  settings: Settings;
  history?: Array<{ ts: number; action: string; payload?: any }>;
}

export interface Settings {
  openWidthPct: number;      // default 20
  closedWidthPx: number;     // default 20
  autoCloseMs: number;       // default 1200
  theme: 'atlas' | 'dark' | 'system';
  fontFamily: 'Montserrat' | 'System';
  wakewords: string[];       // ['Atlas', 'Sid']
  language: 'fr'|'en'|'el';
  studyTools: {
    summarize: boolean;
    flashcards: boolean;
    mindmap: boolean;
    recorder: boolean;
  };
}
```

---

## 6) Architecture (Next.js + React + Tailwind)
```
/src
  /components
    SidShell.tsx               # layout + slide mechanics
    AutoHoverHotspot.tsx
    InactivityTimer.ts
    TabsBar.tsx
    NoteEditor.tsx
    SearchBox.tsx
    PinButton.tsx
    QuickActions.tsx           # summarize, cloze, timer, export
    VoiceButton.tsx
    StatusToasts.tsx
    /study                     # Study Tags module
      TagBadge.tsx
      TagToolbar.tsx
      TagSuggestionsPanel.tsx
  /lib
    storage.ts                 # localForage wrapper
    id.ts                      # nanoid
    summarize.ts               # local/LLM-agnostic pipeline
    cloze.ts
    mindmap.ts
    recorder.ts                # MediaRecorder wrapper
    export.ts                  # txt/md/json pack
    import.ts
    search.ts                  # fuzzy index
    settings.ts
    i18n.ts
    /study/tags               # Study Tags AI module
      types.ts
      constants.ts
      ai.ts
      analytics.ts
  /pages
    /sid
      index.tsx                # standalone page/app shell
  /styles
    tokens.css                 # color, radii, shadows (Atlas)
```

---

## 7) Study Tags System (Academic Intelligence)
### A. Default Tags
**Exam Priority**
- 🔴 **CRITICAL EXAM** — Must know absolutely
- 🟠 **IMPORTANT EXAM** — Very likely
- 🟡 **USEFUL EXAM** — Good to know
- 🟢 **BONUS EXAM** — Extra points

**Content Type**
- 🧮 **FORMULA** — To memorize by heart
- 📖 **DEFINITION** — Key concept
- 🔗 **LOGICAL LINK** — Important connection
- 📊 **EXAMPLE TYPE** — Practical application

**Review Timing**
- 🚨 **REVIEW TOMORROW** — Urgent
- 📅 **REVIEW WEEK** — Scheduled
- 🔄 **REVIEW REGULAR** — Spaced repetition
- ✅ **MASTERED** — Acquired

**Course Popular**
- 🔥 **Prof emphasized 3×**
- ⚠️ **Appeared last year**
- 📋 **Typical TD question**
- 🕳️ **Classic trap**

### B. AI Detection & Suggestions
- Formula detection (LaTeX patterns, mathematical symbols)
- Definition recognition (linguistic patterns)
- Professor emphasis (keyword frequency)
- Exam relevance (historical data, timing)
- Abbreviation expansion learning

### C. Daily/Monthly Quizzes
- **Daily**: 20 Q from tagged notes (weighted by 🔴🟠)
- **Monthly**: 60 min comprehensive session
- **FSRS**: Simplified spaced repetition scheduling
- **Analytics**: Per chapter, tag, difficulty recommendations

---

## CRITICAL MISSING ELEMENTS (Production Gaps)

## 26) Error Handling & Recovery Strategy
### A. Data Corruption Protection
- **Two-phase commits** for all writes
- **Schema versioning** with automatic migrations
- **Integrity validation** on startup + background checks
- **Automatic backups** before schema changes
- **Recovery modes**: safe mode, data export, factory reset

### B. Network & Sync Failures
- **Offline queue** with exponential backoff
- **Conflict resolution** for concurrent edits
- **Partial sync recovery** (resume interrupted syncs)
- **Version vectors** for distributed consistency

### C. Browser/System Crashes
- **Auto-save** every 5s + on focus loss
- **Tab recovery** with unsaved changes
- **IndexedDB corruption** detection + repair
- **Service Worker** crash handling

---

## 27) Performance Monitoring & Observability
### A. Real-time Metrics
- **Core Web Vitals**: LCP, FID, CLS tracking
- **Bundle size** monitoring + alerts
- **Memory usage** profiling (especially for long sessions)
- **Search performance** (query time distribution)
- **Slide animation** frame rates

### B. Error Tracking
- **Client-side** error capture (with user consent)
- **Performance degradation** detection
- **Feature usage** analytics (opt-in)
- **A/B testing** infrastructure for UX improvements

### C. Health Dashboards
- **System status** page
- **Performance budgets** enforcement
- **User feedback** collection and routing

---

## 28) Security & Compliance Framework
### A. Data Protection (GDPR Ready)
- **Data minimization** principles
- **Right to erasure** implementation
- **Data portability** (full export)
- **Consent management** UI
- **Privacy by design** audit checklist

### B. Security Hardening
- **CSP headers** configuration
- **XSS protection** for user content
- **Input sanitization** for voice/text
- **Secure storage** (WebCrypto for E2EE)
- **Rate limiting** for AI features

### C. Accessibility Compliance (WCAG 2.1 AA)
- **Screen reader** full compatibility
- **Keyboard navigation** complete coverage
- **Color contrast** validation
- **Motion reduction** respect
- **Focus management** in slide transitions

---

## 29) Production Infrastructure & DevOps
### A. CI/CD Pipeline
- **Automated testing** (unit, integration, e2e)
- **Bundle analysis** + performance regression detection
- **Progressive deployment** with feature flags
- **Rollback strategy** (automatic + manual triggers)
- **Environment parity** (dev/staging/prod)

### B. Deployment Strategy
- **CDN** optimization for global performance
- **Service Worker** update strategy
- **Database migrations** (zero-downtime)
- **Feature toggles** for gradual rollouts
- **Monitoring** integration

### C. Scaling Considerations
- **Horizontal scaling** for sync service
- **Database sharding** strategy (by user/workspace)
- **Cache layers** (Redis for hot data)
- **Load balancing** for voice/AI services

---

## 30) Business & Go-to-Market Critical Items
### A. Pricing Strategy (Validated)
- **Free Tier**: 3 workspaces, local-only, basic study tools
- **Student Pro** ($4/month): Unlimited, cloud sync, full AI
- **Class License** ($2/student/month): Collaboration, teacher dashboard
- **Institution** (custom): SSO, admin controls, analytics, white-label

### B. Educational Partnerships
- **LMS integrations** roadmap (priority: Canvas → Moodle → Blackboard)
- **University pilot** programs
- **Teacher training** materials
- **Student ambassador** program

### C. Support Infrastructure
- **Help documentation** (searchable, multilingual)
- **Video tutorials** for key workflows
- **Community forum** (Discord/Reddit)
- **Ticket system** integration
- **Live chat** for paid users

---

## 31) Legal & Compliance Framework
### A. Terms of Service
- **Usage rights** and limitations
- **Data retention** policies
- **Service availability** SLAs
- **Dispute resolution** procedures

### B. Educational Compliance
- **FERPA** compliance (US education data)
- **COPPA** considerations (users under 13)
- **EU Digital Services Act** requirements
- **Accessibility laws** compliance verification

### C. International Considerations
- **Data residency** requirements
- **Export controls** for AI features
- **Local privacy laws** (GDPR, CCPA, LGPD)
- **Tax implications** for global sales

---

## 32) Quality Assurance & Testing Strategy
### A. Test Coverage Requirements
- **Unit tests**: >90% coverage for core logic
- **Integration tests**: Full user workflows
- **E2E tests**: Cross-browser, cross-device
- **Performance tests**: Load, stress, endurance
- **Accessibility tests**: Automated + manual audit

### B. Browser/Device Matrix
- **Desktop**: Chrome 100+, Firefox 95+, Safari 14+, Edge 100+
- **Mobile**: iOS Safari 14+, Chrome Android 100+
- **Screen sizes**: 320px → 4K
- **Input methods**: Mouse, touch, stylus, keyboard-only

### C. Real User Monitoring
- **Beta testing** program (100+ active users)
- **Feedback loops** integration
- **Bug bounty** program
- **Performance monitoring** in production

---

## 33) Team & Resource Planning
### A. Core Team Structure
- **Technical Lead** (full-stack, DevOps)
- **Frontend Developer** (React, PWA, accessibility)
- **Backend Developer** (Node.js, databases, AI integration)
- **UX/UI Designer** (education-focused, accessibility)
- **QA Engineer** (automation, cross-platform testing)

### B. External Resources
- **Educational consultant** (pedagogy, spaced repetition)
- **Accessibility auditor** (WCAG compliance)
- **Legal counsel** (privacy, education law)
- **Marketing specialist** (education sector)

### C. Budget Allocation
- **Development** (60%): Team salaries, tools, infrastructure
- **Marketing** (25%): User acquisition, partnerships, content
- **Operations** (10%): Support, maintenance, monitoring
- **Legal/Compliance** (5%): Audits, certifications, consulting

---

## 34) Success Metrics & KPIs
### A. Product Metrics
- **Daily Active Users** (target: 10K within 6 months)
- **Session Duration** (target: avg 25 minutes)
- **Feature Adoption** (study tools usage >60%)
- **Retention** (30-day: >40%, 90-day: >25%)

### B. Business Metrics
- **Monthly Recurring Revenue** (target: $50K within 12 months)
- **Customer Acquisition Cost** (<$25 for students, <$100 for institutions)
- **Churn Rate** (<5% monthly for paid users)
- **Net Promoter Score** (target: >50)

### C. Technical Metrics
- **Page Load Time** (<1s for 95th percentile)
- **Uptime** (>99.9% excluding scheduled maintenance)
- **Bug Escape Rate** (<2% to production)
- **Security Incidents** (target: 0 data breaches)

---

## FINAL PRODUCTION CHECKLIST
- [ ] **Security audit** completed
- [ ] **Accessibility audit** (WCAG 2.1 AA) passed
- [ ] **Performance budget** enforced (<1s TTI, <300KB initial bundle)
- [ ] **Error monitoring** configured
- [ ] **Backup/recovery** procedures tested
- [ ] **Legal review** completed (ToS, Privacy Policy)
- [ ] **Support documentation** complete
- [ ] **Rollback plan** documented and tested
- [ ] **Monitoring dashboards** configured
- [ ] **Go-to-market plan** finalized

---

**"Done" Definition**: A student can slide in, write comprehensive notes with intelligent tagging, review with spaced repetition, and export everything — all while maintaining complete privacy and accessibility. The app works flawlessly across devices, scales to institutional use, and provides measurable learning outcomes.


---

## CRITICAL MISSING ELEMENTS (Production Gaps)

## 26) Error Handling & Recovery Strategy
### A. Data Corruption Protection
- **Two-phase commits** for all writes
- **Schema versioning** with automatic migrations
- **Integrity validation** on startup + background checks
- **Automatic backups** before schema changes
- **Recovery modes**: safe mode, data export, factory reset

### B. Network & Sync Failures
- **Offline queue** with exponential backoff
- **Conflict resolution** for concurrent edits
- **Partial sync recovery** (resume interrupted syncs)
- **Version vectors** for distributed consistency

### C. Browser/System Crashes
- **Auto-save** every 5s + on focus loss
- **Tab recovery** with unsaved changes
- **IndexedDB corruption** detection + repair
- **Service Worker** crash handling

---

## 27) Performance Monitoring & Observability
### A. Real-time Metrics
- **Core Web Vitals**: LCP, FID, CLS tracking
- **Bundle size** monitoring + alerts
- **Memory usage** profiling (especially for long sessions)
- **Search performance** (query time distribution)
- **Slide animation** frame rates

### B. Error Tracking
- **Client-side** error capture (with user consent)
- **Performance degradation** detection
- **Feature usage** analytics (opt-in)
- **A/B testing** infrastructure for UX improvements

### C. Health Dashboards
- **System status** page
- **Performance budgets** enforcement
- **User feedback** collection and routing

---

## 28) Security & Compliance Framework
### A. Data Protection (GDPR Ready)
- **Data minimization** principles
- **Right to erasure** implementation
- **Data portability** (full export)
- **Consent management** UI
- **Privacy by design** audit checklist

### B. Security Hardening
- **CSP headers** configuration
- **XSS protection** for user content
- **Input sanitization** for voice/text
- **Secure storage** (WebCrypto for E2EE)
- **Rate limiting** for AI features

### C. Accessibility Compliance (WCAG 2.1 AA)
- **Screen reader** full compatibility
- **Keyboard navigation** complete coverage
- **Color contrast** validation
- **Motion reduction** respect
- **Focus management** in slide transitions

---

## 29) Production Infrastructure & DevOps
### A. CI/CD Pipeline
- **Automated testing** (unit, integration, e2e)
- **Bundle analysis** + performance regression detection
- **Progressive deployment** with feature flags
- **Rollback strategy** (automatic + manual triggers)
- **Environment parity** (dev/staging/prod)

### B. Deployment Strategy
- **CDN** optimization for global performance
- **Service Worker** update strategy
- **Database migrations** (zero-downtime)
- **Feature toggles** for gradual rollouts
- **Monitoring** integration

### C. Scaling Considerations
- **Horizontal scaling** for sync service
- **Database sharding** strategy (by user/workspace)
- **Cache layers** (Redis for hot data)
- **Load balancing** for voice/AI services

---

## 30) Business & Go-to-Market Critical Items
### A. Pricing Strategy (Validated)
- **Free Tier**: 3 workspaces, local-only, basic study tools
- **Student Pro** ($4/month): Unlimited, cloud sync, full AI
- **Class License** ($2/student/month): Collaboration, teacher dashboard
- **Institution** (custom): SSO, admin controls, analytics, white-label

### B. Educational Partnerships
- **LMS integrations** roadmap (priority: Canvas → Moodle → Blackboard)
- **University pilot** programs
- **Teacher training** materials
- **Student ambassador** program

### C. Support Infrastructure
- **Help documentation** (searchable, multilingual)
- **Video tutorials** for key workflows
- **Community forum** (Discord/Reddit)
- **Ticket system** integration
- **Live chat** for paid users

---

## 31) Legal & Compliance Framework
### A. Terms of Service
- **Usage rights** and limitations
- **Data retention** policies
- **Service availability** SLAs
- **Dispute resolution** procedures

### B. Educational Compliance
- **FERPA** compliance (US education data)
- **COPPA** considerations (users under 13)
- **EU Digital Services Act** requirements
- **Accessibility laws** compliance verification

### C. International Considerations
- **Data residency** requirements
- **Export controls** for AI features
- **Local privacy laws** (GDPR, CCPA, LGPD)
- **Tax implications** for global sales

---

## 32) Quality Assurance & Testing Strategy
### A. Test Coverage Requirements
- **Unit tests**: >90% coverage for core logic
- **Integration tests**: Full user workflows
- **E2E tests**: Cross-browser, cross-device
- **Performance tests**: Load, stress, endurance
- **Accessibility tests**: Automated + manual audit

### B. Browser/Device Matrix
- **Desktop**: Chrome 100+, Firefox 95+, Safari 14+, Edge 100+
- **Mobile**: iOS Safari 14+, Chrome Android 100+
- **Screen sizes**: 320px → 4K
- **Input methods**: Mouse, touch, stylus, keyboard-only

### C. Real User Monitoring
- **Beta testing** program (100+ active users)
- **Feedback loops** integration
- **Bug bounty** program
- **Performance monitoring** in production

---

## 33) Team & Resource Planning
### A. Core Team Structure
- **Technical Lead** (full-stack, DevOps)
- **Frontend Developer** (React, PWA, accessibility)
- **Backend Developer** (Node.js, databases, AI integration)
- **UX/UI Designer** (education-focused, accessibility)
- **QA Engineer** (automation, cross-platform testing)

### B. External Resources
- **Educational consultant** (pedagogy, spaced repetition)
- **Accessibility auditor** (WCAG compliance)
- **Legal counsel** (privacy, education law)
- **Marketing specialist** (education sector)

### C. Budget Allocation
- **Development** (60%): Team salaries, tools, infrastructure
- **Marketing** (25%): User acquisition, partnerships, content
- **Operations** (10%): Support, maintenance, monitoring
- **Legal/Compliance** (5%): Audits, certifications, consulting

---

## 34) Success Metrics & KPIs
### A. Product Metrics
- **Daily Active Users** (target: 10K within 6 months)
- **Session Duration** (target: avg 25 minutes)
- **Feature Adoption** (study tools usage >60%)
- **Retention** (30-day: >40%, 90-day: >25%)

### B. Business Metrics
- **Monthly Recurring Revenue** (target: $50K within 12 months)
- **Customer Acquisition Cost** (<$25 for students, <$100 for institutions)
- **Churn Rate** (<5% monthly for paid users)
- **Net Promoter Score** (target: >50)

### C. Technical Metrics
- **Page Load Time** (<1s for 95th percentile)
- **Uptime** (>99.9% excluding scheduled maintenance)
- **Bug Escape Rate** (<2% to production)
- **Security Incidents** (target: 0 data breaches)

---

## FINAL PRODUCTION CHECKLIST
- [ ] **Security audit** completed
- [ ] **Accessibility audit** (WCAG 2.1 AA) passed
- [ ] **Performance budget** enforced (<1s TTI, <300KB initial bundle)
- [ ] **Error monitoring** configured
- [ ] **Backup/recovery** procedures tested
- [ ] **Legal review** completed (ToS, Privacy Policy)
- [ ] **Support documentation** complete
- [ ] **Rollback plan** documented and tested
- [ ] **Monitoring dashboards** configured
- [ ] **Go-to-market plan** finalized

---

**"Done" Definition**: A student can slide in, write comprehensive notes with intelligent tagging, review with spaced repetition, and export everything — all while maintaining complete privacy and accessibility. The app works flawlessly across devices, scales to institutional use, and provides measurable learning outcomes.