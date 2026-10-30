# Desktop interface review

Reviewed 2026-10-30 using official product screenshots and documentation. These observations concern visible interaction patterns; they are not a claim that competitor internals were reverse-engineered or that every commercial feature is implemented.

## Reference observations

| Product | Evidence reviewed | Relevant pattern | Applied to NomadSSH |
| --- | --- | --- | --- |
| SecureCRT | [Session management](https://www.vandyke.com/products/securecrt/session_management.html), [official tabbed-session screenshot](https://www.vandyke.com/images/screenshots/securecrt/SCRT_9.7_Main_Tabbed_Sessions.png) | Compact menu/toolbar, session tabs near terminals, multiple terminal groups, useful status information | Native menus, compact toolbar, independent session tabs, two-pane terminal view and status line |
| Bitvise SSH Client | [Screenshots](https://bitvise.com/screenshots), [Login](https://bitvise.com/files/screenshots/BvSshClient-Login.png), [SFTP](https://bitvise.com/files/screenshots/BvSshClient-Sftp.png) | Grouped connection settings, persistent log, dual local/remote file lists with metadata and transfer queues | Server/Authentication fieldsets, secondary connection options, Save & connect, lower log, two-pane filter/sort/Modified columns and queue |
| Royal TS | [Panels and tabs](https://docs.royalapps.com/r2023/royalts/getting-started/panels-and-tabs.html), [official panel screenshot](https://docs.royalapps.com/r2023/images/RoyalTS/GettingStarted/panelsandtabs_03.png) | Hierarchical navigation, property inspection, adjustable panels and clear workspace hierarchy | Host groups, property inspector, resizable navigation and controls to hide navigation/properties/log |
| Termius | [Official desktop product view](https://www.termius.com/) | Consistent iconography, clear host groups and separate key/forwarding/snippet destinations | Consistent icons and tool destinations; connection data uses a table suited to dense inspection |

Bitvise is included because it is the user's original functional reference. This is a design comparison, not a pricing or licensing comparison. No vendor graphics, source code or branding were copied into the product.

## Layout and behavior

The window has an OS title bar and application menu; a left connection manager; a compact command toolbar; workspace and session tabs; a central work area; and a bottom status line. The Connections view adds a sortable host table, right-side property inspector and lower event log. These panels can be hidden to recover working space.

Selecting a host inspects it. Double-click or Enter opens a new session. F2 edits and Delete opens a confirmation. Context actions provide connect, edit, duplicate, pin and delete. Table filters search names, addresses, usernames, groups and tags.

The connection dialog separates server fields from authentication and collapses organization/routing options. Save leaves the host in the manager; Save & connect saves first and connects only after a successful response. Stored passwords are never returned to the form.

SFTP has independent paths, filters and sort orders for local and remote panes. Directories sort first. Rows show name, size, modified date and permissions. Selection and action availability remain tied to the chosen pane and SSH session. A delayed result from a previous session cannot replace the current remote listing.

## Visual and copy rules

- Use platform UI fonts, compact controls, modest corner radii, restrained blue selection and visible focus outlines.
- Keep long addresses and fingerprints readable in properties; allow table scrolling at narrow sizes.
- Explain state and available actions using direct product language. Keep implementation details in About and documentation unless needed for a user decision.
- Describe the application as a desktop SSH client built in Go. Wails/React/xterm.js remain accurately documented as the interface stack.
- Use explicit words alongside connection-state colors. Do not depend on color alone.

## Limits

NomadSSH does not yet offer arbitrary dock/undock layouts, persistent panel layout presets, multi-monitor session windows, SFTP multi-select or drag/drop. The design adopts useful workflow patterns without implying parity with the reference applications. Native accessibility and platform-specific shortcuts require further acceptance on macOS and Linux.
