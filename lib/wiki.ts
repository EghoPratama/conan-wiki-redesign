// lib/wiki.ts
import { parseWikiResponse } from './wikiParser';
import { CharacterData } from '@/types/character';

export async function getCharacter(slug: string): Promise<CharacterData | null> {
  const wikiTitle = encodeURIComponent(slug.replace(/ /g, '_'));
  const url = `https://www.detectiveconanworld.com/wiki/api.php?action=parse&page=${wikiTitle}&format=json`;

  try {
    const res = await fetch(url, {
      // Cache data selama 24 jam (ISR)
      next: { revalidate: 86400 },
    });

    if (!res.ok) return null;

    const data = await res.json();
    if (data.error) return null;

    return parseWikiResponse(data);
  } catch (error) {
    console.error('Error fetching character:', error);
    return null;
  }
}