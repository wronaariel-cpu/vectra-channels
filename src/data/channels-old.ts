import { channelsNew } from './channels-new'
import type { Channel } from '../types'

// Stare częstotliwości transponderów wg Zabrze-Play_OLD NIT
// Transpondery 101-110, 129-130, 132, 134, 136-137, 153 — bez zmian
// Zmienione: 121-128, 131, 133, 135
const OLD_FREQ: Record<number, string> = {
  101: '586 MHz', 102: '578 MHz', 103: '698 MHz', 104: '594 MHz',
  105: '602 MHz', 106: '610 MHz', 107: '618 MHz', 108: '650 MHz',
  109: '642 MHz', 110: '674 MHz',
  121: '722 MHz', 122: '730 MHz', 123: '738 MHz', 124: '754 MHz',
  125: '762 MHz', 126: '770 MHz', 127: '778 MHz', 128: '786 MHz',
  129: '658 MHz', 130: '626 MHz',
  131: '706 MHz', 132: '666 MHz', 133: '714 MHz', 134: '690 MHz',
  135: '746 MHz', 136: '570 MHz', 137: '554 MHz', 153: '562 MHz',
}

export const channelsOld: Channel[] = channelsNew.map(ch => ({
  ...ch,
  frequency: OLD_FREQ[ch.transponder] ?? ch.frequency,
}))
