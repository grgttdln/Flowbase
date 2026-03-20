import type { Element } from './element';

export interface SerializedScene {
  version: number;
  elements: Element[];
}
