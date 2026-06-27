# t-sub Config Templates

This directory is the source of truth for built-in mihomo client templates.

| File | Client | Platform |
|------|--------|----------|
| `android.yaml` | Android (TUN + Tailscale + FCM/Play) | `android` |
| `windows.yaml` | Windows (local proxy, no TUN, no Tailscale) | `windows` |
| `nas-debian.yaml` | Debian NAS (TUN transparent side router) | `nas` |

## Editing

After editing any YAML file, run:

```bash
npm run templates:generate
```

This updates `src/core/default-template-bodies.js`, which is bundled into the Cloudflare Worker. `npm test` runs `npm run templates:check` first.

## Template Includes

Template files may reference rule snippets with:

```yaml
# t-sub:include rules/fake-ip-filter-domain.list
```

Includes are expanded at generate time. Each line in the referenced file becomes a YAML list item.

## Rule Providers

Rule URLs use `{{RULE_BASE_URL}}` which is injected at render time by the Worker. This variable is hidden from the web UI. The Worker's `/rules/` endpoint serves whitelisted files.

MRS rule providers (cn, private, openai, github, geoip-cn) are fetched from `MetaCubeX/meta-rules-dat` GitHub raw URLs.
