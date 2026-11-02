import { writable } from 'svelte/store';

export const occasion = writable<{ category: string; variant?: string } | null>(null);
export const gender = writable<{ who: string } | null>(null);
export const selections = writable<Record<string, any>>({});

export const activeGarmentModal = writable<string | null>(null);

export const language = writable<'en' | 'pl'>((localStorage.getItem('style-advisor-language') as 'en' | 'pl' | null) || 'en');
language.subscribe((v) => {
  if (typeof window !== 'undefined') localStorage.setItem('style-advisor-language', v);
});
