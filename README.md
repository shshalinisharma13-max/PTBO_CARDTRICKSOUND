# Tinderbox reveal

The secret phone input and the sound computer for the Tinderbox marked poetry deck.

- **Phone** (`/`): looks like a calm poetic app asking the spectator three questions. First, secretly
  choose which of four places their card came from. Then enter the two leaf numbers on the back.
- **Sound computer** (`/speaker`): stays open on the computer connected to the speakers. It holds the
  chosen card ready and plays its sound the instant you make the final secret tap.

Built the same way as the collaborative soundboard: Node + Express + Socket.IO, rooms joined with `?room=`.

## Four places, four piles

Put one pile at each of four places in the room. You choose the actual locations; remember which
is Place 1, 2, 3, and 4. Keep these exact nine cards in each pile (the original front-sheet order):

| Place | Cards |
|---|---|
| 1 | Waves, Rain, Thunder, Fire, Glass, Bells, Wind, Clock, Heartbeat |
| 2 | Birdsong, Footsteps, Door, Owl, Train, Sand, Ice, Kettle, Match |
| 3 | Typewriter, Horses, Wolf, Whale, Crickets, River, Piano, Gulls, Coins |
| 4 | Paper, Drop, Chains, Applause, Laughter, Bees, Foghorn, Wings, Telephone |

The routine uses the repeated physical backs diagnosed from the printed deck. The nine back codes
in each pile are `3-6, 3-5, 3-4, 3-3, 3-2, 3-1, 2-6, 2-5, 2-4`, in the card order above. The place
distinguishes cards sharing a back: `3-3` is Fire at Place 1, Owl at Place 2, Whale at Place 3,
and Applause at Place 4. Audio filenames keep their existing card numbers.

Before performing, rehearse each pile once to check its backs. This layout follows the eleven
confirmed readings and the inferred repeated print pattern; the remaining readings should be checked
against the physical cards. You must know which place the spectator chose before entering the leaves.

## Performing

1. Read the back: **upper-left branch = first leaf number**, **upper-right branch = second**.
   Ignore the tiny tip bud. Number the six side leaves horizontally: top pair `1 2`, middle pair
   `3 4`, bottom pair `5 6`. Find the leaf without its long centre vein.
2. Press **BEGIN** on the phone.
3. *"Where did your word find you?"* Secretly tap the **place** using four invisible quadrants:
   **top-left 1, top-right 2, bottom-left 3, bottom-right 4**.
4. *"What colour is your word?"* Tap the **left leaf number** using the six-zone grid below.
5. *"Is it warm, or cold?"* Tap the **right leaf number** using that same six-zone grid.
   Pause for about a second after each answer. A quick re-tap changes the selection.
6. *"Finding your word…"* prepares that pile's card on the sound computer without revealing it.
7. *"Close your eyes, and listen."* **Tap anywhere once** to play the sound and show the matching
   three-line poem on both screens. The poem stays until you start over or stop it.

```
 First question: place       Next two questions: leaf
 +---------+---------+       +---------+---------+
 |    1    |    2    |       |    1    |    2    |
 |         |         |       +---------+---------+
 +---------+---------+       |    3    |    4    |
 |    3    |    4    |       +---------+---------+
 |         |         |       |    5    |    6    |
 +---------+---------+       +---------+---------+
```

If the two leaf numbers are outside this printed layout, the phone repeats the colour question so
you can enter them again. A failed final cue stays on the ready screen so you can retry.

Signals only you can see: a tiny dot at the bottom edge flashes cyan when a tap is taken, and glows
red when the sound computer is not connected (if the final tap does not get through, the phone stays
on "Close your eyes" so you can tap again). Android phones also buzz; iPhones do not.

- **Two-finger tap** anywhere: start over.
- **Faint button bottom-right**: rehearse view (shows the active grid, place, taps, and card).
- **Desktop rehearsal:** Enter begins; 1-4 choose a place on the first question; 1-6 enter each leaf;
  space fires on the ready screen; X restarts; R toggles the rehearse view.

## The sound computer

Open `/speaker?room=tinderbox`, click once to **arm the sound**, then press **f** for full screen.
The eye glows with the sound. On the final secret tap, the chosen card's three-line poem fades in
below the eye, matching the printed card. It stays visible after the sound ends, until you start
over, press stop, or reveal another card. Selecting a card early does not display the poem.
Press **h** for the operator panel:
connection status, which card is ready, sounds loaded, volume, stop, and a **manual backup grid**
of all 36 cards grouped by place, with the physical back codes, for use if the phone ever fails.

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
