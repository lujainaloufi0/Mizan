import { useMemo } from 'react';
import { estimateLeftovers, type Leftover } from '@/lib/planner';
import { useMizan, weekPrefs } from '@/store/mizan';

/** The most recent week (this one, or the one before) — the template for "repeat" and the source of leftovers. */
export function useTemplateWeek() {
  const week = useMizan((s) => s.week);
  const lastWeek = useMizan((s) => s.lastWeek);
  return week ?? lastWeek;
}

/** What that week probably left in the kitchen (only food that keeps). */
export function useLeftovers(): Leftover[] {
  const profile = useMizan((s) => s.profile);
  const template = useTemplateWeek();
  return useMemo(
    () => (template ? estimateLeftovers({ prefs: weekPrefs({ profile }, template), choices: template.choices, cooked: template.cooked }) : []),
    [profile, template],
  );
}
