#set document(title: "Kryptografi - Hashing & Kryptering", author: "Skoleassignment")
#set page(paper: "a4", margin: 2cm)
#set text(font: "Arial", size: 11pt, lang: "da")
#set heading(numbering: "1.1")

#align(center)[
  #text(size: 24pt, weight: "bold")[Kryptografi]
  #v(0.5em)
  #text(size: 16pt)[Hashing & Kryptering]
  #v(1em)
  #text(size: 12pt, style: "italic")[Serversideprogrammering III - Skoleassignment]
]

#v(2em)

= Sprint 1: Hashing

== Øvelse 1: Hashing metode kategorier

Kategoriser de 16 hash-metoder i tre kategorier: *Slow*, *Fast*, og *Message Authentication*.

#table(
  columns: (auto, 1fr, auto, auto, auto),
  inset: 8pt,
  align: (center, left, center, center, center),
  fill: (col, row) => if row == 0 { rgb("#e0e0e0") },
  [*\#*], [*Hashing-metode*], [*Slow*], [*Fast*], [*Message Auth*],
  [1], [bcrypt], [X], [], [],
  [2], [scrypt], [X], [], [],
  [3], [Argon2 (i/d/id)], [X], [], [],
  [4], [PBKDF2], [X], [], [],
  [5], [#strike[MD5]], [], [#strike[X]], [],
  [6], [#strike[SHA-1]], [], [#strike[X]], [],
  [7], [SHA-2 (SHA-256/512)], [], [X], [],
  [8], [SHA-3], [], [X], [],
  [9], [BLAKE2], [], [X], [],
  [10], [#strike[CRC32]], [], [#strike[X]], [],
  [11], [HMAC-SHA256], [], [], [X],
  [12], [#strike[HMAC-SHA1]], [], [], [#strike[X]],
  [13], [HMAC-SHA512], [], [], [X],
  [14], [#strike[HMAC-MD5]], [], [], [#strike[X]],
  [15], [CMAC], [], [], [X],
  [16], [GMAC], [], [], [X],
)

#text(size: 10pt, style: "italic")[Markeret med #strike[strikethrough]: Metoder der IKKE længere bør anvendes (obsolete/deprecated)]

#pagebreak()

== Øvelse 2: Hashing metode anvendelsesområder

#table(
  columns: (auto, auto, 1fr),
  inset: 8pt,
  align: (center, left, left),
  fill: (col, row) => if row == 0 { rgb("#e0e0e0") },
  [*\#*], [*Hashing-metode*], [*Brug*],
  [1], [bcrypt], [Password-hashing i web-applikationer. Adaptiv cost factor gør brute-force langsom.],
  [2], [scrypt], [Password-hashing med memory-hardness. Bruges i cryptocurrency (Litecoin).],
  [3], [Argon2 (i/d/id)], [*Bedste valg* til password-hashing (vinder PHC 2015). Argon2id anbefales.],
  [4], [PBKDF2], [Key derivation fra passwords, Wi-Fi WPA2, disk-kryptering. *Bruges i vores email-hashing.*],
  [5], [#strike[MD5]], [*FORÆLDET* - Kun legacy checksums. ALDRIG til sikkerhed.],
  [6], [#strike[SHA-1]], [*FORÆLDET* - Legacy Git commits. Kollisioner demonstreret 2017.],
  [7], [SHA-2], [Digital signatures, TLS/SSL, blockchain, fil-integritet. *Industristandard.*],
  [8], [SHA-3], [Backup til SHA-2, fremtidssikring, høj-sikkerhedsapplikationer.],
  [9], [BLAKE2], [Hurtig fil-hashing, KDF, erstatning for MD5/SHA-1.],
  [10], [#strike[CRC32]], [*IKKE kryptografisk* - kun checksums for fejldetektering.],
  [11], [HMAC-SHA256], [API authentication, JWT tokens, fil-integritet. *Bruges i vores app.*],
  [12], [#strike[HMAC-SHA1]], [*FORÆLDET* - Legacy systemer. Brug HMAC-SHA256.],
  [13], [HMAC-SHA512], [Ekstra sikkerhed hvor længere output ønskes. TLS.],
  [14], [#strike[HMAC-MD5]], [*FORÆLDET* - ALDRIG bruge. MD5 er kryptografisk brudt.],
  [15], [CMAC], [Block cipher-baseret MAC. AES-CMAC i sikkerhedsprotokoller.],
  [16], [GMAC], [Galois MAC - del af AES-GCM. TLS 1.3, høj performance.],
)

== Salt vs Pepper

#table(
  columns: (auto, 1fr, 1fr),
  inset: 8pt,
  align: (left, left, left),
  fill: (col, row) => if row == 0 { rgb("#e0e0e0") },
  [], [*Salt*], [*Pepper*],
  [*Formål*], [Sikrer unikke hashes pr. bruger], [Tilføjer ekstra hemmelighed],
  [*Område*], [Unik per bruger], [Typisk global for alle passwords],
  [*Gemmes?*], [Ja, i databasen], [Nej, gemmes sikkert udenfor (.env)],
  [*Beskytter mod*], [Rainbow tables, duplikat hashes], [Database læk uden pepper],
)

#pagebreak()

== Vores Implementation

*Hashing-metoder brugt i projektet:*

#table(
  columns: (auto, 1fr, auto),
  inset: 8pt,
  fill: (col, row) => if row == 0 { rgb("#e0e0e0") },
  [*Metode*], [*Anvendelse*], [*Fil*],
  [PBKDF2], [Email-hashing med salt + pepper], [`lib/hashing.ts`],
  [bcrypt], [Password-hashing], [`app/actions/auth.ts`],
  [HMAC-SHA256], [Fil-integritet verifikation], [`lib/hashing.ts`],
  [SHA-256], [Generel hashing], [`lib/hashing.ts`],
)

#v(1em)

*Email Hashing (PBKDF2):*
```
Input: user@example.com
Salt: Per-user (32 chars, gemt i DB)
Pepper: Global (gemt i .env, ALDRIG i DB)
Iterations: 100,000
Output: 64 char hex string

Formula: PBKDF2(email, salt+pepper, 100000, 32, sha256)
```

*Password Hashing (bcrypt):*
```
Input: userPassword123
Salt: Auto-generated (included in hash)
Cost Factor: 10
Output: 60 char bcrypt string
```

*File Integrity (HMAC-SHA256):*
```
Input: File content (Buffer)
Key: Random per-file (IKKE hardcoded)
Output: 64 char hex signature

Verificering: Genberegn HMAC og sammenlign
Match: "No contamination detected"
Mismatch: "Contaminated"
```

#pagebreak()

= Sprint 2: Kryptering

== Øvelse 1: Krypterings kategorier

#table(
  columns: (auto, 1fr, 1fr, 1fr),
  inset: 6pt,
  align: (left, left, left, left),
  fill: (col, row) => if row == 0 { rgb("#e0e0e0") },
  [], [*AES*], [*RSA*], [*Hybrid*],
  [*Type*], [Symmetrisk], [Asymmetrisk], [Hybrid (begge)],
  [*Nøgle*], [Én delt hemmelig nøgle], [Nøglepar: public + private], [AES-nøgle krypteret med RSA],
  [*Hastighed*], [Meget hurtig], [Langsom (1000x)], [Hurtig for data, langsom for nøgle],
  [*Sikkerhed*], [Meget sikker (256-bit)], [Sikker (2048+ bit)], [Kombinerer begge],
  [*Brug*], [Fil-kryptering, VPN, TLS], [Signering, nøgleudveksling], [TLS/HTTPS, sikker fil-overførsel],
  [*Nøglestørrelse*], [128/192/256 bit], [2048/3072/4096 bit], [AES: 256, RSA: 2048+],
  [*Fordele*], [Hurtig, hardware-support], [Løser nøgledistribution], [Bedste fra begge],
  [*Ulemper*], [Nøgledistribution svært], [Langsom, små data], [Kompleks implementering],
)

== Øvelse 2: Krypterings begreber

#table(
  columns: (auto, auto, 1fr),
  inset: 8pt,
  fill: (col, row) => if row == 0 { rgb("#e0e0e0") },
  [*\#*], [*Begreb*], [*Brug*],
  [1], [IV], [Tilfældig værdi med krypteringsnøgle. Sikrer forskellig ciphertext hver gang. SKAL være unik.],
  [2], [Operation modes], [Hvordan block cipher håndterer data. ECB (usikker), *CBC* (bruges her), CTR, GCM.],
  [3], [Block cipher], [Algoritme på faste blokstørrelser (AES: 128-bit). Data opdeles i blokke.],
  [4], [IV (CBC)], [Første blok XOR'es med IV, efterfølgende med forrige krypterede blok.],
  [5], [Nonce], ["Number used ONCE" - må ALDRIG genbruges med samme nøgle. Bruges i GCM/CTR.],
)

#pagebreak()

== Hybrid Encryption Flow

*AFSENDER (Third-party app):*
+ Hent RSA public key fra server
+ Generer tilfældig AES-nøgle (256 bit)
+ Generer tilfældig IV (16 bytes)
+ Krypter fil med AES-CBC(nøgle, IV)
+ Beregn HMAC-SHA256 af krypteret data
+ Krypter AES-nøgle med RSA public key
+ Send: krypteret\_fil + krypteret\_nøgle + IV + HMAC

*MODTAGER (Vores web app):*
+ Verificer HMAC for integritet
+ Dekrypter AES-nøgle med RSA private key
+ Dekrypter fil med AES-CBC(nøgle, IV)
+ Gem dekrypteret fil i Files/uploads
+ Generer ny HMAC for lagret fil
+ Gem metadata i fildatabase

== Implementation Komponenter

#table(
  columns: (auto, auto, 1fr),
  inset: 8pt,
  fill: (col, row) => if row == 0 { rgb("#e0e0e0") },
  [*Komponent*], [*Fil*], [*Beskrivelse*],
  [EncryptionService], [`lib/encryption.ts`], [AES-256-CBC, RSA-2048, HMAC-SHA256],
  [KeyManager], [`lib/keys.ts`], [RSA key pair generering og storage],
  [Public Key API], [`/api/external/public-key`], [Endpoint for third-party],
  [Upload API], [`/api/external/upload`], [Modtager krypterede filer],
  [Third-Party Sender], [`third-party-sender/`], [Ekstern app der sender],
)

#v(2em)

#align(center)[
  #box(stroke: 1pt, inset: 10pt)[
    *Test Resultater:* Valid Upload: PASS | Tampered HMAC: PASS | Invalid RSA: PASS
  ]
]
