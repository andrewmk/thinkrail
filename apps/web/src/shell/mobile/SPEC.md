---
id: submodule-web-shell-mobile
type: submodule-design
status: active
title: shell/mobile — coarse-pointer projection
parent: submodule-web-shell
---

# Mobile Shell

Phone projection of the desktop workbench, rendered by `Shell` when `useCoarsePointer()` reports a
coarse pointer — width does not matter, so a tablet in touch mode gets the same projection. One
screen at a time: the desktop docked frame is never projected; the phone gets a topbar, one active
view, and a three-tab bottom bar.

## Responsibility

`MobileShell` owns the mobile view state (the active tab) and the mobile layout grid. Everything
else is reused, not re-derived:

- **The frame materializes through the workbench's own hooks.** `MobileWorkspace` (remounted per
  workspace; `MobileShell` resets the tab to chat on workspace entry) runs the desktop workbench's
  frame trio: `useWorkspaceLayoutState` (install the per-workspace document),
  `useLayoutIntentProcessing` (land open/select/close intents with a no-op focus request — there is
  no tab strip to scroll), and `useWorkspaceChatCatalogReconciliation` (fetch the workspace's
  `session.list`, place preexisting chats — live/open-todo, falling back to the most-recent so a
  workspace never lands empty while chat history exists — hydrate their messages, resolve
  exact-chat route targets, prune server-deleted sessions). The third is what makes preexisting
  chats load on the phone: layout state is client-local per surface, so a fresh mobile surface
  installs an empty document and, without the catalog fetch, never discovers the chats another
  surface placed — entering such a workspace showed "No chat yet" instead of the workspace's
  history. Two desktop workbench hooks are intentionally absent: `useDeletedChatPlacementReconciliation`
  (deletions already flow through the `remove-session` layout intent the processing hook handles)
  and `useChatLocationReconciliation` (its only request source is history search, desktop-only
  chrome). Without the trio, the projection reads a nonexistent document and open-tab intents
  (starting a chat, tapping a file link) never land anywhere, so "New chat" appears to do nothing.
- **Views are store projections, not a second state model.** The Chat tab renders
  `selectMobileActiveChat` (the attention group's selected chat, falling back to its first chat)
  through `ChatResourceBody`; the Files tab renders `FilesPanel` and, while a file/diff/changes tab
  has center attention, a full-screen `EditorResourceBody` detail with a back-to-tree button; the
  Plan tab renders `selectRailPlanSessionId` through `PlanRailPane`. A topbar history button opens
  the full-screen **chat list**: all of the workspace's sessions newest first (the catalog hook's
  `session.list` summaries, loading until the first read lands, an empty state for a chatless
  workspace), the active chat marked, a row tap switching through `openChatInTab` (cached/hydrated/
  fetch paths) and back to the Chat tab, and a New chat action — the only way to start a chat once
  the workspace has one (the Chat tab's empty-state button covers the chatless case). Rename and
  delete stay desktop-only (the desktop history popover owns them). Docking, splits, and tool tabs
  are desktop-only; mobile reads the same attention document the desktop writes.
- **The Chat view stays mounted** (hidden with `display: none`) while Files or Plan is active, so a
  streaming transcript keeps its scroll position across tab switches. Files and Plan unmount.
- **Navigation.** A file link tapped inside chat opens the file and switches to the Files tab.
  An incoming exact-chat route (`routeChatTarget`) forces the Chat tab. Project and workspace
  selection lives in one full-screen `ProjectTree` sheet opened from the topbar chips; the chat
  list is a second full-screen sheet from the topbar history button; the branch name shows as a
  read-only chip (no review/PR affordances on mobile).
- **No workspace** (or a workspace-creation in flight, or onboarding) renders `MobileProjectHome`:
  `WorkspaceCreationView` → `WelcomePanel` → `ProjectTree`, in that precedence — the desktop
  `ProjectHome` rail/resize layout is not projected.
- **Shared overlays** (settings, new-workspace, toasts, update surfaces) stay in `Shell` and render
  for both projections; desktop-only chrome (search palette, global chords, branch polling, window
  controls, app shortcuts) lives in `DesktopChrome` and is skipped on mobile.

## PWA packaging

The web build is installable for phones, and the packaging exists for this projection, so it is
recorded here although it lives in the app root: `index.html` links the manifest, `vite.config.ts`
runs `vite-plugin-pwa` (generateSW, autoUpdate, navigateFallback to `index.html`, host routes
`/ws` `/files` `/blob` `/fonts` denied as navigation fallbacks), and icons live under
`public/icons` (a maskable 512 variant covers the safe zone). Registration is `main.tsx`'s call and
browser-only: the desktop webview's preload marker (`__THINKRAIL_DESKTOP__`) skips it, because the
desktop ships its shell beside its host and a precache must never mask an updated host. Offline is
the standard disconnected UI: the shell opens from the precache with the disconnected connection
status, and no offline mutation path is claimed. E2E: the default no-agent suite blocks service
workers (a precache would bypass asset `page.route` aborts); the PWA lane (`e2e:pwa`) is the one
lane that allows them.

## Public surface

- `MobileShell` — the mobile projection root (the only export of `./mobile`).

## Boundaries

- Depends on: `store` (selectors + actions), `lib` (`useCoarsePointer`, `chatLabel`,
  `relativeTime`), `transport` (status type), `components` (`QuietScrollArea`, `useNow`), sibling
  shell modules (`resourceBodies`, `layoutState` + `layoutIntents` + `legacySelection` +
  `chatReconciliation` for frame materialization, `layout` types, `ConnectionStatus`), `panels`
  (`FilesPanel`, `ProjectTree`, `WelcomePanel`, `WorkspaceCreation`, `openTabs`, `openChat`).
- Does not import: the desktop workbench internals directly (it consumes `resourceBodies`),
  `DesktopChrome`, or anything under `shell/layout` other than types and `layoutTabName`.
- Text goes through `@thinkrail/locales` (`shell.mobile.*`); icons are `@remixicon/react` Line/Fill
  pairs matching the desktop tab vocabulary (chat / file / task).
- The root carries `data-testid="shell"` (both projections) plus `data-mobile="true"`; the desktop
  projection does not set `data-mobile`.
