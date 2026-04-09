import { NodeType } from '../types';

export const nodeDefaults: Record<NodeType, { icon: string; template: string }> = {
  character: {
    icon: '👤',
    template: `## Overview\n\n## Appearance\n\n## Personality\n\n## Background\n\n## Goals & Motivations\n\n## Relationships\n`,
  },
  location: {
    icon: '📍',
    template: `## Overview\n\n## Geography\n\n## Atmosphere\n\n## Notable Locations\n\n## History\n\n## Notable Inhabitants\n`,
  },
  event: {
    icon: '⚡',
    template: `## Summary\n\n## Date & Location\n\n## Participants\n\n## Causes\n\n## Consequences\n`,
  },
  faction: {
    icon: '⚔️',
    template: `## Overview\n\n## Goals\n\n## Leadership\n\n## Members\n\n## Resources\n\n## Allies & Enemies\n`,
  },
  item: {
    icon: '💎',
    template: `## Description\n\n## Origin\n\n## Properties\n\n## Current Holder\n\n## History\n`,
  },
  concept: {
    icon: '💡',
    template: `## Overview\n\n## Details\n\n## Significance\n`,
  },
};
