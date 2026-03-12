# Regel: config-reference.md up-to-date houden

Wanneer je **één of meer van de volgende bestanden** aanpast, **moet** je daarna `config-reference.md` bijwerken zodat het document de werkelijke toestand van de firmware weerspiegelt:

- `config/sofle.keymap` — lagenstructuur, toetsbindingen, encoder-bindingen
- `config/sofle.conf` — ingeschakelde features (display, RGB, encoders, ZMK Studio)
- `build.yaml` — welke board/shield-combinaties gebouwd worden
- `config/west.yml` — ZMK versie / community modules

## Wat bijwerken in config-reference.md

| Gewijzigd bestand | Te updaten secties in config-reference.md |
|---|---|
| `sofle.keymap` — layer inhoud | De betreffende layer-sectie (toetsen ASCII-art + encodertabellen) |
| `sofle.keymap` — layer volgorde of namen | "Lagenstructuur" tabel + alle layer-headers |
| `sofle.keymap` — encoder-bindingen | Encoder-tabellen van de betreffende layer |
| `sofle.conf` — feature in/uitschakelen | "Firmware & Tooling" tabel en/of "RGB & Display gedrag" sectie |
| `build.yaml` | "Firmware & Tooling" tabel (ZMK Studio, modules) indien relevant |
| `config/west.yml` — revisie | "Firmware & Tooling" tabel — ZMK versie |

## Regels

- Pas **alleen** de secties aan die daadwerkelijk veranderd zijn; laat de rest intact.
- Gebruik dezelfde notatie en opmaak als de bestaande inhoud (ASCII-art voor keymaps, tabellen voor encoders).
- Als een toets transparant is (valt door naar een lagere layer), noteer dit als `—`.
- Verwijder openstaande vragen uit de "Openstaande vragen / aandachtspunten" sectie zodra ze opgelost zijn door jouw wijziging.
- Voeg nieuwe openstaande vragen toe als jouw wijziging iets introduceert dat nog hardware-verificatie vereist.
