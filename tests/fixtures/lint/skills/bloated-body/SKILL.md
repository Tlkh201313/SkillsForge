---
name: bloated-body
description: Review an intentionally oversized instruction body for lint coverage. Use when the content budget fixture is exercised.
---

# Oversized body fixture

Read the request carefully and identify the exact outcome, the relevant inputs, the boundaries that must remain unchanged, and the evidence needed to prove completion. Record the expected behavior in concrete terms before acting. Inspect only the files and runtime signals that directly affect the requested behavior. Keep observations separate from assumptions, and verify assumptions with the least expensive reliable check available. Prefer existing project conventions, helpers, types, schemas, and test infrastructure over parallel implementations. Preserve unrelated user changes and avoid widening the edit surface merely to make the implementation easier.

Create a focused failing test that demonstrates one missing behavior and fails for the expected reason. Confirm that the failure is caused by the absent capability rather than a typo, invalid fixture, or broken setup. Implement the smallest complete change that makes the test pass without weakening assertions or hiding errors. Run the focused test again, inspect its output, and keep the implementation aligned with the public contract. Repeat this cycle for each independent behavior. After every green step, remove duplication only when doing so leaves the tests green and makes the code easier to understand.

Treat external input as untrusted. Validate paths, structured data, configuration values, and permission-sensitive state at the boundary where they enter the system. Keep authorization checks on the trusted side of the boundary. Avoid command construction from unchecked strings, accidental traversal outside an intended root, and silent fallback behavior that converts malformed input into success. Report failures with stable, actionable diagnostics that name the affected rule and resource. Do not expose secrets, internal stack traces, credentials, personal data, or unrelated environment details in output or fixtures.

Verify the result proportionally to risk. Start with static and targeted tests, then run broader checks required by the project. Capture the exact commands and their exit status. Confirm that warnings remain visible, errors remain fatal, ordering stays deterministic, and repeated runs produce the same findings. Review the final diff for debug output, dead code, unused imports, accidental generated-file edits, and unrelated formatting changes. Hand off only the implemented behavior, the verification evidence, and any real limitation that remains.
