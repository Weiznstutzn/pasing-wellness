# Hinano 2.0 – Konzeptvorschau

Arbeitsstand: 27.08.2026

Diese ZIP basiert auf dem zuletzt funktionierenden Pasing-Wellness-Projekt.
Die funktionierenden Cloudflare-Functions, D1-Buchungslogik und E-Mail-Funktionen
wurden bewusst nicht unnötig umgebaut.

## Was geändert wurde

- Neue Startseite `index.html` für „Hinano 2.0“
- Bewährtes Pasing-Wellness-Design weiterverwendet:
  - warme Beige-/Sandtöne
  - dunkles Braun
  - dezentes Gold
  - großer Hero
  - viel Weißraum
- Standort auf Isartor / Zweibrückenstraße 8 ausgerichtet
- Noch keine finalen Preise oder Öffnungszeiten erfunden
- Keine Mitarbeiter als fest zugesagt dargestellt
- Treatwell-Reputation nur mit ausdrücklichem Übertragungs-Hinweis gezeigt
- Gutscheine und Mehrpersonen-Buchung als Ausbaupfad sichtbar gemacht
- `robots=noindex,nofollow`, weil es eine Konzeptvorschau ist

## Bestehende Technik bleibt erhalten

Die bisherige funktionierende Pasing-Wellness-Startseite wurde vor dem Umbau als

`booking-prototype.html`

gesichert.

Außerdem bleiben unverändert erhalten:

- `functions/api/availability.js`
- `functions/api/book.js`
- `functions/api/cancel.js`
- `functions/api/config.js`
- `functions/_common.js`
- `schema.sql`
- `stornieren.html`

Wichtig: Diese Backend-Dateien enthalten aktuell noch Pasing-Wellness-Leistungen,
Preise, Öffnungszeiten und Mailtexte. Sie werden erst in Phase B nach sicherem
Übernahme-GO auf Hinano umgebaut. Die neue Hinano-Startseite ruft diese Buchung
bewusst noch nicht auf.

## Empfohlene Phasen

### Phase A – jetzt
- Relaunch-Design und Seitenstruktur vorbereiten
- Name/Domain/Google/Treatwell/Reviews rechtlich und technisch klären
- Team und Verfügbarkeiten klären
- Kosten + Personal + Deckungsbeiträge rechnen
- endgültige Angebotsstruktur definieren

### Phase B – nach sicherem GO
- Backend-Datenmodell auf mehrere Therapeut:innen erweitern
- individuelle Arbeitszeiten / Pausen / Liegen oder Räume
- Leistungen und Preise final eintragen
- Mailtexte, Absender und Adresse auf Hinano umstellen
- Storno-/No-Show-Regel finalisieren
- Telefonnummer, Domain, E-Mail, Google/Treatwell sauber übernehmen

### Phase C – Launch
- `noindex` entfernen
- Impressum und Datenschutz final
- Analytics / Consent nur falls benötigt
- SEO, Google Business, Treatwell-Verlinkung
- echte Teamfotos / Profile
- Live-Test Buchung + Storno + Mail + Doppelbuchung + Mobile

### Phase D – Ausbau
- Gutscheine mit Nummer + PDF + Status offen/eingelöst
- Erinnerungsmails
- Bewertungsanfrage
- Wiederbuchung
- Online-Zahlung
- Stammkunden- und Reaktivierungsflows
- KPI-Auswertung

## GitHub-Hinweis

Wenn dieses Paket auf den `main`-Branch des aktuell mit Cloudflare verbundenen
Repositories hochgeladen wird, kann die Vorschau auf der bestehenden Domain live
werden. Die Seite ist zwar als Konzeptvorschau gekennzeichnet und auf `noindex`,
aber dennoch öffentlich abrufbar.

Für reine interne Tests ist deshalb ein separater Preview-Branch oder ein separates
Cloudflare-Pages-Projekt sicherer.

## Update 13.09.2026 – Hinano Hands Finder

- Interaktiver Hands Finder als Konzeptdemo direkt in `index.html` integriert.
- Einstieg über gewünschtes Gefühl statt Massageart.
- Fünf Signature-Welten: Achtsamkeit, Energie, Balance, Entspannung, Regeneration.
- Aktuelle Konzeptprofile integriert: Sissi (Balance), Nang (Entspannung), Weza (Regeneration).
- Vier kurze Fragen erzeugen ein gewichtetes Matching und zeigen zwei passende Persönlichkeiten.
- Noch keine KI und keine externe Abhängigkeit: Matching läuft vollständig im Browser.
- Treatments, Prozentwerte und Profile sind ausdrücklich Demo-/Konzeptstand und müssen vor Livegang finalisiert werden.
