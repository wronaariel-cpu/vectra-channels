import type { DigitalChannel } from './channels-digital'

// Źródło: PROGRAMING Elsat VECTRA.xlsx — arkusz "ELSAT prog", kanały S31–K44
// SR i QAM identyczne jak Vectra Zabrze
export const dsElsatChannels: DigitalChannel[] = [
  410, 418, 426, 434, 442, 450, 458, 466,
  474, 482, 490, 498, 506, 514, 522, 530, 538, 546,
  554, 562, 570, 578, 586, 594, 602, 610, 618, 626, 634, 642, 650, 658,
].map((f, i) => ({
  name: `DS-${String(i + 1).padStart(2, '0')}`,
  centerFreq: f,
  symbolRate: 6952000,
  qam: '256QAM',
}))
