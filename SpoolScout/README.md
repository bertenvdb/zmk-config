# SpoolScout

React Native app for managing 3D printing filament spools via a self-hosted [Spoolman](https://github.com/Donkie/Spoolman) instance.

## Features

- **Spool management** — full CRUD against Spoolman: list, create, edit, delete
- **NFC read/write** — OpenSpool 1.0 format with `spoolman_id` extension; supports NTAG 215/216 (rejects NTAG 213)
- **Foreground NFC scan** — Quick Action card appears when a tag is scanned while the app is open
- **Background NFC launch** — scanning a tag while the app is closed opens it directly to the Quick Action card
- **Quick Action card** — update remaining weight, change location, set/unset active spool in Moonraker
- **Moonraker integration** — optional; active-spool tracking is hidden when not configured
- **Manufacturer brand overrides** — map Spoolman vendor names to BambuStudio-compatible brand strings for NFC tags

## Requirements

- Android 8.0+ (API 26+) — primary platform
- Node.js 22+
- JDK 17
- Android Studio + Android SDK

> iOS is not supported in v1 (Apple restricts background NFC launch for `application/json` MIME records).

## Development setup

```bash
# Install JS dependencies
npm install

# Start Metro bundler
npx react-native start

# Build and deploy to connected device / emulator
npx react-native run-android
```

## Building an APK locally

```bash
cd android
./gradlew assembleRelease
# Output: android/app/build/outputs/apk/release/app-release.apk
```

## Creating a release

Push a version tag — GitHub Actions builds the APK and publishes a GitHub Release automatically:

```bash
git tag v1.0.0
git push origin v1.0.0
```

The release APK is signed with the debug key by default (fine for sideloading). To use a production keystore, add these four repository secrets:

| Secret | Description |
|--------|-------------|
| `KEYSTORE_BASE64` | `base64 -w0 your-release.keystore` |
| `KEYSTORE_PASSWORD` | Keystore password |
| `KEY_ALIAS` | Key alias |
| `KEY_PASSWORD` | Key password |

Generate a keystore:
```bash
keytool -genkey -v \
  -keystore spoolscout-release.keystore \
  -alias spoolscout \
  -keyalg RSA -keysize 2048 -validity 10000
```

## Configuration

Open the **Settings** tab and enter:

- **Spoolman URL** (required) — e.g. `http://192.168.1.10:7912`
- **Moonraker URL** (optional) — e.g. `http://192.168.1.10:7125`

## Tech stack

| Concern | Package |
|---------|---------|
| Framework | React Native 0.85.3 (bare CLI) |
| Language | TypeScript 5 |
| Navigation | React Navigation 7 |
| NFC | react-native-nfc-manager |
| Storage | @react-native-async-storage/async-storage |
| Build | Gradle |
