export const SHARPS = [
  'C',
  'C#',
  'D',
  'D#',
  'E',
  'F',
  'F#',
  'G',
  'G#',
  'A',
  'A#',
  'B'
];
export const FLATS = [
  'C',
  'Db',
  'D',
  'Eb',
  'E',
  'F',
  'Gb',
  'G',
  'Ab',
  'A',
  'Bb',
  'B'
];

export function getNotesArray(key: string): string[] {
  // Common keys that typically use flats
  const flatKeys = [
    'F',
    'Bb',
    'Eb',
    'Ab',
    'Db',
    'Gb',
    'Cb',
    'Dm',
    'Gm',
    'Cm',
    'Fm',
    'Bbm',
    'Ebm'
  ];
  return flatKeys.includes(key) ? FLATS : SHARPS;
}

export function getNoteIndex(note: string): number {
  let idx = SHARPS.indexOf(note);
  if (idx === -1) idx = FLATS.indexOf(note);
  return idx;
}

/**
 * Transposes a chord to a new target key.
 * @param chord The original chord (e.g., "Ebm7/G")
 * @param semitones The number of semitones to shift
 * @param targetNotesArray The note array to use for formatting output (SHARPS or FLATS)
 */
export function transposeChord(
  chord: string,
  semitones: number,
  targetNotesArray: string[]
): string {
  // Regex matches Root Note, optional modifier, optional bass note
  // e.g. Ebm7/G -> Root: Eb, Mod: m7, Bass: G
  const regex = /^([A-G][#b]?)(.*?)(?:\/([A-G][#b]?))?$/;
  const match = chord.match(regex);

  if (!match) return chord; // If it doesn't parse, return as-is

  const root = match[1] ?? '';
  const mod = match[2] || '';
  const bass = match[3];

  const rootIdx = getNoteIndex(root);
  if (rootIdx === -1) return chord; // Invalid root note

  // Calculate new root index wrapping around 12
  const newRootIdx = (rootIdx + semitones + 120) % 12;
  const newRoot = targetNotesArray[newRootIdx];

  let newChord = `${newRoot}${mod}`;

  if (bass) {
    const bassIdx = getNoteIndex(bass);
    if (bassIdx !== -1) {
      const newBassIdx = (bassIdx + semitones + 120) % 12;
      const newBass = targetNotesArray[newBassIdx];
      newChord += `/${newBass}`;
    } else {
      newChord += `/${bass}`;
    }
  }

  return newChord;
}

/**
 * Transposes an entire ChordPro string from its original key to a target key.
 */
export function transposeChordPro(
  chordProText: string,
  originalKey: string,
  targetKey: string
): string {
  if (!originalKey || !targetKey || originalKey === targetKey) {
    return chordProText;
  }

  // Normalize keys to strip major/minor for index lookup (e.g. "Ab minor" -> "Ab")
  const normOriginal = originalKey.replace(/ minor| major|m|M/g, '').trim();
  const normTarget = targetKey.replace(/ minor| major|m|M/g, '').trim();

  const origIdx = getNoteIndex(normOriginal);
  const targetIdx = getNoteIndex(normTarget);

  if (origIdx === -1 || targetIdx === -1) {
    return chordProText;
  }

  const semitones = targetIdx - origIdx;
  const targetNotesArray = getNotesArray(normTarget);

  // Replace chords within brackets [Chord]
  return chordProText.replace(/\[([^\]]+)\]/g, (_match, chordInner) => {
    // Some people write multiple chords in one bracket like [C G] or [C - G]
    // We should split by spaces/hyphens but for simplicity we'll assume single chords
    // A robust approach splits by non-chord characters:
    const transposedInner = chordInner.replace(
      /[A-G][#b]?(?:m|maj|min|dim|aug|sus|[0-9])*(?:\/[A-G][#b]?)?/g,
      (c: string) => transposeChord(c, semitones, targetNotesArray)
    );
    return `[${transposedInner}]`;
  });
}
