# MOEX Design — internal deployment

Read README.md and rules/development.md before changes.
Static frontend is in src/, the dependency-free Node HTTP server is in app/.
Run sh check.sh after edits. Never add tokens, private data, .env files or external
runtime dependencies to the release. Corporate deployment uses a merge request.
