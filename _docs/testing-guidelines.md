# Testing instructions
Run `npm test -- --run` (or the documented equivalent), `npm run build`, and any defined typecheck command. Record actual commands and results in QA evidence; never pre-fill successful results.

Test pure logic: trim/length rules, date validation including impossible dates, search/filter/sort, overdue excluding completed, import version/shape/IDs/numeric bounds, and invalid import preserving original data. Test persistence corruption/storage exceptions where practical. Timer verification must cover pause/resume/reset, exactly-once completion, refresh paused restoration, and task deletion.

Manually smoke-test create/edit/delete/complete, responsive viewport, keyboard labels/focus, export/import confirmation, invalid import, and demo no-overwrite. Each issue is closed only after its acceptance criteria are checked; report untested criteria as unverified. QA should review independently from the implementing role.

## Environment-specific grooming
Use executed Testing Library/jsdom integration tests for CRUD, timer lifecycle, backup interactions and persisted-state restoration when a real browser is unavailable. Inspect responsive CSS and DOM labels/native controls. Real-browser visual viewport and keyboard checks remain unverified limitations, not implied passes. Publication follows separate draft 07 and requires remote readback.

## Final reproducible commands

- `npm ci` installs exactly the locked dependencies on a clean checkout.
- `npm test`: Vitest with jsdom and Testing Library, pure model/storage checks and executed fake-timer lifecycle checks.
- `npm run typecheck`: explicit strict TypeScript compile check.
- `npm run build`: TypeScript and production Vite compilation.
- `npm run format:check`: pinned Prettier verifies readable conventional source/test/CSS formatting.
- `python -m unittest discover -s scripts -p 'test_*.py' -v`: publication helper safety checks, without issuing live GitHub operations.

Engineer final execution: 28 JavaScript/TypeScript tests passed across 4 files; 7 Python safety tests passed; typecheck, build and formatting checks exited successfully. Independent final QA must rerun and record its own evidence. Run the README demonstration and viewport/keyboard checks on a real browser externally; jsdom does not establish visual appearance or download completion.

## Test-runtime portability
`src/test-setup.ts` installs a deterministic in-memory Storage API on both `window` and `globalThis`. The shared constructor keeps `Storage.prototype.setItem` quota-failure spies attached to the actual instance. This isolates tests from Node versions exposing native Web Storage; application production persistence remains browser-native. Explicit jsdom URL is `http://localhost/`.

After the reported Mac storage-global failure, engineer verification under Node v24.19.0 passed 30 tests across 5 files, typecheck, production build and formatting checks. Local Mac confirmation is pending. Do not assume `NODE_OPTIONS=--no-webstorage` works on every Node release: the verified Node v24.19.0 rejected that option before running tests.
