# Pasing Wellness V0.5 – Live Booking Engine

Enthalten:
- index.html: Live-Buchungsassistent
- stornieren.html: Kundenseitige Stornierung bis 24h vorher
- functions/api/: Cloudflare Pages Functions für Verfügbarkeit, Buchung, Stornierung
- schema.sql: D1-Datenbankschema

## Benötigte Cloudflare-Einstellungen
1. D1-Datenbank erstellen, z. B. `pasing-wellness-bookings`.
2. `schema.sql` in der D1-Konsole ausführen.
3. Pages-Projekt `pasing-wellness` → Settings → Bindings → D1 binding:
   - Variable name: `DB`
   - Database: die eben erstellte Datenbank
4. Environment variables / Secrets:
   - `OPERATOR_EMAIL` = `stark.stefan@gmx.net`
   - `RESEND_API_KEY` = API-Key des Maildienstes Resend
   - `EMAIL_FROM` = z. B. `Pasing Wellness <termine@pasing-wellness.de>` (Domain muss bei Resend verifiziert sein)
   - optional `BOOKING_START_DATE` = tatsächlicher Eröffnungstag im Format `YYYY-MM-DD`
   - optional, aber für Livebetrieb empfohlen: `TURNSTILE_SITE_KEY` und `TURNSTILE_SECRET`
5. Nach Änderungen neu deployen.

## Logik
- Öffnungszeiten: So 10–16 Uhr, Mo/Di 14–20 Uhr.
- Buchbar maximal 14 Tage im Voraus.
- Startzeiten im 15-Minuten-Raster.
- Blockierung = tatsächliche Behandlungsdauer + 15 Minuten Puffer.
- Eine Liege / keine parallelen Buchungen.
- Eröffnungsangebot: Neukunde + Ganzkörpermassage + 60 Min. = 59 €.
- Ohrenkerzen nur als Add-on: +30 Min. / +25 €.
- Zahlung: bar vor Ort.
- Storno: selbstständig bis 24h vor Termin.
- Keine Umbuchung; stornieren und neu buchen.

## Vor öffentlichem Livegang
Datenschutzerklärung und Impressum müssen fertig sein. Das Nachrichtenfeld sollte keine sensiblen Gesundheitsdaten enthalten; der Hinweis dazu ist bereits im Formular enthalten.
