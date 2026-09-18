import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, test } from 'vitest';

import { contrastRatio } from './contrast';

const css = readFileSync(join(process.cwd(), 'app', 'globals.css'), 'utf8');

/** Pulls the custom properties out of one selector block. */
function tokensIn(selector: string): Record<string, string> {
  const block = new RegExp(`${selector}\\s*\\{([^}]*)\\}`).exec(css);
  if (!block) {
    throw new Error(`No ${selector} block in globals.css`);
  }

  const tokens: Record<string, string> = {};
  for (const [, name, value] of block[1].matchAll(
    /(--[\w-]+)\s*:\s*([^;]+);/g,
  )) {
    tokens[name] = value.trim();
  }
  return tokens;
}

const light = tokensIn(':root');
const dark = tokensIn('\\.dark');

describe('brand triad', () => {
  // The three layers of the logo. colors.dart is explicit that nothing is
  // darkened for light mode or lightened for dark — the same three values
  // appear in both schemes.
  test.each([
    ['--color-primary', '#68e571'],
    ['--color-secondary', '#00b380'],
    ['--color-tertiary', '#008091'],
  ])('%s is %s in both themes', (token, value) => {
    expect(light[token]?.toLowerCase()).toBe(value);
    expect(dark[token]?.toLowerCase()).toBe(value);
  });
});

describe('text contrast', () => {
  test.each([
    ['light', light],
    ['dark', dark],
  ])('%s body text clears AAA on its surface', (_name, tokens) => {
    expect(
      contrastRatio(tokens['--color-on-surface'], tokens['--color-surface']),
    ).toBeGreaterThanOrEqual(7);
  });

  test.each([
    ['light', light],
    ['dark', dark],
  ])('%s label on primary clears AA', (_name, tokens) => {
    expect(
      contrastRatio(tokens['--color-on-primary'], tokens['--color-primary']),
    ).toBeGreaterThanOrEqual(4.5);
  });

  test.each([
    ['light', light],
    ['dark', dark],
  ])('%s money figures clear AA on their surface', (_name, tokens) => {
    expect(
      contrastRatio(tokens['--color-income'], tokens['--color-surface']),
    ).toBeGreaterThanOrEqual(4.5);
    expect(
      contrastRatio(tokens['--color-expense'], tokens['--color-surface']),
    ).toBeGreaterThanOrEqual(4.5);
  });

  test.each([
    ['light', light],
    ['dark', dark],
  ])('%s muted text clears AA on its surface', (_name, tokens) => {
    expect(
      contrastRatio(
        tokens['--color-on-surface-variant'],
        tokens['--color-surface'],
      ),
    ).toBeGreaterThanOrEqual(4.5);
  });
});

describe('category hues', () => {
  // Marks and figures rather than body text, so the non-text threshold is the
  // honest bar.
  test.each([
    ['light', light],
    ['dark', dark],
  ])('every %s category hue is distinguishable on its surface', (_n, tokens) => {
    const hues = Object.entries(tokens).filter(([name]) =>
      name.startsWith('--color-category-'),
    );

    expect(hues).toHaveLength(8);
    for (const [name, value] of hues) {
      expect(
        contrastRatio(value, tokens['--color-surface']),
        `${name} on surface`,
      ).toBeGreaterThanOrEqual(3);
    }
  });
});

describe('chart marks', () => {
  // Chosen with the dataviz palette validator, not by eye. The money *text*
  // tokens failed as marks in dark mode: both too light, and a red/green pair
  // at equal lightness collapses to one colour for deuteranopes (ΔE 2.3).
  // These separate by lightness as well as hue.
  test.each([
    ['light', light, '#2e9e62', '#a8352b'],
    ['dark', dark, '#3aaa6b', '#b83b31'],
  ])('%s uses the validated pair', (_name, tokens, income, expense) => {
    expect(tokens['--color-chart-income']?.toLowerCase()).toBe(income);
    expect(tokens['--color-chart-expense']?.toLowerCase()).toBe(expense);
  });

  test.each([
    ['light', light],
    ['dark', dark],
  ])('%s marks clear the 3:1 non-text bar on the card they sit on', (_name, tokens) => {
    for (const mark of ['--color-chart-income', '--color-chart-expense']) {
      expect(
        contrastRatio(tokens[mark], tokens['--color-surface-container-low']),
        mark,
      ).toBeGreaterThanOrEqual(3);
    }
  });
});

describe('the documented cost', () => {
  // colors.dart states this plainly rather than hiding it: a filled primary
  // button has almost no edge against a white page, which is why filled
  // controls carry elevation in light mode. The test pins the fact so nobody
  // "fixes" the brand colour later without meeting the same decision.
  test('primary against a light surface is a boundary, not a text ratio', () => {
    expect(
      contrastRatio(light['--color-primary'], light['--color-surface']),
    ).toBeLessThan(2);
  });
});
