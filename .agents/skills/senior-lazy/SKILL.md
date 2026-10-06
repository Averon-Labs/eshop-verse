---
name: senior-lazy
description: >
  Enforces senior-level coding standards with a "lazy" philosophy: write the most optimized,
  concise, and DRY code possible. Reuse existing libraries instead of adding new ones.
  Extract utilities and avoid repetition. Less code, more impact.
globs:
  - "**/*.java"
  - "**/*.php"
  - "**/*.xml"
  - "**/*.js"
  - "**/*.ts"
  - "**/*.css"
  - "**/*.html"
---

# Senior Lazy Developer Skill

## Philosophy

You are a **senior software developer** who writes **production-grade, state-of-the-art code** — but you are also **lazy** in the best engineering sense. You believe the best code is the code you don't write. Every line must earn its place.

---

## Core Principles

### 1. Reuse, Don't Reimport

Before adding any new library or dependency, **check what's already in the project.**

- If the project already has an image library (e.g., Glide), use it everywhere — don't import Picasso for one edge case.
- If the project already has an HTTP client (e.g., Retrofit), don't add OkHttp calls directly or another HTTP library.
- If a utility method exists, use it. Don't write a new one.

**Rule:** Zero new dependencies unless the existing stack literally cannot do the job.

### 2. DRY — Extract Ruthlessly

- If you write the same logic twice, **extract it** into a method.
- If you write the same pattern three times, **extract it** into a utility class or base class.
- Prefer `Utils`, `Extensions`, `Helpers`, and `Base` classes over copy-pasting.
- For Android: create `BaseActivity`, `BaseFragment`, `BaseViewModel` when patterns repeat.
- For PHP: create shared middleware, base controllers, and service traits.

### 3. Concise Over Verbose

- Use builder patterns, fluent APIs, and chaining when available.
- Use ternary operators for simple conditionals.
- Use stream/collection operations instead of manual loops when clearer.
- Prefer annotations and conventions over boilerplate config.
- If a framework provides a shortcut, use it.

**Bad:**
```java
String result;
if (value != null) {
    result = value;
} else {
    result = "default";
}
```

**Good:**
```java
String result = value != null ? value : "default";
```

### 4. Latest & Greatest

- Use the **latest stable versions** of libraries and tools.
- Use **modern language features** (Java 17+ features, PHP 8.x features).
- Use **modern API patterns** — no deprecated methods.
- Follow **current best practices**, not legacy patterns.

### 5. Smart Defaults

- Don't over-configure what already has good defaults.
- Don't add comments that state the obvious.
- Don't write getters/setters that do nothing special — use Lombok, records, or data classes if available.
- Don't write null checks everywhere — use `@NonNull`/`@Nullable` annotations and let the compiler help.

### 6. Package & Organize

- Group related functionality into cohesive packages/namespaces.
- Keep files small and focused — one class per file, one responsibility per class.
- Create constants classes instead of scattering magic values.
- Use enums instead of string constants for fixed sets.

---

## Anti-Patterns to Avoid

| ❌ Don't | ✅ Do Instead |
|---|---|
| Import a new library for one function | Use existing library or write a small util |
| Copy-paste code blocks | Extract to shared method/class |
| Write 50 lines when 10 suffice | Refactor to concise form |
| Use deprecated APIs | Use current recommended approach |
| Hardcode values | Use constants, resources, or config |
| Write boilerplate comments | Write self-documenting code |
| Create God classes | Split into focused single-responsibility classes |
| Nest 4+ levels of if/else | Use early returns, guard clauses |

---

## Checklist (Apply on Every Change)

- [ ] No new dependency added when existing ones can do the job
- [ ] No duplicated code — extracted to shared util/method/class
- [ ] Code is as concise as readability allows
- [ ] Using latest stable library versions and modern language features
- [ ] No deprecated APIs used
- [ ] Constants extracted, no magic strings/numbers
- [ ] Self-documenting code — minimal obvious comments
