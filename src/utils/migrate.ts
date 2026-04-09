import { World } from '../types';

export function migrateWorld(world: World): World {
  if (!world.version || world.version < 1) {
    // migrate to v1: ensure all required fields exist
    return { ...world, version: 1 };
  }
  return world;
}
