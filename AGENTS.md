# AGENTS.md

Instructions for AI agents working in this repository.

## Project Overview

This is a [ZMK firmware](https://zmk.dev) user configuration repository for a **Sofle split ergonomic keyboard** using the **nice!nano v2** (nRF52840 BLE) controller. Changes here are compiled into `.uf2` firmware files via GitHub Actions.

## Repository Structure

```
config/
  sofle.keymap   # Keymap layers in ZMK device tree syntax
  sofle.conf     # Kconfig feature flags (display, RGB, encoders)
  west.yml       # West manifest — pinned to ZMK v0.3
boards/
  shields/       # Placeholder for any custom shield definitions
zephyr/
  module.yml     # Declares this dir as a Zephyr module (board root)
.github/
  workflows/
    build.yml    # CI: delegates to ZMK's reusable build workflow
build.yaml       # Build matrix — lists board/shield combos to compile
```

## Key Conventions

### Keymap (`config/sofle.keymap`)
- Uses **ZMK device tree syntax** — standard C preprocessor and DTS nodes.
- Layers are defined in `keymap { ... }` inside the `&keymap` node.
- Layer order: `default_layer` (0), `lower_layer` (1), `raise_layer` (2), `adjust_layer` (3).
- `adjust_layer` is a **conditional layer** — active only when both Lower and Raise are held simultaneously.
- Encoder bindings use `sensor-bindings = <...>` inside each layer node.
- Use ZMK behavior references (e.g., `&kp`, `&mo`, `&bt`, `&rgb_ug`) — do not invent new ones without checking ZMK docs.
- Keep left and right halves' key counts consistent with the Sofle layout (58 keys total, 29 per half).

### Config (`config/sofle.conf`)
- Standard **Kconfig** format: `CONFIG_FOO=y` or `# CONFIG_FOO is not set`.
- Comment out options to disable; do not delete them.
- Add new config options only if they are valid ZMK/Zephyr Kconfig symbols.

### Build matrix (`build.yaml`)
- Lists `board` + `shield` pairs under `include:`.
- Shield names for split keyboards follow the pattern `sofle_left` / `sofle_right`.
- The `settings_reset` shield is used to factory-reset BLE bond data — include it only temporarily.
- Do not add boards/shields not present in the ZMK tree unless custom definitions exist under `boards/shields/`.

### West manifest (`config/west.yml`)
- Pinned to ZMK release `v0.3`. Update the `revision:` field deliberately — version bumps can break keymaps.

## CI / Building

- GitHub Actions runs automatically on push and pull requests.
- The workflow delegates entirely to `zmkfirmware/zmk/.github/workflows/build-user-config.yml@v0.3`.
- Firmware artifacts (`.uf2` files) are uploaded as workflow artifacts — download from the Actions run.
- There is no local build toolchain expected; do not add local build scripts unless requested.

## What to Avoid

- Do not modify `.github/workflows/build.yml` unless changing CI triggers or upgrading the ZMK version.
- Do not commit build artifacts or the `.zmk/` directory (it is gitignored).
- Do not add dependencies to `west.yml` beyond what ZMK's own `app/west.yml` provides, unless a specific ZMK module is required.
- Do not rename keymap layers without updating all `&mo` / conditional layer references throughout the file.
