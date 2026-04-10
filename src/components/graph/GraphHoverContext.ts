import { createContext } from 'react';

/** ID of the currently hovered graph node, or null when nothing is hovered. */
export const GraphHoverContext = createContext<string | null>(null);
