/** Lifestyle photos, bundled from src/assets/scenes. Each one appears in exactly one place on the site. */

import lambo from './assets/scenes/lambo.jpg';
import penthouse from './assets/scenes/penthouse.jpg';
import wheel from './assets/scenes/wheel.jpg';
import suite from './assets/scenes/suite.jpg';
import yacht from './assets/scenes/yacht.jpg';
import jet from './assets/scenes/jet.jpg';
import chart from './assets/scenes/chart.jpg';
import pool from './assets/scenes/pool.jpg';
import corvette from './assets/scenes/corvette.jpg';
import cashFan from './assets/scenes/cash-fan.jpg';
import cashStacks from './assets/scenes/cash-stacks.jpg';
import rolls from './assets/scenes/rolls.jpg';
import jetStairs from './assets/scenes/jet-stairs.jpg';
import cards from './assets/scenes/cards.jpg';
import garage from './assets/scenes/garage.jpg';
import driveway from './assets/scenes/driveway.jpg';

export const SCENES = {
  // home page
  lambo,
  penthouse,
  wheel,
  suite,
  yacht,
  jet,
  // course covers
  chart,
  pool,
  corvette,
  'cash-fan': cashFan,
  'cash-stacks': cashStacks,
  rolls,
  'jet-stairs': jetStairs,
  cards,
  garage,
  driveway,
};

export type Scene = keyof typeof SCENES;

export const LARPCAPITAL_URL =
  (import.meta.env.VITE_LARPCAPITAL_URL as string | undefined) ?? (import.meta.env.DEV ? '/' : 'https://larpcapital.onrender.com');
