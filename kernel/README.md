# kernel — the vendored kernel staging pin

`primmel-1.19.0-pr93-afe9bd5.tgz` is the npm-pack build of
primmel/primmel-ts PR #93 head `afe9bd5` (the v1 release line +
the `preparation`/`stimulus` conformance_test constructs,
primmel/primmel-ts#92), vendored byte-identical from the pinned
`@oimlsmart/primmel-packages` content package's own `vendor/`
(sha256 10ea6fffabae94de6889e484a5d2d65d774b5a5fa47ee1f0005e4a174ea1f468).

Why committed: the construct is unreleased — the content package's
peer floor is `@primmel/primmel >=1.20.0`, unpublished; the published
1.19.0 silently parse-skips the R 60-2 programs (forward-compat), which
would bundle them away. A `github:primmel/primmel-ts#<sha>` dep cannot
install (yarn-berry monorepo; npm has no subdirectory git-dep support),
so the staging pin rides as the tarball, the model-library `vendor/`
idiom. `package.json` depends on it as
`file:kernel/primmel-1.19.0-pr93-afe9bd5.tgz`; the editor resolves the
same install through its `@primmel/primmel ^1.18.0` peer, so the
server-side bundler and the client-side viewer parse with the same
kernel.

Retires at the kernel's 1.20.0 publish: the dependency returns to a
published range (`^1.20.0`) and this directory is deleted.
