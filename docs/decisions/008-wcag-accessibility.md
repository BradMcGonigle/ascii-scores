# [ADR-008] WCAG 2.1 AA Accessibility Compliance

> **Status:** Accepted
>
> **Date:** 2026-01-30
>
> **Authors:** @BradMcGonigle

## Context

ASCII Scores uses a retro terminal aesthetic with:
- ASCII art borders and decorations
- CRT-style visual effects (scanlines, glow, vignette)
- Color-coded status indicators (winning teams, game states)
- Animation effects (blinking cursor, pulsing glow)

This visual style creates accessibility challenges:
- Motion effects can cause discomfort for users with vestibular disorders
- Color-only indicators are invisible to colorblind users
- Decorative ASCII elements confuse screen readers
- Custom interactive components lack proper keyboard navigation
- Low contrast text can be difficult to read

The project aims to be inclusive while maintaining its distinctive visual identity.

## Decision

We will achieve **WCAG 2.1 Level AA compliance** by implementing comprehensive accessibility features:

### 1. Motion and Animation
- Respect `prefers-reduced-motion` media query
- Disable all animations, scanlines, and glow effects when reduced motion is preferred
- CRT effects are purely decorative and can be safely disabled

### 2. Keyboard Navigation
- All interactive elements are keyboard accessible
- Implement focus traps for modal dialogs (mobile navigation)
- Support arrow key navigation for custom components (theme selector)
- Add skip-to-content link for bypassing navigation

### 3. Screen Reader Support
- Mark decorative ASCII elements with `aria-hidden="true"`
- Add `aria-live` regions for dynamic content (refresh status)
- Provide text alternatives for all color-coded indicators
- Use semantic HTML and proper heading hierarchy
- Add descriptive labels for sections and controls

### 4. Visual Accessibility
- Visible focus indicators using `:focus-visible`
- Text alternatives alongside color indicators (e.g., "W" for winner, status text for F1 pit status)
- Sufficient color contrast ratios for all text
- `.sr-only` utility class for screen reader-only content

## Consequences

### Positive

- **Inclusive experience** - Users with disabilities can access live sports scores
- **Better SEO** - Semantic HTML improves search engine understanding
- **Legal compliance** - Meets accessibility requirements for public websites
- **Improved UX for all** - Keyboard navigation and focus states benefit power users
- **Graceful degradation** - Site remains functional without visual effects

### Negative

- **Additional development effort** - Accessibility features require ongoing attention
- **Testing complexity** - Need to test with screen readers and keyboard-only navigation
- **Some visual compromises** - Text alternatives add visual noise in some cases

### Neutral

- Visual effects remain available for users who can enjoy them
- Reduced motion mode is a valid alternative experience, not a degraded one

## Alternatives Considered

### Alternative 1: Basic accessibility only

Implement only the minimum required accessibility features.

**Pros:**
- Less development effort
- Simpler codebase

**Cons:**
- Excludes users with disabilities
- May not meet legal requirements
- Poor user experience for affected users

**Why not chosen:** Accessibility is a core value; half-measures exclude real users.

### Alternative 2: Separate accessible version

Create a separate, accessible version of the site without visual effects.

**Pros:**
- Could optimize each version independently
- Full visual experience preserved for one version

**Cons:**
- Doubles maintenance burden
- Creates second-class experience for users with disabilities
- Violates accessibility best practices

**Why not chosen:** A single, universally accessible site is the correct approach.

### Alternative 3: WCAG AAA compliance

Target the highest accessibility level.

**Pros:**
- Maximum inclusivity
- Best-in-class accessibility

**Cons:**
- Some AAA requirements are extremely strict
- May conflict with design goals
- Significant additional effort

**Why not chosen:** AA provides excellent accessibility while allowing reasonable design flexibility. AAA can be a future goal.

## References

- [PR #18: Comprehensive accessibility improvements](https://github.com/BradMcGonigle/ascii-scores/pull/18)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [MDN: prefers-reduced-motion](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion)
- [ADR-005: React Best Practices](./005-react-best-practices.md) - Includes jsx-a11y ESLint rules

---

## Implementation Notes

- `prefers-reduced-motion` styles in `src/app/globals.css`
- Skip link component in `src/app/layout.tsx`
- Focus trap implementation in `MobileNavigation` component
- ARIA live regions in `RefreshButton` component
- Screen reader utilities (`.sr-only`) in global CSS
