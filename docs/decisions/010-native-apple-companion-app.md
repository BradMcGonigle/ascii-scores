# [ADR-010] Native Apple Companion App

> **Status:** Proposed
>
> **Date:** 2026-02
>
> **Authors:** @BradMcGonigle

## Context

ASCII Scores is a successful web application with PWA support, push notifications, and a mobile-responsive design. While the web experience works well on mobile browsers, Apple's native platforms offer capabilities that cannot be achieved through the web alone:

- **Live Activities / Dynamic Island** - Display live game scores on the iOS lock screen and Dynamic Island without opening the app
- **WidgetKit** - Home screen, StandBy, and Apple Watch widgets for at-a-glance scores
- **APNs** - Apple Push Notification service is more reliable than Web Push on iOS and supports richer notification types
- **Apple Watch** - Glanceable score updates on wrist

The app's read-only nature (fetching and displaying scores) makes a native port manageable in scope. The ASCII art aesthetic translates naturally to native platforms since monospace text rendering is first-class in SwiftUI.

### Constraints

- Must not duplicate effort - the web app remains the primary platform
- ESPN API is unofficial (ADR-003) - the native app must respect the same caching and rate-limiting strategies
- No official league branding - same text-only constraint applies

## Decision

We will build a **supplemental native Apple app using SwiftUI** that lives in the existing monorepo under an `apple/` directory. The app will target iOS, iPadOS, and macOS from a single SwiftUI codebase.

### Monorepo Structure

The native app will coexist alongside the Next.js web app:

```
ascii-scores/
├── src/                    # Existing Next.js web app
├── app/                    # Next.js app directory
├── apple/                  # Native Apple app
│   ├── AsciiScores/        # Main app target
│   │   ├── Models/         # Shared data models
│   │   ├── Views/          # SwiftUI views
│   │   ├── Services/       # API clients (ESPN, OpenF1)
│   │   └── Utilities/      # Formatting, ASCII rendering
│   ├── Widgets/            # WidgetKit extension
│   ├── LiveActivity/       # Live Activities extension
│   └── AsciiScores.xcodeproj
├── package.json
├── docs/
└── ...
```

### Key Principles

1. **SwiftUI-only** - No UIKit unless absolutely necessary; enables iOS, iPadOS, and macOS from one codebase
2. **Shared API knowledge** - The Swift API clients will target the same ESPN and OpenF1 endpoints documented in ADR-003 and ADR-004
3. **Independent build systems** - Swift Package Manager for Swift dependencies; pnpm for web. No cross-compilation or shared runtime code
4. **Consistent caching behavior** - Respect the same TTLs and rate-limiting strategies as the web app (ADR-009)
5. **ASCII aesthetic preserved** - Monospace fonts and box-drawing characters in the native UI

### Target Features

| Feature | Platform | Priority |
|---------|----------|----------|
| Live scoreboards | iOS, iPadOS, macOS | High |
| Live Activities / Dynamic Island | iOS | High |
| Home screen widgets | iOS, iPadOS | High |
| StandBy widgets | iOS | Medium |
| Push notifications (APNs) | iOS, iPadOS, macOS | Medium |
| Apple Watch companion | watchOS | Low |

## Consequences

### Positive

- **Live Activities and widgets** provide a uniquely native experience that the web cannot replicate
- **Monorepo keeps documentation in sync** - ADRs, API docs, and architecture notes are shared
- **Coordinated changes** - Adding a new league can update both apps in one PR
- **No tooling conflicts** - Xcode and pnpm operate on separate file trees; they don't interfere with each other
- **macOS comes nearly free** - SwiftUI compiles for macOS with minimal platform-specific adjustments

### Negative

- **Two API client implementations** - TypeScript and Swift clients fetching from the same APIs must be kept in sync manually
- **Apple Developer Program cost** - $99/year required for App Store distribution and push notifications
- **Xcode project files are noisy** - `.pbxproj` files create difficult merge conflicts (mitigated with `.gitattributes`)
- **CI complexity increases** - Web CI remains on GitHub Actions; Apple builds need Xcode Cloud or a macOS runner
- **Additional maintenance burden** - Two codebases to update when APIs change

### Neutral

- The web app remains the primary platform and is unaffected by this addition
- The `apple/` directory is self-contained; deleting it removes the native app entirely with no impact on the web project
- No shared runtime code means neither platform blocks the other's releases

## Alternatives Considered

### Alternative 1: React Native / Expo

Use React Native to share JavaScript/TypeScript code between web and native.

**Pros:**
- Share data fetching logic and type definitions with the Next.js app
- Single language (TypeScript) across all platforms
- Expo provides managed workflow for easier builds

**Cons:**
- Weak WidgetKit and Live Activities support (requires native modules)
- Adds significant tooling complexity (Metro bundler, native bridges)
- React Native's text rendering is less suited to the ASCII monospace aesthetic
- Third runtime to maintain alongside web and native

**Why not chosen:** The primary value of a native app is platform-specific features (widgets, Live Activities, Dynamic Island) that React Native handles poorly. The app's read-only nature means there's little shared logic to justify the bridging overhead.

### Alternative 2: WKWebView Wrapper (Hybrid)

Wrap the existing Next.js web app in a native shell using WKWebView.

**Pros:**
- Minimal development effort
- Web and native UI are always identical

**Cons:**
- No access to WidgetKit, Live Activities, or Dynamic Island
- Offers negligible benefit over the existing PWA
- High risk of App Store rejection (Apple's guideline 4.2 - minimum functionality)
- Poor native feel; no platform integration

**Why not chosen:** A web wrapper provides no meaningful advantage over the existing PWA and loses access to the native features that justify building a companion app.

### Alternative 3: Separate Repository

Create a standalone repository for the Apple app.

**Pros:**
- Clean separation of concerns
- Independent CI/CD pipelines
- No risk of Xcode files cluttering the web project

**Cons:**
- Documentation drift - API changes documented in one repo but not the other
- Harder to coordinate cross-platform changes (e.g., adding a new league)
- Duplicated context (ADRs, architecture docs) or incomplete context in one repo

**Why not chosen:** The shared documentation and coordinated development benefits of a monorepo outweigh the minor inconvenience of Xcode files in the same tree. The `apple/` directory is self-contained and easy to ignore.

## References

- [ADR-003 - ESPN Unofficial API](./003-espn-unofficial-api.md) - API contracts shared between web and native
- [ADR-004 - OpenF1 API](./004-openf1-api.md) - F1 data source shared between platforms
- [ADR-009 - Hybrid Caching Strategy](./009-hybrid-caching-strategy.md) - Caching TTLs to replicate in native app
- [Apple WidgetKit Documentation](https://developer.apple.com/documentation/widgetkit)
- [Apple Live Activities](https://developer.apple.com/documentation/activitykit)
- [SwiftUI Documentation](https://developer.apple.com/documentation/swiftui)

---

## Implementation Notes

*To be updated during implementation*

- Consider `.gitattributes` entry: `*.pbxproj binary merge=union` to reduce Xcode merge conflicts
- Xcode Cloud free tier includes 25 compute hours/month for CI
- Swift Package Manager should be used over CocoaPods for dependency management
- The native app should proxy API requests through the existing Next.js API routes where possible to centralize rate limiting
