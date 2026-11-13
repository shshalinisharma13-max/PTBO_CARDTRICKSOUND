import test from 'node:test';
import assert from 'node:assert/strict';
import { CARDS, PILES, cardFromPile, pileForCard, printedCodeForCard } from '../public/cards.js';

test('the eleven reported physical backs resolve to their named poems', () => {
  const observed = [
    [1, 3, 6, 'Waves'], [1, 3, 4, 'Thunder'], [1, 3, 2, 'Glass'],
    [1, 2, 6, 'Wind'], [1, 2, 4, 'Heartbeat'], [2, 3, 3, 'Owl'],
    [3, 3, 3, 'Whale'], [3, 3, 1, 'River'], [4, 3, 6, 'Paper'],
    [4, 3, 2, 'Laughter'], [4, 2, 4, 'Telephone'],
  ];
  for (const [pile, a, b, word] of observed) assert.equal(cardFromPile(pile, a, b)?.word, word);
});

test('the same repeated code identifies a different poem at each place', () => {
  assert.deepEqual([1, 2, 3, 4].map(pile => cardFromPile(pile, 3, 3).word), ['Fire', 'Owl', 'Whale', 'Applause']);
});

test('four piles contain all 36 stable audio IDs, with nine distinct backs each', () => {
  assert.equal(PILES.length, 4);
  const numbers = new Set();
  for (const pile of PILES) {
    assert.equal(pile.cards.length, 9);
    const codes = new Set();
    for (const card of pile.cards) {
      const [a, b] = printedCodeForCard(card);
      assert.equal(pileForCard(card), pile.number);
      assert.equal(cardFromPile(pile.number, a, b), card);
      numbers.add(card.n);
      codes.add(`${a},${b}`);
    }
    assert.equal(codes.size, 9);
  }
  assert.deepEqual([...numbers], CARDS.map(c => c.n));
});

test('missing places and codes outside this printed layout cannot choose a card', () => {
  for (const pile of [undefined, null, 0, 5, 1.5, '2', NaN]) assert.equal(cardFromPile(pile, 3, 3), null);
  for (const [a, b] of [[1, 1], [2, 1], [2, 2], [2, 3], [3, 7], [4, 4], [3.1, 3], [null, 3], [3, '3']]) {
    assert.equal(cardFromPile(1, a, b), null);
  }
});
