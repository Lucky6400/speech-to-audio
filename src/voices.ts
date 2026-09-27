export type StaticVoice = {
  id: string
  label: string
  locale: string
}

/** Fixed voice list — no network fetch. */
export const VOICES: StaticVoice[] = [
  { id: 'en-US-EmmaMultilingualNeural', label: 'Emma (Female)', locale: 'en-US' },
  { id: 'en-US-AndrewMultilingualNeural', label: 'Andrew (Male)', locale: 'en-US' },
  { id: 'en-US-AvaNeural', label: 'Ava (Female)', locale: 'en-US' },
  { id: 'en-US-BrianNeural', label: 'Brian (Male)', locale: 'en-US' },
  { id: 'en-US-JennyNeural', label: 'Jenny (Female)', locale: 'en-US' },
  { id: 'en-US-GuyNeural', label: 'Guy (Male)', locale: 'en-US' },
  { id: 'en-US-AriaNeural', label: 'Aria (Female)', locale: 'en-US' },
  { id: 'en-US-DavisNeural', label: 'Davis (Male)', locale: 'en-US' },
  { id: 'en-GB-SoniaNeural', label: 'Sonia (Female)', locale: 'en-GB' },
  { id: 'en-GB-RyanNeural', label: 'Ryan (Male)', locale: 'en-GB' },
  { id: 'en-GB-LibbyNeural', label: 'Libby (Female)', locale: 'en-GB' },
  { id: 'en-AU-NatashaNeural', label: 'Natasha (Female)', locale: 'en-AU' },
  { id: 'en-AU-WilliamNeural', label: 'William (Male)', locale: 'en-AU' },
  { id: 'en-IN-NeerjaNeural', label: 'Neerja (Female)', locale: 'en-IN' },
  { id: 'en-IN-PrabhatNeural', label: 'Prabhat (Male)', locale: 'en-IN' },
  { id: 'hi-IN-SwaraNeural', label: 'Swara (Female)', locale: 'hi-IN' },
  { id: 'hi-IN-MadhurNeural', label: 'Madhur (Male)', locale: 'hi-IN' },
  { id: 'es-ES-ElviraNeural', label: 'Elvira (Female)', locale: 'es-ES' },
  { id: 'es-MX-DaliaNeural', label: 'Dalia (Female)', locale: 'es-MX' },
  { id: 'fr-FR-DeniseNeural', label: 'Denise (Female)', locale: 'fr-FR' },
  { id: 'de-DE-KatjaNeural', label: 'Katja (Female)', locale: 'de-DE' },
  { id: 'de-DE-ConradNeural', label: 'Conrad (Male)', locale: 'de-DE' },
  { id: 'ja-JP-NanamiNeural', label: 'Nanami (Female)', locale: 'ja-JP' },
  { id: 'zh-CN-XiaoxiaoNeural', label: 'Xiaoxiao (Female)', locale: 'zh-CN' },
]

export const DEFAULT_VOICE = VOICES[0].id
