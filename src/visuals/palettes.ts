/** Palet warna visual. Tiap topik punya palet default (content/topics.json); kartu boleh menimpa lewat `visual.palette`. */
import type { PaletteId } from '@/content/schema';

export interface Palette {
  id: PaletteId;
  /** Gradien latar: bg -> bgDeep. */
  bg: string;
  bgDeep: string;
  /** Teks di atas latar. */
  ink: string;
  accent: string;
  /** Teks di atas warna aksen. */
  accentInk: string;
  /** Panel terang (kartu, balon). */
  panel: string;
  panelInk: string;
}

export const PALETTES: Record<PaletteId, Palette> = {
  bata: { id: 'bata', bg: '#C0362C', bgDeep: '#7A1410', ink: '#FFF4EC', accent: '#FFD166', accentInk: '#3A1200', panel: '#FFF4EC', panelInk: '#4A120E' },
  laut: { id: 'laut', bg: '#1766C2', bgDeep: '#0A2E63', ink: '#EEF7FF', accent: '#7DE2FF', accentInk: '#06264D', panel: '#EEF7FF', panelInk: '#0A2E63' },
  hutan: { id: 'hutan', bg: '#1F8A56', bgDeep: '#0C4229', ink: '#F0FFF4', accent: '#D4F560', accentInk: '#0C3A20', panel: '#F0FFF4', panelInk: '#0C4229' },
  anggur: { id: 'anggur', bg: '#7B3FB8', bgDeep: '#3A1463', ink: '#FAF0FF', accent: '#FFB3E6', accentInk: '#3A1463', panel: '#FAF0FF', panelInk: '#3A1463' },
  senja: { id: 'senja', bg: '#EE6C3A', bgDeep: '#A3250F', ink: '#FFF6EE', accent: '#FFE08A', accentInk: '#5A1A05', panel: '#FFF6EE', panelInk: '#6A1E08' },
  toska: { id: 'toska', bg: '#0F9C9C', bgDeep: '#064F55', ink: '#EFFFFE', accent: '#FFE66D', accentInk: '#06363A', panel: '#EFFFFE', panelInk: '#064F55' },
  emas: { id: 'emas', bg: '#D9A520', bgDeep: '#8A6208', ink: '#FFFBEB', accent: '#2B1D00', accentInk: '#FFE9A8', panel: '#FFFBEB', panelInk: '#4A3300' },
  arang: { id: 'arang', bg: '#343844', bgDeep: '#121317', ink: '#F4F5F7', accent: '#FF7A7A', accentInk: '#2A0A0A', panel: '#F4F5F7', panelInk: '#1B1D24' },
};

export const CONFETTI_COLORS = ['#FFD166', '#EF476F', '#06D6A0', '#7DE2FF', '#FFFFFF'] as const;

export function paletteOf(id: PaletteId | undefined, fallback: PaletteId): Palette {
  return PALETTES[id ?? fallback];
}
