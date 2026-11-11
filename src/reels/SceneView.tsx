/** Satu frame scene reel: murni fungsi dari (scene, waktu lokal). Tidak punya state atau timer sendiri. */
import type { CSSProperties } from 'react';
import type { PaletteId, Scene } from '@/content/schema';
import { CharacterSvg } from '@/visuals/characters/mascots';
import { CONFETTI_COLORS, paletteOf, type Palette } from '@/visuals/palettes';
import { characterTransform, confettiAt, effectTransform, revealedText, textTransform, toCssTransform, transitionIn } from './engine/motion';

function backgroundStyle(background: Scene['background'], p: Palette): CSSProperties {
  switch (background) {
    case 'gradient':
      return { background: `linear-gradient(160deg, ${p.bg}, ${p.bgDeep})` };
    case 'solid':
      return { background: p.bg };
    case 'spotlight':
      return { background: `radial-gradient(circle at 50% 38%, ${p.bg} 0%, ${p.bgDeep} 72%)` };
    case 'stripes':
      return { background: `repeating-linear-gradient(135deg, ${p.bg} 0 7%, color-mix(in srgb, ${p.bg} 86%, black) 7% 14%)` };
  }
}

/** Ukuran teks menyesuaikan panjang kalimat (satuan cqw = persen lebar kanvas). */
function textSize(text: string): string {
  if (text.length <= 28) return '10.5cqw';
  if (text.length <= 60) return '8.4cqw';
  return '6.8cqw';
}

interface SceneViewProps {
  scene: Scene;
  /** Kunci unik scene (untuk seed konfeti). */
  sceneKey: string;
  localMs: number;
  topicPalette: PaletteId;
}

export function SceneView({ scene, sceneKey, localMs, topicPalette }: SceneViewProps) {
  const palette = paletteOf(scene.palette, topicPalette);
  const progress = localMs / scene.durationMs;
  const shown = revealedText(scene.textMotion, scene.text, progress);
  const stage = toCssTransform(transitionIn(scene.transition, localMs), effectTransform(scene.effect, localMs, scene.durationMs));

  return (
    <div className="absolute inset-0 overflow-hidden" style={{ ...backgroundStyle(scene.background, palette), containerType: 'size' }}>
      <div className="absolute inset-0 flex flex-col items-center will-change-transform" style={stage}>
        <div className="flex w-full flex-1 flex-col items-center justify-center px-[7cqw] pt-[12cqh] text-center">
          {scene.kicker && (
            <span
              className="mb-[3cqw] rounded-full px-[4cqw] py-[1.2cqw] text-[3.6cqw] font-extrabold uppercase tracking-wider"
              style={{ background: palette.accent, color: palette.accentInk }}
            >
              {scene.kicker}
            </span>
          )}
          <p
            className="font-black leading-[1.08]"
            style={{ color: palette.ink, fontSize: textSize(scene.text), textShadow: '0 0.4cqw 0 rgba(0,0,0,0.25)', ...toCssTransform(textTransform(scene.textMotion, localMs)) }}
          >
            {/* Sisa teks dirender tak terlihat supaya tata letak stabil saat kata muncul satu per satu. */}
            <span className="block" style={{ minHeight: '1.1em' }}>
              {shown}
              <span className="invisible">{scene.text.slice(shown.length)}</span>
            </span>
          </p>
        </div>
        {scene.character && (
          <div className="mb-[20cqh] h-[34cqh] w-[34cqh] shrink-0" style={toCssTransform(characterTransform(scene.characterMotion, localMs))}>
            <CharacterSvg id={scene.character} expression={scene.expression} className="h-full w-full drop-shadow-xl" />
          </div>
        )}
        {!scene.character && <div className="h-[22cqh] shrink-0" />}
      </div>
      {scene.effect === 'confetti' &&
        confettiAt(sceneKey, localMs).map((piece, index) => (
          <span
            key={index}
            className="absolute rounded-[0.4cqw]"
            style={{
              left: `${piece.x}%`,
              top: `${piece.y}%`,
              width: `${piece.size}cqw`,
              height: `${piece.size * 1.6}cqw`,
              background: CONFETTI_COLORS[piece.colorIndex],
              transform: `rotate(${piece.rotate.toFixed(1)}deg)`,
            }}
          />
        ))}
    </div>
  );
}
