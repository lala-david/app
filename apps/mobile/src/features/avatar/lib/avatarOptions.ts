import * as adventurer from '@dicebear/adventurer';
import { createAvatar } from '@dicebear/core';

import avatarConfig from '@/content/avatar.json';
import { createRng } from '@/entities/quiz/buildQuiz';

export const NONE = 'none';

export type PartKind = 'variant' | 'color';

export interface AvatarPart {
  key: string;
  kind: PartKind;
  options: string[];
  optional: boolean;
}

interface SchemaProperty {
  type?: string;
  items?: { enum?: string[] };
  default?: unknown;
}

const properties = (adventurer.schema as { properties: Record<string, SchemaProperty> }).properties;
const excluded = avatarConfig.excludedOptions as Record<string, string[]>;

/** DiceBear 스타일 스키마에서 꾸미기 부위와 선택지를 만든다 (선택지를 코드에 적지 않는다) */
function readPart(key: string): AvatarPart | null {
  if (key === 'backgroundColor') {
    return { key, kind: 'color', options: avatarConfig.backgroundColors, optional: false };
  }
  const property = properties[key];
  if (!property) return null;
  const optional = `${key}Probability` in properties && key !== 'hair';
  const blocked = excluded[key] ?? [];
  if (property.items?.enum) {
    const options = [...property.items.enum].filter((o) => !blocked.includes(o)).sort();
    return { key, kind: 'variant', options: optional ? [NONE, ...options] : options, optional };
  }
  if (Array.isArray(property.default)) {
    return { key, kind: 'color', options: property.default as string[], optional };
  }
  return null;
}

export const avatarParts: AvatarPart[] = avatarConfig.partOrder.map(readPart).filter((p): p is AvatarPart => !!p);

export type AvatarSelection = Record<string, string>;

export function toDicebearOptions(selection: AvatarSelection): Record<string, unknown> {
  const options: Record<string, unknown> = {};
  for (const part of avatarParts) {
    const value = selection[part.key];
    if (part.optional) {
      if (!value || value === NONE) {
        options[`${part.key}Probability`] = 0;
        continue;
      }
      options[`${part.key}Probability`] = 100;
    }
    if (value) options[part.key] = [value];
  }
  return options;
}

export function avatarSvg(seed: string, selection: AvatarSelection): string {
  return createAvatar(adventurer, { seed, ...toDicebearOptions(selection) }).toString();
}

export function randomSelection(seed: number): AvatarSelection {
  const rng = createRng(seed);
  const pick = <T,>(items: readonly T[]) => items[Math.floor(rng() * items.length)];
  return Object.fromEntries(
    avatarParts.map((part) => {
      const choices = part.options.filter((o) => o !== NONE);
      const skip = part.optional && rng() > avatarConfig.optionalChance;
      return [part.key, skip ? NONE : pick(choices)];
    }),
  );
}

export const isColorValue = (value: string) => /^[0-9a-f]{6}$/i.test(value);
