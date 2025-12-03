import { isNovaLabsCoa, parseNovaLabsCoa, NovaParsed } from './nova';

export type LabSpecificParsed = NovaParsed & {
  // In future we can extend with labSlug or extra fields per lab
};

export function parseWithLabSpecificParsers(
  text: string,
): LabSpecificParsed | null {
  // Nova Analytic Labs
  if (isNovaLabsCoa(text)) {
    return parseNovaLabsCoa(text);
  }

  // future: more labs here

  return null;
}
