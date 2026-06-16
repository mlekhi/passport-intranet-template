## passport admin

a deployment gateway. + a claude code skill ships a static site to the gateway, which deploys it as its own vercel project under the org's team, protects it behind the org's idp (passport), and returns the url.

## what it deploys

the deploy endpoint takes a multipart upload — either a single `.zip` or loose files. a zip is unzipped server-side, a wrapping folder is stripped, and junk (`.git`, `node_modules`, `.DS_Store`, `__MACOSX`, `.env.local`) is dropped.

supported — plain static sites served as-is, no build step:

- html, css, js, and any binary assets (images, fonts, favicons) — bytes are preserved, not corrupted
- one page or many, nested paths, multiple html files
- must have an `index.html` at the root to serve at `/`

not supported — anything that needs a build or a server:

- next.js or any framework project (a `package.json`, `vercel.json`, an `api/` directory, or server source like `.py`/`.go` is rejected)
- bundles with no root `index.html`

rejections come back with a code (`not_static`, `no_root_index`, `bad_zip`, `duplicate`, `empty`) so the calling skill can explain the fix and retry.

## decisions to make

- ownership — does the gateway capture user-side identity at deploy time (e.g. a stanford student's sso email, passed by the claude skill) so the dashboard can show who deployed each app, or do apps arrive with no identity and the dashboard just lists the deployments?
