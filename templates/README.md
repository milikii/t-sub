# t-sub config templates

This directory is the source of truth for built-in mihomo client templates.

| File | Client |
| --- | --- |
| `android.yaml` | Android mihomo alpha template with TUN, fake-ip DNS, FCM, Google Play rules, US/JP groups, and Tailscale home routing. |
| `nas-debian.yaml` | Debian NAS Docker template. It exposes a LAN HTTP/SOCKS proxy, keeps TUN disabled, and does not include Tailscale/tailnet rules. |
| `windows.yaml` | Windows desktop template with local controller and no Tailscale outbound. |

After editing any YAML file, run:

```bash
npm run templates:generate
```

The generator updates `src/core/default-template-bodies.js`, which is bundled into the Cloudflare Worker. `npm test` runs `npm run templates:check` first, so stale generated template bodies fail fast.

Rule-provider files are maintained separately in `../rules/`. Keep public rule URLs under `/rules/*.list` unless you also plan a compatibility migration for existing clients.

Template files may include maintained rule snippets with:

```yaml
# t-sub:include rules/fake-ip-filter-domain.list
```

The include is expanded only when `npm run templates:generate` writes the Worker bundle. Use separate snippets for client-specific behavior, such as tailnet or Android-only fake-ip filters.
