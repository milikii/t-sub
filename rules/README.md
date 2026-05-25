# t-sub rule sets

Mihomo built-in templates fetch these files through `rule-providers` with `proxy: ⚡ 自动选择`, so updates are downloaded through a selected node instead of relying on direct access.

## Direct domains

Add sites that should go `DIRECT` to `pt-direct.list`.

Use one rule per line:

```text
+.example.com
example.org
```

`+.example.com` matches `example.com` and its subdomains. Use a bare domain only when you want to match that exact domain.

## FCM

`fcm-domain.list` and `fcm-ipcidr.list` are used by the Android template's `📲 谷歌推送` group.
