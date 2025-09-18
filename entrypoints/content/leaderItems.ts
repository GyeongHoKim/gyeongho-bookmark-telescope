export interface LeaderItem {
  id: string;
  label: string;
  description: string;
  hotkeys: string[];
}

export const LEADER_ITEMS: LeaderItem[] = [
  {
    id: 'live-grep',
    label: 'Live Grep',
    description: 'Search bookmarks',
    hotkeys: ['g']
  }
];

export const LEADER_ACTIONS = {
  'live-grep': () => {
    const event = new CustomEvent('telescope-toggle');
    window.dispatchEvent(event);
  }
} as const;
