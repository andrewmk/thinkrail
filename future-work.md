---
id: future-work
type: goal-and-requirements
status: active
title: ThinkRail — future work ideas
tags: [product, future-work]
---

Ideas the product will take on but is not currently working on. An entry stays here while it is an
idea; when the work is picked up it graduates into a task spec or the owning module's spec, and the
entry is removed — a landed capability is recorded in [[goal-and-requirements]].

## A simplified view for structured question sessions

Structured question sessions — the multiple-choice questions the agent asks in chat instead of
guessing ([[module-ext-ask-user-question]]) — are presented inside the full developer workbench.
For a non-technical user, a session that only needs a few answers is easy to get lost in: the
normal interface is overwhelming, confusing, and can be frightening.

A simplified presentation of the same session: one question at a time, in plain language, with
minimal surrounding chrome, clear choices, and visible progress — and a clear way back to the full
UI when the user wants it. This serves the on-ramp audience named in [[goal-and-requirements]]
(newcomers who want a visual on-ramp). A new presentation mode over the existing question contract,
not a second question system.
