# npm Audit Decision

Last reviewed: 2026-06-07

## Current Result

`npm audit` reports two moderate findings through Next.js' bundled PostCSS:

- `postcss <8.5.10`
- Path: `next -> node_modules/next/node_modules/postcss`
- Installed Next.js: `15.5.19`
- Bundled PostCSS: `8.4.31`

References:

- GitHub advisory: <https://github.com/advisories/GHSA-qx2v-qp2m-jg93>
- Next.js upstream tracking issue: <https://github.com/vercel/next.js/issues/93234>

The critical Vitest advisory was remediated by upgrading Vitest to `^4.1.8`.

## Decision

Do not run `npm audit fix --force` for this finding. npm currently proposes a breaking and invalid remediation path that downgrades Next.js to `9.3.3`.

An npm `overrides` attempt for `next -> postcss@8.5.15` was tested and rejected because npm left the installed tree invalid:

```text
next@15.5.19
└── postcss@8.4.31 invalid: "8.5.15" from node_modules/next
```

## Risk Treatment

Track the upstream Next.js fix and upgrade Next.js once a stable release bundles `postcss >=8.5.10`.

Until then:

- Keep direct PostCSS consumers on patched `postcss@8.5.15`.
- Do not accept untrusted CSS input for server-side PostCSS stringification.
- Re-run `npm audit` after each Next.js patch upgrade.
