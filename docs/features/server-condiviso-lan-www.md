# Piano Feature: Server condiviso LAN/WWW

## Contesto

L'applicazione attuale e' una SPA React/Vite che simula piu' utenti usando piu' schede dello stesso browser. Lo stato della sessione e' salvato in `localStorage`, l'identita' del player in `sessionStorage`, e la sincronizzazione tra viste avviene tramite eventi `storage` piu' polling.

Questo approccio funziona per demo locali sullo stesso browser, ma non permette a piu' persone reali di partecipare dai propri dispositivi. La nuova funzionalita' deve trasformare l'app in una sessione condivisa raggiungibile in rete locale o, in futuro, via WWW.

## Obiettivo

Il facilitatore deve poter avviare un server dal proprio computer e condividere un indirizzo con il team, per esempio:

```text
http://192.168.1.42:3000
```

I partecipanti aprono l'indirizzo dal proprio browser, inseriscono nome e codice sessione oppure usano un link diretto, e partecipano alla stessa sessione in tempo reale.

## Esperienza Utente Desiderata

1. Il facilitatore lancia il server con un comando semplice.
2. L'app mostra il link locale, il codice sessione e un QR code.
3. I partecipanti si collegano dallo stesso Wi-Fi/VPN.
4. Ogni partecipante usa il proprio dispositivo o browser.
5. Tutti vedono la stessa sessione aggiornata in tempo reale.
6. I voti restano nascosti fino al reveal.
7. Se un partecipante ricarica la pagina, puo' rientrare nella stessa sessione.
8. Solo il facilitatore puo' controllare storie, votazioni, reveal, stime e chiusura sprint.

## Ambito MVP

La prima versione deve supportare:

- server Node.js locale;
- frontend React servito dal server;
- comunicazione realtime tra client e server;
- creazione sessione dal facilitatore;
- join dei partecipanti tramite codice sessione;
- aggiornamento live di partecipanti, storie, voti ricevuti e risultati;
- voti nascosti fino al reveal;
- riconnessione base dopo refresh;
- comando di avvio unico per il facilitatore;
- stampa in console degli indirizzi locali disponibili.

Per l'MVP, le sessioni possono essere conservate in memoria. Lo storico puo' restare semplice, ma la direzione consigliata e' spostarlo lato server.

## Fuori Ambito MVP

Questi aspetti sono utili ma possono arrivare dopo:

- autenticazione completa;
- persistenza robusta con database;
- deploy pubblico con dominio e HTTPS;
- gestione multi-tenant avanzata;
- permessi granulari;
- export CSV/JSON;
- dashboard amministrativa;
- inviti via email.

## Architettura Proposta

### Backend

Usare Node.js con:

- `express` per servire API e frontend buildato;
- `socket.io` per sincronizzazione realtime;
- session store server-side in memoria per MVP;
- persistenza opzionale su file JSON o SQLite per storico e sessioni.

Il server deve ascoltare su `0.0.0.0`, non solo su `localhost`, cosi' e' raggiungibile dagli altri dispositivi nella rete locale.

### Frontend

Il frontend React resta la base dell'applicazione, ma non deve piu' considerare `localStorage` come sorgente autorevole della sessione.

Lo stato condiviso deve arrivare dal server tramite snapshot iniziale ed eventi realtime.

### Struttura File Proposta

```text
server/
  index.js
  network.js
  sessionStore.js
  socketHandlers.js

src/
  services/
    realtimeClient.js
  utils/
    clientIdentity.js
```

## Stato Applicativo

### Stato Server

Il server diventa la sorgente autorevole per:

- sessioni;
- player;
- storie;
- fase corrente;
- voti;
- timer;
- risultati;
- storico sprint.

### Stato Browser

Il browser deve conservare solo dati locali minimi:

- `playerId`;
- `sessionId`;
- eventuale token anonimo di rientro;
- preferenze UI non critiche, come tema.

## Modello Dati

```js
{
  id,
  hostId,
  createdAt,
  phase: 'lobby' | 'voting' | 'revealed' | 'finished',
  timerLimit,
  timerStart,
  currentStoryId,
  players: [
    {
      id,
      name,
      role: 'facilitator' | 'player',
      connected,
      lastSeen
    }
  ],
  stories: [
    {
      id,
      title,
      desc,
      status: 'pending' | 'voting' | 'revealed' | 'done',
      votes: {
        [playerId]: value
      },
      estimate
    }
  ]
}
```

## Eventi Realtime

### Client verso Server

```text
create_session
join_session
resume_session
leave_session
add_story
start_voting
cast_vote
reveal_votes
accept_estimate
revote
finish_sprint
```

### Server verso Client

```text
session_snapshot
player_joined
player_left
story_added
voting_started
vote_status_changed
votes_revealed
estimate_accepted
sprint_finished
error
```

## Regole di Sicurezza e Validazione

Il server deve validare ogni azione:

- solo il facilitatore puo' aggiungere storie;
- solo il facilitatore puo' avviare una votazione;
- solo il facilitatore puo' rivelare i voti;
- solo il facilitatore puo' accettare una stima;
- solo il facilitatore puo' terminare lo sprint;
- un player puo' votare solo per se stesso;
- non si puo' votare fuori dalla fase `voting`;
- i valori dei voti non devono essere inviati ai client prima del reveal;
- un client non deve poter modificare direttamente lo stato completo della sessione.

## Privacy dei Voti

Durante la fase `voting`, il server deve inviare ai client solo lo stato di completamento:

```js
{
  playerId: 'ABC123',
  hasVoted: true
}
```

Il valore reale del voto deve essere incluso negli snapshot solo quando la sessione passa a `revealed`.

## Piano di Implementazione

### 1. Preparazione Backend

- Aggiungere dipendenze `express` e `socket.io`.
- Creare la cartella `server/`.
- Creare `server/index.js`.
- Configurare il server su host `0.0.0.0`.
- Servire gli asset statici da `dist`.
- Aggiungere endpoint health check, per esempio `GET /health`.

### 2. Rilevamento IP Locale

- Creare `server/network.js`.
- Leggere le interfacce di rete con il modulo Node.js `os`.
- Filtrare indirizzi IPv4 non interni.
- Stampare in console gli URL disponibili.

Output desiderato:

```text
Planning Poker server avviato

Locale:
http://localhost:3000

Rete locale:
http://192.168.1.42:3000
http://10.0.0.12:3000
```

### 3. Session Store

- Creare `server/sessionStore.js`.
- Spostare lato server la logica di:
  - creazione sessione;
  - join sessione;
  - aggiunta storie;
  - avvio votazione;
  - voto player;
  - reveal;
  - accettazione stima;
  - revote;
  - fine sprint.
- Restituire snapshot differenziati in base alla fase, nascondendo i voti quando necessario.

### 4. Socket Handlers

- Creare `server/socketHandlers.js`.
- Associare ogni socket a una session room.
- Usare `socket.join(sessionId)` per inviare update solo ai partecipanti della sessione.
- Gestire `disconnect` marcando il player come non connesso.
- Gestire `resume_session` per rientrare dopo refresh.

### 5. Client Realtime

- Creare `src/services/realtimeClient.js`.
- Centralizzare la connessione Socket.IO.
- Esporre funzioni di alto livello:
  - `createSession`;
  - `joinSession`;
  - `resumeSession`;
  - `addStory`;
  - `startVoting`;
  - `castVote`;
  - `revealVotes`;
  - `acceptEstimate`;
  - `revote`;
  - `finishSprint`.
- Gestire `session_snapshot` aggiornando lo stato React.

### 6. Identita' Client

- Creare `src/utils/clientIdentity.js`.
- Salvare in browser:
  - `playerId`;
  - `sessionId`;
  - `role`;
  - `name`.
- Usare questa identita' per tentare il resume al refresh.

### 7. Refactor HomeView

File interessato:

```text
src/views/HomeView.jsx
```

Modifiche:

- sostituire `createSession` e `joinSession` locali con chiamate realtime/API;
- mostrare errori server;
- aggiungere stato di caricamento;
- mantenere il codice sessione come fallback;
- preparare supporto per link diretto.

### 8. Refactor FacilitatorView

File interessato:

```text
src/views/FacilitatorView.jsx
```

Modifiche:

- rimuovere `loadSession`, `saveSession`, polling e listener `storage`;
- ricevere sessione dal server;
- inviare azioni tramite eventi realtime;
- aggiungere pannello invito con:
  - link LAN;
  - codice sessione;
  - QR code;
  - pulsante copia link;
- mostrare lo stato di connessione dei player.

### 9. Refactor PlayerView

File interessato:

```text
src/views/PlayerView.jsx
```

Modifiche:

- rimuovere polling e listener `storage`;
- inviare voto al server;
- ricevere snapshot aggiornati;
- gestire riconnessione;
- mostrare messaggio chiaro se la sessione non esiste piu' o e' terminata.

### 10. Storico Sprint

File interessati:

```text
src/views/HistoryView.jsx
src/views/PlayerSprintReport.jsx
```

Modifiche consigliate:

- spostare lo storico lato server;
- aggiungere endpoint o evento per leggere gli sprint conclusi;
- mantenere compatibilita' temporanea con lo storico locale solo se necessario.

### 11. Script NPM

Aggiornare `package.json`:

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "server": "node server/index.js",
    "start": "npm run build && node server/index.js",
    "host": "npm run start"
  }
}
```

Comando principale per il facilitatore:

```bash
npm run host
```

### 12. Configurazione Vite

Per sviluppo locale con frontend e backend separati:

- mantenere `npm run dev` per Vite;
- aggiungere proxy verso il backend se necessario;
- in produzione servire `dist` direttamente dal server Node.js.

### 13. Documentazione Utente

Aggiungere una breve guida:

```text
1. Avvia il server con npm run host.
2. Copia uno degli indirizzi "Rete locale".
3. Condividilo con il team.
4. I partecipanti aprono il link e inseriscono il proprio nome.
5. Se il link non funziona, controlla che tutti siano sulla stessa rete e che il firewall permetta la porta 3000.
```

## Accesso LAN

Per rete locale:

- il server deve ascoltare su `0.0.0.0`;
- i partecipanti devono essere sulla stessa rete o VPN;
- il firewall del facilitatore deve permettere connessioni in ingresso;
- l'IP locale puo' cambiare tra una riunione e l'altra.

## Accesso WWW

Un IP locale come `192.168.x.x` non e' raggiungibile da Internet. Per accesso pubblico servono una di queste soluzioni:

- deploy su piattaforma cloud;
- VPS con dominio e HTTPS;
- tunnel temporaneo con Cloudflare Tunnel o ngrok;
- reverse proxy aziendale.

Per la modalita' WWW sono consigliati:

- HTTPS;
- token del facilitatore;
- protezione base da abuso;
- persistenza database;
- gestione sessioni scadute;
- configurazione CORS esplicita.

## Criteri di Accettazione

- Il facilitatore puo' avviare il server con un solo comando.
- La console mostra almeno un URL LAN condivisibile.
- Un dispositivo diverso puo' aprire l'app tramite IP locale.
- Il facilitatore puo' creare una sessione.
- Un partecipante puo' unirsi alla sessione da un altro browser/dispositivo.
- Quando il facilitatore aggiunge una storia, i player la vedono senza refresh manuale.
- Quando un player vota, il facilitatore vede il voto come ricevuto ma non il valore.
- Prima del reveal nessun client riceve i valori dei voti degli altri player.
- Dopo il reveal tutti vedono i risultati.
- Il facilitatore puo' accettare una stima e passare alla storia successiva.
- Il refresh pagina non fa perdere automaticamente l'identita' del partecipante.
- La fine sprint viene propagata a tutti i client connessi.

## Rischi e Mitigazioni

### Concorrenza sullo Stato

Rischio: due eventi arrivano quasi contemporaneamente.

Mitigazione: centralizzare tutte le mutazioni nel server e non accettare patch arbitrarie dal client.

### Privacy dei Voti

Rischio: inviare accidentalmente i valori dei voti prima del reveal.

Mitigazione: creare una funzione server dedicata per generare snapshot pubblici sicuri.

### Riconnessione

Rischio: un refresh crea player duplicati.

Mitigazione: salvare `playerId/sessionId` nel browser e supportare `resume_session`.

### Firewall e Reti Aziendali

Rischio: l'IP locale non e' raggiungibile.

Mitigazione: mostrare istruzioni diagnostiche e prevedere modalita' tunnel/deploy pubblico.

## Ordine Consigliato delle Pull Request

1. Aggiunta backend Express/Socket.IO con health check e stampa IP.
2. Implementazione session store server-side.
3. Implementazione eventi realtime.
4. Client realtime e refactor di `HomeView`.
5. Refactor di `FacilitatorView`.
6. Refactor di `PlayerView`.
7. Storico lato server.
8. QR code, link invito e documentazione utente.
9. Hardening per WWW.

## Note sui File Attuali

I punti principali da modificare sono:

- `src/utils/storage.js`: oggi contiene la logica locale di sessione; dovra' essere ridotta alla sola identita' client o sostituita.
- `src/views/HomeView.jsx`: oggi crea e unisce sessioni tramite storage locale.
- `src/views/FacilitatorView.jsx`: oggi sincronizza stato con `localStorage` e polling.
- `src/views/PlayerView.jsx`: oggi legge/scrive voti direttamente nello storage locale.
- `src/views/HistoryView.jsx`: oggi legge lo storico dal browser.

## Decisione Tecnica Raccomandata

Procedere prima con un MVP LAN basato su Node.js e Socket.IO. Questa scelta risolve il bisogno immediato della riunione reale senza introdurre subito complessita' da deploy pubblico, autenticazione completa e database.

Dopo aver validato l'uso in rete locale, estendere la stessa architettura verso WWW con HTTPS, persistenza e protezioni aggiuntive.
