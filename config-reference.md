# ZMK Config Reference — Sofle RGB

## Hardware

| Component | Spec |
|---|---|
| Controller | nice!nano v2 (nRF52840), beide helften |
| Displays | SSD1306 128×32 OLED, verticaal gemonteerd |
| LEDs | Per-key RGB + underglow (Sofle RGB) |
| Encoders | 2× rotary encoder (links + rechts) |
| Connectiviteit | Draadloos BLE split + USB naar Windows host |

---

## Firmware & Tooling

| Setting | Waarde |
|---|---|
| Firmware | ZMK v0.3 |
| ZMK Studio | Ingeschakeld + permanent unlocked (`CONFIG_ZMK_STUDIO=y`, `CONFIG_ZMK_STUDIO_LOCKING=n`) |
| Community module | zmk-nice-oled@v0.3/dev |
| Shields | sofle_left nice_oled / sofle_right nice_oled |

---

## RGB & Display gedrag

### Power source gedrag

| Conditie | Per-key LEDs | Displays |
|---|---|---|
| Op USB | ✅ Aan | ✅ Aan |
| Op batterij | ❌ Uit | ❌ Uit |

### Kleur

- **Per-key LEDs:** Neon pink = HSB `(300°, 100%, 100%)` — aan te passen op basis van visueel resultaat
- **Underglow:** Magenta/purple = HSB `(305°, 100%, 100%)` — standaard opstartwaarden ingesteld via:
  - `CONFIG_ZMK_RGB_UNDERGLOW_HUE_START=305` — Hue (kleur op het kleurenwiel, 0–359°)
  - `CONFIG_ZMK_RGB_UNDERGLOW_SAT_START=100` — Saturatie (kleurverzadiging, 0–100%)
  - `CONFIG_ZMK_RGB_UNDERGLOW_BRT_START=100` — Brightness (helderheid, 0–100%)

---

## OLED Configuration

Deze configuratie maakt gebruik van de **zmk-nice-oled** custom module (mctechnology17) voor uitgebreide OLED widget ondersteuning.

### General Display Settings

| Config Option | Waarde | Beschrijving |
|---|---|---|
| `CONFIG_ZMK_DISPLAY_WORK_QUEUE_DEDICATED` | `y` | Dedicated work queue voor betere display prestaties |
| `CONFIG_ZMK_DISPLAY_STATUS_SCREEN_CUSTOM` | `y` | Activeert custom status screen ondersteuning |
| `CONFIG_NICE_OLED_ON` | `y` | Schakelt de zmk-nice-oled module in |
| `CONFIG_NICE_OLED_SHOW_SLEEP_ART_ON_IDLE` | `y` | Toont sleep art wanneer het display idle gaat |

**Opmerking:** Display rotatie voor verticaal gemonteerde OLED displays moet geconfigureerd worden via devicetree overlays, niet via Kconfig. `CONFIG_LV_DISPLAY_ROTATION_90` is geen valide ZMK Kconfig symbool.

### Display Power Management & Stability

| Config Option | Waarde | Beschrijving |
|---|---|---|
| `CONFIG_ZMK_DISPLAY_BLANK_ON_IDLE` | `y` | Display blankt automatisch bij inactiviteit en kan weer ontwaken (fix voor display not waking up) |
| `CONFIG_ZMK_IDLE_TIMEOUT` | `600000` | Tijd (in ms) voordat display blankt — 10 minuten |
| `CONFIG_ZMK_SLEEP` | `y` | Activeert deep sleep ondersteuning voor energiebesparing |
| `CONFIG_ZMK_DISPLAY_INVERT` | `n` | Display inversie uitgeschakeld (voorkomt garbled pixels na power cycling) |

**Opmerking:** Deep sleep timeout configuratie moet gedaan worden met `CONFIG_ZMK_IDLE_SLEEP_TIMEOUT` indien nodig. Het symbool `CONFIG_ZMK_SLEEP_TIMEOUT` bestaat niet in ZMK.

### Status Widgets (Beide helften)

| Config Option | Waarde | Beschrijving |
|---|---|---|
| `CONFIG_NICE_OLED_WIDGET_STATUS` | `y` | Batterij status en verbindingsmode (BLE/USB) op beide displays |

### Central Side Widgets (Linker helft)

| Config Option | Waarde | Beschrijving |
|---|---|---|
| `CONFIG_NICE_OLED_WIDGET_LAYER` | `y` | Toont de actieve layer naam |
| `CONFIG_NICE_OLED_WIDGET_WPM` | `n` | WPM (words per minute) widget uitgeschakeld |
| `CONFIG_NICE_OLED_WIDGET_WPM_NUMBER` | `n` | Numerieke WPM waarde weergave uitgeschakeld |

### Peripheral Side Widgets (Rechter helft)

| Config Option | Waarde | Beschrijving |
|---|---|---|
| `CONFIG_NICE_OLED_WIDGET_ANIMATION_PERIPHERAL` | `y` | Activeert animatie ondersteuning op peripheral |
| `CONFIG_NICE_OLED_WIDGET_ANIMATION_PERIPHERAL_SMART_BATTERY` | `y` | Slimme batterij animatie op peripheral |
| `CONFIG_NICE_OLED_WIDGET_ANIMATION_PERIPHERAL_GEM` | `n` | Gem animatie expliciet uitgeschakeld — laat spaceman animatie toe |
| `CONFIG_NICE_OLED_WIDGET_ANIMATION_PERIPHERAL_SPACEMAN` | `y` | Spaceman/astronaut animatie op peripheral |

**Opmerking:** `CONFIG_NICE_OLED_WIDGET_ANIMATION_PERIPHERAL_WPM` is **niet** beschikbaar op de peripheral zijde. In de split keyboard architectuur verwerkt de peripheral (rechter helft) geen keycodes lokaal — alle toetsaanslagen worden naar de central (linker helft) gestuurd. WPM tracking vereist toegang tot keycode events die alleen op de central zijde beschikbaar zijn. Poging om de peripheral WPM widget in te schakelen resulteert in linker errors tijdens compilatie. Alleen de central zijde heeft WPM widget ondersteuning.

### HID Indicators

| Config Option | Waarde | Beschrijving |
|---|---|---|
| `CONFIG_ZMK_HID_INDICATORS` | `y` | Activeert ZMK HID indicatoren ondersteuning (vereist voor OLED HID widget) |
| `CONFIG_NICE_OLED_WIDGET_HID_INDICATORS` | `y` | HID status indicatoren (Caps Lock, Num Lock, Scroll Lock, etc.) |
| `CONFIG_NICE_OLED_WIDGET_MODIFIERS_INDICATORS_FIXED_SYMBOL_MACOS` | `n` | macOS-stijl modifier symbolen weergave op OLED (Ctrl, Alt, Cmd, Shift) |
| `CONFIG_NICE_OLED_WIDGET_MODIFIERS_INDICATORS_FIXED_SYMBOL_WINDOWS` | `y` | Windows-stijl modifier symbolen weergave op OLED (Ctrl, Alt, Win, Shift) |

---

## Display Widgets

### Linker helft (centraal)

| Widget | Beschrijving |
|---|---|
| Status | Batterij percentage en verbindingsmode (BLE/USB) |
| Layer naam | Naam van de actieve layer (Base, Lower, Raise, Adjust) |
| HID Indicatoren | Status van Caps Lock, Num Lock, etc. |

### Rechter helft (peripheral)

| Widget | Beschrijving |
|---|---|
| Status | Batterij percentage en verbindingsmode |
| Batterij animatie | Visuele batterij status animatie |
| Spaceman animatie | Astronaut animatie (idle animation) |

**Opmerking:** WPM widget is niet beschikbaar op peripheral zijde (zie OLED Configuration sectie voor uitleg).

---

## Encoder notatie

Encoder shortcuts in dit document gebruiken twee notaties:

- `A + B` — druk A en B **tegelijk** in, dan loslaten
- `A + B, C` — druk A en B **tegelijk** in, laat los, druk dan **C** apart in

---

## Keymap

### Lagenstructuur

| Layer | Naam | Activatie |
|---|---|---|
| 0 | Base | Standaard |
| 1 | Lower | `LOWER` thumb key (links) |
| 2 | Raise | `RAISE` thumb key (rechts) |
| 3 | Adjust | `LOWER` + `RAISE` tegelijk |

---

### Layer 0 — Base

#### Toetsen (zonder SHIFT)

```
`    1    2    3    4    5                        6    7    8    9    0    =
ESC  q    w    e    r    t                        y    u    i    o    p    BKSP
TAB  a    s    d    f    g                        h    j    k    l    ;    '
SHF  z    x    c    v    b    [L-ENC]  [R-ENC]  n    m    ,    .    /    SHF
          CTRL ALT  GUI  LOWER ENTER   SPACE RAISE GUI  ALT  CTRL
```

#### Toetsen (met SHIFT)

```
~    !    @    #    $    %                        ^    &    *    (    )    +
ESC  Q    W    E    R    T                        Y    U    I    O    P    DEL
TAB↩ A    S    D    F    G                        H    J    K    L    :    '
SHF  Z    X    C    V    B    [L-ENC]  [R-ENC]  N    M    <    >    ?    SHF
          CTRL ALT  GUI  LOWER ENTER   SPACE RAISE GUI  ALT  CTRL
```

> `TAB↩` = TAB BACK (Shift+Tab)

#### Encoders — zonder SHIFT

| Encoder | Actie | Shortcut | Beschrijving |
|---|---|---|---|
| Links | Press | `CTRL + ALT + F2` | Mute/unmute mic |
| Links | Rotate left | `CTRL + WIN + LEFT` | Previous workspace |
| Links | Rotate right | `CTRL + WIN + RIGHT` | Next workspace |
| Rechts | Press | `CTRL + ALT + P` | Play/pause |
| Rechts | Rotate left | `WIN + CTRL + ALT + DOWN` | Volume down 5% |
| Rechts | Rotate right | `WIN + CTRL + ALT + UP` | Volume up 5% |

#### Encoders — met SHIFT

| Encoder | Actie | Shortcut | Beschrijving |
|---|---|---|---|
| Links | Press | `WIN + \`` | Terminal |
| Links | Rotate left | `WIN + SHIFT, [` | Decrease panel width |
| Links | Rotate right | `WIN + SHIFT, ]` | Increase panel width |
| Rechts | Press | `WIN + \`` | Terminal |
| Rechts | Rotate left | `WIN + SHIFT, '` | Decrease panel height |
| Rechts | Rotate right | `WIN + SHIFT, ;` | Increase panel height |

---

### Layer 1 — Lower (Symbols / F-keys)

#### Toetsen (zonder SHIFT)

```
F1   F2   F3   F4   F5   F6                       F7   F8   F9   F10  F11  F12
ESC  —    —    —    —    —                        —    —    —    —    —    —
TAB  -    _    \    |    —                        —    [    ]    {    }    —
SHF  —    —    —    —    —    [L-ENC]  [R-ENC]  —    —    —    —    —    SHF
          CTRL ALT  GUI  RAISE ENTER   SPACE LOWER GUI  ALT  CTRL
```

> Lege cellen = transparant (valt door naar Base layer)

#### Toetsen (met SHIFT)

Volledig leeg / transparant.

#### Encoders — zonder SHIFT

| Encoder | Actie | Shortcut | Beschrijving |
|---|---|---|---|
| Links | Press | `CTRL + F` | Find |
| Links | Rotate left | `SHIFT + F3` | Find previous |
| Links | Rotate right | `F3` | Find next |
| Rechts | Press | `F5` | Debug/continue |
| Rechts | Rotate left | — | — |
| Rechts | Rotate right | `F10` | Debug Step Over |

#### Encoders — met SHIFT

| Encoder | Actie | Shortcut | Beschrijving |
|---|---|---|---|
| Links | Press | — | — |
| Links | Rotate left | `SHIFT + F8` | Previous breakpoint |
| Links | Rotate right | `F8` | Next breakpoint |
| Rechts | Press | — | — |
| Rechts | Rotate left | — | — |
| Rechts | Rotate right | `F11` | Debug Step Into |

---

### Layer 2 — Raise (BT / Navigation)

#### Toetsen (zonder SHIFT)

```
—    —    —    —    —    —                        —    —    —    —    —    —
—    —    PREV NEXT —    —                        —    PREV UP   NEXT —    —
          WS   WS                                      WORD      WORD

> PREV WS = `WIN + CTRL + LEFT`, NEXT WS = `WIN + CTRL + RIGHT`
—    CUT  COPY PST  PST  —                        —    LEFT DOWN RGHT —    —
          PLAIN
—    REDO UNDO DELL SHF  —    [L-ENC]  [R-ENC]  —    PGDN —    PGUP —    —
          LINE LOCK
          CTRL ALT  GUI  LOWER ENTER   SPACE RAISE GUI  ALT  CTRL
```

> Afkortingen: PREV WS = Previous workspace, NEXT WS = Next workspace, PREV WORD = Previous word, NEXT WORD = Next word, PST PLAIN = Paste plain text, DELL LINE = Delete line, SHF LOCK = Shift Lock

#### Toetsen (met SHIFT)

Volledig leeg / transparant.

#### Encoders

Alle encoder acties op Lower layer: leeg (geen binding).

---

### Layer 3 — Adjust (Settings)

Activatie: `LOWER` + `RAISE` tegelijk ingedrukt houden.

#### Toetsen (zonder SHIFT)

```
—    RHUE RSAT RBRT —    —                        —    —    —    —    —    —
     +    +    +
—    RHUE RSAT RBRT RTOG REFF                     —    BT0  BT1  BT2  BT3  BTCLR
     -    -    -
—    —    —    —    —    —                        —    —    —    —    —    —
—    —    —    —    —    —    [L-ENC]  [R-ENC]  —    —    —    —    —    —
          CTRL ALT  GUI  LOWER ENTER   SPACE RAISE GUI  ALT  CTRL
```

> `RHUE+/-` = RGB Hue up/down, `RSAT+/-` = RGB Saturation up/down, `RBRT+/-` = RGB Brightness up/down, `RTOG` = RGB Toggle, `REFF` = RGB Effect next, `BT0–BT3` = Bluetooth profiel 0–3, `BTCLR` = Bluetooth profiel wissen

#### Toetsen (met SHIFT)

Volledig leeg / transparant.

#### Encoders

Alle encoder acties op Adjust layer: leeg (geen binding).

---

## Openstaande vragen / aandachtspunten

- [ ] Neon pink exacte HSB waarde bevestigen op hardware (startwaarde: H=300, S=100, B=100)
- [ ] `WIN + \`` in encoder: backtick karakter bevestigen (kan platform-afhankelijk zijn)
