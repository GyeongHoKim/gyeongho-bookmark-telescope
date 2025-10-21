export type ActionID = 'live-grep' | 'quick-bookmark' | 'bookmark-manager';

export interface LeaderItem {
  id: ActionID;
  label: string;
  description: string;
  hotkeys: string[];
}

export const LEADER_ITEMS: LeaderItem[] = [
  {
    id: 'live-grep',
    label: 'Live Grep',
    description: 'Search bookmarks',
    hotkeys: ['g'],
  },
  {
    id: 'quick-bookmark',
    label: 'Quick Bookmark',
    description: 'Quick add current page',
    hotkeys: ['a'],
  },
  {
    id: 'bookmark-manager',
    label: 'Bookmark Manager',
    description: 'Full bookmark management',
    hotkeys: ['b'],
  },
];
