# Technology comparison
| Option | Benefits | Costs | Decision |
|---|---|---|---|
| React + TypeScript + Vite, localStorage | Fast development; typed models; no account or backend | Device-local data; no sync | Selected provisional default |
| React + Express + SQLite | Multi-device backend path; relational storage | Deployment, authentication, more tests | Deferred |
| Plain HTML/JavaScript | Minimal tooling | More manual UI state and weaker type guarantees | Rejected for assignment preference |

Use npm, React, TypeScript, Vite, and Vitest. A backend adds no necessary MVP capability. Keep storage versioned with validated import/export. No runtime paid services. This decision follows product specification commit dc0dd5c; user did not personally confirm the stack.
