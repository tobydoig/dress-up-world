/**
 * Growing things.
 *
 * Plants advance by being **watered**, not by time passing. Time only decides when the next
 * drink is due. That distinction is the whole design: a child who comes back after a week
 * hasn't missed anything and hasn't killed anything — the plant is simply thirsty, and one
 * watering moves it on exactly as it would have yesterday. Nothing here can die.
 *
 * The waiting is what makes it worth coming back, and what makes looking after something
 * mean anything, so every watering also visibly changes the plant. Wait, water, see it
 * bigger — with nothing to show for the trip, the trip doesn't get made twice.
 */

/** How long after a drink a plant wants the next one. The one number to turn. */
export const THIRSTY_AFTER_MS = 12 * 60 * 60 * 1000;

export interface Crop {
  /** The seed packet you plant. */
  seed: string;
  /** What you pick off it, which is an ordinary ingredient. */
  crop: string;
  name: string;
  /** Waterings from bare soil to ripe. At a twelve hour thirst, two is overnight. */
  waterings: number;
  /** Low plants sit in the bed; trees grow a trunk and stand above it. */
  kind: "plant" | "tree";
}

export const CROPS: Record<string, Crop> = {
  lettuceSeeds: { seed: "lettuceSeeds", crop: "lettuce", name: "Lettuce seeds", waterings: 2, kind: "plant" },
  carrotSeeds: { seed: "carrotSeeds", crop: "carrot", name: "Carrot seeds", waterings: 3, kind: "plant" },
  strawberrySeeds: { seed: "strawberrySeeds", crop: "strawberry", name: "Strawberry seeds", waterings: 3, kind: "plant" },
  tomatoSeeds: { seed: "tomatoSeeds", crop: "tomato", name: "Tomato seeds", waterings: 4, kind: "plant" },
  potatoSeeds: { seed: "potatoSeeds", crop: "potato", name: "Potato seeds", waterings: 4, kind: "plant" },
  appleSeeds: { seed: "appleSeeds", crop: "apple", name: "Apple pips", waterings: 5, kind: "tree" },
  lemonSeeds: { seed: "lemonSeeds", crop: "lemon", name: "Lemon pips", waterings: 5, kind: "tree" },
};

export const SEED_IDS = Object.keys(CROPS);

/** Whether a thing is a seed packet, and which crop it turns into. */
export function cropFromSeed(thingId: string): Crop | null {
  return CROPS[thingId] ?? null;
}

/**
 * Whether a planted bed wants watering. A clock that has gone backwards — a timezone change,
 * a device with the wrong date — would otherwise leave a plant permanently not-thirsty, so
 * anything that looks impossible counts as thirsty. Erring towards letting her water it is
 * the right way round to be wrong.
 */
export function isThirsty(wateredAt: number, now: number): boolean {
  if (!wateredAt) return true;
  if (wateredAt > now) return true;
  return now - wateredAt >= THIRSTY_AFTER_MS;
}

/** How far along a bed is, from 0 (just sown) to 1 (ready to pick). */
export function ripeness(crop: Crop, stage: number): number {
  return Math.min(1, stage / crop.waterings);
}
