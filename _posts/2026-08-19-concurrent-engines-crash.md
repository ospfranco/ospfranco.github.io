---
layout: post
title: React Native Bridgeless, race conditions with concurrent JS runtimes
date: 2026-08-19
categories: post
permalink: /:title/
image: /assets/oscar.jpg
---

Recently a bug was reported to [op-sqlite](https://github.com/OP-Engineering/op-sqlite), it was a crash that only reproduced on hot reload or a CodePush/OTA update. Never on cold launch. The stack trace pointed at `~jsi::Value()` inside `ThreadPool::doWork()` — a destructor running on a background thread, tearing down a JSI value that belonged to a JS runtime which, no longer existed.

If you don't know how op-sqlite works, it's a pure JSI C++ module. It uses the entry point of a TurboModule, but then creates it's own JSI functions and injects them into the JS runtime (using `opsqlite::install`) . When a reload happens, React Native calls each Turbo Module destructor function (which in turn calls `opsqlite::invalidate`). However, since it's a C++ module, it has some global state, independent of how the JS runtime initializes it, via shared pointers and global (module scoped) variables.

# One runtime at a time, then two

Under the old bridge, a reload was strictly sequential: tear the old runtime all the way down, *then* boot the new one. `invalidate()` finished before `install()` for the next generation ever ran. Any process-global state — a static pointer, a shared flag — was safe by construction, because only one generation was ever alive to touch it.

Bridgeless changed that ordering. The new `RCTInstance` starts before the old one has finished invalidating. The old instance gets a budget of a few seconds to clean up and then gets torn down regardless of whether it's done. In between, there's a real window — not a hypothetical one — where two runtime generations are alive at the same time, both touching the same native module state.

<div class="my-8 rounded-xl border border-neutral-800 bg-[#0d0d0d] p-4">
<svg viewBox="0 0 760 210" style="width:100%;height:auto;display:block">
<style>
  text{font-family:ui-sans-serif,-apple-system,"Inter",sans-serif}
  .lane{fill:#8f8f8f;font-size:11px;font-weight:600;letter-spacing:.04em}
  .bar-label{fill:#e6e6e6;font-size:11px}
  .note{fill:#8f8f8f;font-size:10.5px}
</style>
<text x="16" y="60" class="lane">OLD BRIDGE</text>
<rect x="130" y="45" width="250" height="22" rx="6" fill="#1a1a1a" stroke="#b0b0b0" stroke-width="1.3"/>
<text x="255" y="60" text-anchor="middle" class="bar-label">Old · invalidate()</text>
<rect x="410" y="45" width="250" height="22" rx="6" fill="#1c1c1c" stroke="#707070" stroke-width="1.3"/>
<text x="535" y="60" text-anchor="middle" class="bar-label">New · install()</text>
<text x="395" y="94" text-anchor="middle" class="note">no overlap — one runtime alive at a time</text>
<circle r="4" fill="#b0b0b0">
  <animateMotion path="M140,56 L650,56" dur="4s" repeatCount="indefinite"/>
  <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.05;0.9;1" dur="4s" repeatCount="indefinite"/>
</circle>

<line x1="16" x2="744" y1="112" y2="112" stroke="#262626" stroke-width="1"/>

<text x="16" y="160" class="lane">BRIDGELESS</text>
<rect x="130" y="145" width="330" height="22" rx="6" fill="#1a1a1a" stroke="#b0b0b0" stroke-width="1.3"/>
<text x="295" y="160" text-anchor="middle" class="bar-label">Old · invalidate()</text>
<rect x="330" y="145" width="330" height="22" rx="6" fill="#1c1c1c" stroke="#707070" stroke-width="1.3"/>
<text x="495" y="160" text-anchor="middle" class="bar-label">New · install()</text>
<rect x="330" y="138" width="130" height="36" rx="6" fill="#8a8a8a" fill-opacity="0.12" stroke="#8a8a8a" stroke-width="1" stroke-dasharray="4 3">
  <animate attributeName="fill-opacity" values="0.06;0.22;0.06" dur="2.4s" repeatCount="indefinite"/>
</rect>
<text x="395" y="196" text-anchor="middle" class="note" fill="#8a8a8a">both alive</text>
<circle r="4" fill="#b0b0b0">
  <animateMotion path="M140,156 L450,156" dur="3.4s" repeatCount="indefinite"/>
  <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.06;0.9;1" dur="3.4s" repeatCount="indefinite"/>
</circle>
<circle r="4" fill="#707070">
  <animateMotion path="M340,156 L650,156" dur="3.4s" repeatCount="indefinite" begin="1.1s"/>
  <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.06;0.9;1" dur="3.4s" repeatCount="indefinite" begin="1.1s"/>
</circle>
</svg>
<p class="mt-3 text-center text-xs text-neutral-500">Bridgeless overlaps two generations for a few seconds — long enough for global state to be touched by both.</p>
</div>

# op-sqlite's global state

op-sqlite kept its cross-DB bookkeeping as plain process-global state:

```cpp
namespace opsqlite {
  std::vector<std::shared_ptr<DBHostObject>> dbs;
  bool invalidated = false;
  // The CallInvoker allows to queue work back into the JS thread
  std::shared_ptr<react::CallInvoker> invoker;
}
```

Databases where kept for cleanup on invalidation, the invalidated flag was to stop queueing work if the module was already invalidated, and the invoker was used to queue off-thread work back into the JS thread — per process, not per generation. That was fine under the old bridge: `install()` for a new generation could never run while an old generation was still draining, so there was never more than one "current" runtime to be confused about. Under bridgeless, `install()` for the new generation can run *while* the old generation's `invalidate()` is still in flight.

# The failure, concretely

Here's the actual sequence that crashed:

- The outgoing runtime has queued, or is actively running, a long-running SQLite query on a background thread.
- A reload or OTA update fires. The outgoing runtime starts tearing down.
- SQLite interrupts the in-flight query and tries to schedule the resulting error back onto the JS thread — the same thread that's in the middle of being torn down.
- By the time that happens, the new runtime has already replaced the shared state with its own pointers.
- op-sqlite isn't generation-aware, so it either schedules that callback on the wrong invoker, or tries to destroy JS objects from a thread that isn't the JS thread — neither of which is valid.

<div class="my-8 rounded-xl border border-neutral-800 bg-[#0d0d0d] p-4">
<svg viewBox="0 0 760 300" style="width:100%;height:auto;display:block">
<style>
  text{font-family:ui-sans-serif,-apple-system,"Inter",sans-serif}
  .lbl{fill:#e6e6e6;font-size:12.5px;font-weight:600}
  .sub{fill:#8f8f8f;font-size:10.5px}
  .warn{fill:#c9c9c9;font-size:10.5px}
</style>
<defs>
  <marker id="arrB" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6.5" markerHeight="6.5" orient="auto-start-reverse">
    <path d="M0,0 L10,5 L0,10 z" fill="#383838"/>
  </marker>
  <marker id="arrBRed" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6.5" markerHeight="6.5" orient="auto-start-reverse">
    <path d="M0,0 L10,5 L0,10 z" fill="#c9c9c9"/>
  </marker>
</defs>

<rect x="20" y="30" width="200" height="64" rx="8" fill="#161616" stroke="#383838" stroke-width="1.4"/>
<text x="120" y="56" text-anchor="middle" class="lbl">Background thread</text>
<text x="120" y="74" text-anchor="middle" class="sub">long-running SQLite query</text>

<rect x="290" y="30" width="190" height="64" rx="8" fill="#161616" stroke="#383838" stroke-width="1.4"/>
<text x="385" y="56" text-anchor="middle" class="lbl">sqlite3_interrupt()</text>
<text x="385" y="74" text-anchor="middle" class="sub">schedules result via invoker</text>

<rect x="550" y="30" width="190" height="64" rx="8" fill="#161616" stroke="#383838" stroke-width="1.4"/>
<text x="645" y="56" text-anchor="middle" class="lbl">…or should run</text>
<text x="645" y="74" text-anchor="middle" class="sub">on the JS thread</text>

<rect x="290" y="210" width="190" height="64" rx="8" fill="#1c1c1c" stroke="#707070" stroke-width="1.4"/>
<text x="385" y="236" text-anchor="middle" class="lbl" fill="#cfcfcf">install()</text>
<text x="385" y="254" text-anchor="middle" class="sub">new generation starts</text>

<rect x="550" y="210" width="190" height="64" rx="8" fill="#242424" stroke="#c9c9c9" stroke-width="1.6">
  <animate attributeName="stroke-opacity" values="0.5;1;0.5" dur="1.6s" repeatCount="indefinite"/>
</rect>
<text x="645" y="236" text-anchor="middle" class="lbl" fill="#e8e8e8">wrong thread, stale invoker</text>
<text x="645" y="254" text-anchor="middle" class="warn">crash</text>

<path d="M220,62 H290" stroke="#383838" stroke-width="1.4" marker-end="url(#arrB)"/>
<path d="M480,62 H550" stroke="#383838" stroke-width="1.4" marker-end="url(#arrB)"/>
<path d="M645,94 V210" stroke="#383838" stroke-width="1.4" marker-end="url(#arrB)"/>
<path d="M385,210 V94" stroke="#c9c9c9" stroke-width="1.4" stroke-dasharray="4 3" marker-end="url(#arrBRed)"/>
<text x="398" y="155" class="warn">swaps the shared pointers</text>

<circle r="4" fill="#b0b0b0">
  <animateMotion path="M40,62 H645" dur="3s" repeatCount="indefinite"/>
  <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.06;0.85;1" dur="3s" repeatCount="indefinite"/>
</circle>
<circle r="4" fill="#c9c9c9">
  <animateMotion path="M645,62 V242" dur="3s" repeatCount="indefinite" begin="2.55s"/>
  <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.1;0.7;1" dur="3s" repeatCount="indefinite" begin="2.55s"/>
  <animate attributeName="r" values="4;4;7;3" keyTimes="0;0.7;0.85;1" dur="3s" repeatCount="indefinite" begin="2.55s"/>
</circle>
<circle r="3.5" fill="#c9c9c9">
  <animateMotion path="M385,205 V96" dur="2.2s" repeatCount="indefinite" begin="0.6s"/>
  <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.1;0.85;1" dur="2.2s" repeatCount="indefinite" begin="0.6s"/>
</circle>
</svg>
<p class="mt-3 text-center text-xs text-neutral-500">The interrupted query still has to report back — by the time it does, the shared pointers it relies on may already point at a different generation.</p>
</div>

Nothing here is exotic. It's the standard shape of a race: two independent sequences of events, running on different threads at different rates, mutating one shared variable between them. Bridgeless just made the window real.

# A liveness flag per generation

The fix is to stop treating "current runtime" as a single global fact and make it something each generation owns:

```cpp
extern std::shared_ptr<std::atomic<bool>> generation_alive;
```

- `install()` allocates a fresh `atomic<bool>(true)` for the new runtime.
- `invalidate()` flips *that specific* shared pointer to `false` — it doesn't touch the new generation's flag, because it doesn't have one.
- Any work that gets queued copies the shared pointer at **queue time**, not at run time, so it's always checking the liveness of the generation that actually created the work, regardless of what `generation_alive` points to globally by the time it runs.

# Bind at construction, not at use

The concrete change is small: instead of reading the process-global `invoker` and `generation_alive` inside a callback, each `DBHostObject` copies them into member variables the moment it's constructed — which happens during that object's generation, not whenever some later callback happens to fire.

```cpp
// DBHostObject.hpp — shadows the globals
std::shared_ptr<react::CallInvoker> invoker = opsqlite::invoker;
std::shared_ptr<std::atomic<bool>> alive    = opsqlite::generation_alive;
```

```cpp
void DBHostObject::on_update(...) {
  if (alive && !alive->load()) return;
  invoker->invokeAsync(...);
}
```

Every update hook is fixed by this at once, with no call-site changes — the check is local to the object that captured its own generation's identity, so it can't be fooled by whatever the global pointers have since become.

<div class="my-8 rounded-xl border border-neutral-800 bg-[#0d0d0d] p-4">
<svg viewBox="0 0 760 260" style="width:100%;height:auto;display:block">
<style>
  text{font-family:ui-sans-serif,-apple-system,"Inter",sans-serif}
  .lbl{fill:#e6e6e6;font-size:12.5px;font-weight:600}
  .sub{fill:#8f8f8f;font-size:10.5px}
  .tag{font-size:10.5px;font-weight:600}
</style>
<defs>
  <marker id="arrCg" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6.5" markerHeight="6.5" orient="auto-start-reverse">
    <path d="M0,0 L10,5 L0,10 z" fill="#a0a0a0"/>
  </marker>
  <marker id="arrCgray" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6.5" markerHeight="6.5" orient="auto-start-reverse">
    <path d="M0,0 L10,5 L0,10 z" fill="#6e6e6e"/>
  </marker>
  <marker id="arrCd" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6.5" markerHeight="6.5" orient="auto-start-reverse">
    <path d="M0,0 L10,5 L0,10 z" fill="#383838"/>
  </marker>
</defs>

<rect x="20" y="98" width="220" height="64" rx="8" fill="#161616" stroke="#383838" stroke-width="1.4"/>
<text x="130" y="124" text-anchor="middle" class="lbl">work queued</text>
<text x="130" y="142" text-anchor="middle" class="sub">captures invoker + alive</text>

<rect x="330" y="98" width="170" height="64" rx="8" fill="#161616" stroke="#383838" stroke-width="1.4"/>
<text x="415" y="124" text-anchor="middle" class="lbl">alive-&gt;load()</text>
<text x="415" y="142" text-anchor="middle" class="sub">checked at run time</text>

<rect x="560" y="16" width="180" height="64" rx="8" fill="#181818" stroke="#a0a0a0" stroke-width="1.4"/>
<text x="650" y="42" text-anchor="middle" class="lbl" fill="#d6d6d6">invokeAsync()</text>
<text x="650" y="60" text-anchor="middle" class="sub">same generation → delivered</text>

<rect x="560" y="180" width="180" height="64" rx="8" fill="#161616" stroke="#4a4a4a" stroke-width="1.4"/>
<text x="650" y="206" text-anchor="middle" class="lbl" fill="#cccccc">return</text>
<text x="650" y="224" text-anchor="middle" class="sub">stale generation → skipped</text>

<path d="M240,130 H330" stroke="#383838" stroke-width="1.4" marker-end="url(#arrCd)"/>
<path d="M500,130 H520" fill="none" stroke="#383838" stroke-width="1.4"/>
<circle cx="520" cy="130" r="2.5" fill="#383838"/>
<path d="M520,130 V48 H560" fill="none" stroke="#a0a0a0" stroke-width="1.4" marker-end="url(#arrCg)"/>
<path d="M520,130 V212 H560" fill="none" stroke="#6e6e6e" stroke-width="1.4" marker-end="url(#arrCgray)"/>
<text x="528" y="76" class="tag" fill="#a0a0a0">true</text>
<text x="524" y="196" class="tag" fill="#6e6e6e">false</text>

<circle r="4" fill="#a0a0a0">
  <animateMotion path="M40,130 H520 V48 H560" dur="3.2s" repeatCount="indefinite"/>
  <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.05;0.9;1" dur="3.2s" repeatCount="indefinite"/>
</circle>
<circle r="4" fill="#8f8f8f">
  <animateMotion path="M40,130 H520 V212 H560" dur="3.2s" repeatCount="indefinite" begin="1.6s"/>
  <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.05;0.9;1" dur="3.2s" repeatCount="indefinite" begin="1.6s"/>
</circle>
</svg>
<p class="mt-3 text-center text-xs text-neutral-500">Same queued work, two possible outcomes — the generation it was bound to at creation decides which one, checked when it actually runs.</p>
</div>

# Takeaways

- Bridgeless means two engines can be alive at once, for a few real seconds — not a theoretical race.
- Never trust a global "current runtime" read from inside a callback; by the time it runs, it may not be current anymore.
- Capture generation identity at creation time, not at resolution time — bind at construction/queue time, check at run time.
- `invalidate()` means *this instance* is dying, not the module — global module state needs to stop assuming there's only ever one instance.
- Shared native registries need real locks once two generations can exist concurrently.
- Waiting isn't enough for teardown — actively interrupt in-flight work so the drain can actually finish inside its budget.
