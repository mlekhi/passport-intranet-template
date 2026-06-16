## passport admin

a deployment gateway. a claude code skill ships a static html app to the gateway, which deploys it as its own vercel project under the org's team, protects it behind the org's idp (passport), and returns the url.

## decisions to make

- ownership — does the gateway capture user-side identity at deploy time (e.g. a stanford student's sso email, passed by the claude skill) so the dashboard can show who deployed each app, or do apps arrive with no identity and the dashboard just lists the deployments?
