# Tinderbox reveal

The secret phone input and the sound computer for the Tinderbox marked poetry deck.

- **Phone** (`/`): looks like a calm poetic app asking the spectator two questions. Underneath, the
  whole screen is an invisible 2 x 3 grid laid out exactly like the leaves on the card back.
- **Sound computer** (`/speaker`): stays open on the computer connected to the speakers. It holds the
  chosen card ready and plays its sound the instant you make the final secret tap.

Built the same way as the collaborative soundboard: Node + Express + Socket.IO, rooms joined with `?room=`.

## Performing

1. Read the card back: **upper-left sprig = first number**, **upper-right sprig = second number**
   (the leaf with no central vein; top pair 1 2, middle pair 3 4, bottom pair 5 6).
2. On the phone, press **BEGIN**.
3. *"What colour is your word?"* While they answer, tap the **first number's zone**.
4. *"Is it warm, or cold?"* While they answer, tap the **second number's zone**.
   Changed your mind? Tap again within about a second; the last tap counts.
5. The phone shows *"Finding your word…"* and the sound computer quietly gets that card ready.
6. *"Close your eyes, and listen."* **Tap anywhere: that is the final secret button.** The sound plays.
   Once the sound computer accepts that tap, the phone also shows the card's three-line poem.
   It stays visible until you start over with a two-finger tap.

```
 phone screen        card back sprig
 +-----+-----+          1 | 2
 |  1  |  2  |          3 | 4
 +-----+-----+          5 | 6
 |  3  |  4  |
 +-----+-----+
 |  5  |  6  |
 +-----+-----+
```

Signals only you can see: a tiny dot at the bottom edge flashes cyan when a tap is taken, and glows
red when the sound computer is not connected (if the final tap does not get through, the phone stays
on "Close your eyes" so you can tap again). Android phones also buzz; iPhones do not.

- **Two-finger tap** anywhere: start over.
- **Faint button bottom-right**: rehearse view (shows the grid, your taps and the card).

## The sound computer

Open `/speaker?room=tinderbox`, click once to **arm the sound**, then press **f** for full screen.
The eye glows with the sound. On the final secret tap, the chosen card's three-line poem fades in
below the eye, matching the printed card. It stays visible after the sound ends, until you start
over, press stop, or reveal another card. Selecting a card early does not display the poem.
Press **h** for the operator panel:
connection status, which card is ready, sounds loaded, volume, stop, and a **manual backup grid**
of all 36 cards you can click if the phone ever fails.

Sounds: put files in `public/audio/` named by card number (`01-waves.mp3` … `36-telephone.mp3`,
see `public/audio/README.txt`), or drag them onto the operator panel. A card without a file speaks
its poem aloud instead, so you can rehearse before every sound exists.

Options in the panel: show or hide the poem (**p**, on by default), speak the poem when a file is missing.

## Run locally

```bash
npm install
npm start
```

- Sound computer: `http://localhost:3000/speaker?room=tinderbox`
- Phone on the same Wi-Fi: `http://<this computer's IP>:3000/?room=tinderbox`

## Deploy on Render (works from anywhere with internet)

1. Push this folder to a new GitHub repository.
2. Render → **New Web Service** → connect the repo.
3. Build command `npm install`, start command `npm start`.
4. Phone: `https://YOUR-APP.onrender.com/?room=tinderbox`
   Sound computer: `https://YOUR-APP.onrender.com/speaker?room=tinderbox`

A free Render service sleeps after about 15 minutes idle and takes up to a minute to wake, so open
both pages a few minutes before the show. While the sound page is open it pings the server to keep
it awake. Audio files in `public/audio/` are deployed with the code; files dragged onto the page are not.

Use your own room name (for example `?room=tinderbox-leeds`) so nobody else can join yours.
