# Security Policy

Report security issues privately to the maintainers before opening public issues. Do not place secrets, provider keys, OAuth client secrets, session cookies, or production logs containing private data in issues or PRs.

## Supported Branches

- `main`: active development
- `stable/0.7-telemetry`: migration seed and compatibility baseline

## Secret Handling

Hosted and desktop surfaces must store secrets only in the approved secret store for that surface. Local provider keys stay local unless the user explicitly opts into a hosted secret backend.
