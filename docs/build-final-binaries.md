# Building final binaries and platform packages

These instructions describe the local, unsigned release-style build flow for Azure Data Studio from this repository.

The authoritative tasks live in:

- `build/gulpfile.vscode.js`
- `build/gulpfile.vscode.linux.js`
- `build/gulpfile.vscode.win32.js`
- `build/darwin/create-universal-app.ts`

## Before you start

From the repository root:

```bash
yarn
```

Useful notes:

- `yarn gulp --tasks` prints the available gulp tasks.
- `yarn gulp vscode-<platform>-<arch>-min` is the recommended one-step release-style build. It runs `compile-build`, `compile-extensions-build`, `minify-vscode`, and then packages the app.
- `yarn gulp vscode-<platform>-<arch>-min-ci` only packages an already prepared build. Use it only when `out-build/`, `.build/extensions/`, and `out-vscode-min/` already exist.
- The packaged application folders are written one level above the repository root, for example `../azuredatastudio-linux-x64` or `../azuredatastudio-win32-x64`.
- Platform-specific installers and packages are written under `.build/`.

## Platform and architecture matrix

| Platform | Packaged app task | Package/installer tasks |
| --- | --- | --- |
| Linux | `ia32`, `x64`, `armhf`, `arm64` | `x64`, `armhf`, `arm64` |
| macOS | `x64`, `arm64` | `universal` is created by combining `x64` and `arm64` outputs |
| Windows | `ia32`, `x64`, `arm64` | `ia32`, `x64`, `arm64` |

## Linux

Build the packaged application folder:

```bash
yarn gulp vscode-linux-x64-min
```

That produces:

```text
../azuredatastudio-linux-x64/
```

To turn that packaged build into a Linux distribution package, run the matching package task for the same architecture.

### DEB

Prerequisites: `fakeroot` and `dpkg-deb`.

```bash
yarn gulp vscode-linux-x64-prepare-deb
yarn gulp vscode-linux-x64-build-deb
```

Output:

```text
.build/linux/deb/amd64/deb/*.deb
```

### RPM

Prerequisite: `rpmbuild`.

```bash
yarn gulp vscode-linux-x64-prepare-rpm
yarn gulp vscode-linux-x64-build-rpm
```

Output:

```text
.build/linux/rpm/x86_64/*.rpm
```

### Snap

Prerequisite: `snapcraft`.

```bash
yarn gulp vscode-linux-x64-build-snap
```

Output:

```text
.build/linux/snap/x64/azuredatastudio-x64/
```

The final `.snap` artifact is created by `snapcraft` inside that build directory.

Replace `x64` with `armhf` or `arm64` when building those package variants. Linux package tasks are only defined for `x64`, `armhf`, and `arm64`.

## macOS

Build an unsigned packaged app for one architecture:

```bash
yarn gulp vscode-darwin-x64-min
```

or:

```bash
yarn gulp vscode-darwin-arm64-min
```

Outputs:

```text
../azuredatastudio-darwin-x64/Azure Data Studio.app
../azuredatastudio-darwin-arm64/Azure Data Studio.app
```

### Universal macOS app

To create a universal build, first build both architecture-specific app bundles and then combine them:

```bash
yarn gulp vscode-darwin-x64-min
yarn gulp vscode-darwin-arm64-min
VSCODE_ARCH=universal node build/darwin/create-universal-app.js ..
```

Output:

```text
../azuredatastudio-darwin-universal/Azure Data Studio.app
```

The repository build produces `.app` bundles. Signing, notarization, and archive publishing are handled separately by the macOS signing helpers and pipeline scripts when those credentials are available.

## Windows

Build the packaged application folder:

```bash
yarn gulp vscode-win32-x64-min
```

Output:

```text
../azuredatastudio-win32-x64/
```

To build the updater helper, installers, and portable archive for the same architecture:

```bash
yarn gulp vscode-win32-x64-inno-updater
yarn gulp vscode-win32-x64-user-setup
yarn gulp vscode-win32-x64-system-setup
yarn gulp vscode-win32-x64-archive
```

Outputs:

```text
.build/win32-x64/user-setup/
.build/win32-x64/system-setup/
.build/win32-x64/archive/azuredatastudio-win32-x64.zip
```

Replace `x64` with `ia32` or `arm64` as needed.

The setup tasks create unsigned installers by default. If the signing environment is configured, you can pass `--sign` to the setup tasks, matching the CI flow.
