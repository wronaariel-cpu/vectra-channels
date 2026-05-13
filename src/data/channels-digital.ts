export interface DigitalChannel {
  name: string
  centerFreq: number
  symbolRate: number
  qam: string
}

export const dtvChannels: DigitalChannel[] = [
  { name: 'DTV-131', centerFreq: 266, symbolRate: 6875000, qam: '256QAM' },
  { name: 'DTV-133', centerFreq: 274, symbolRate: 6875000, qam: '256QAM' },
  { name: 'DTV-121', centerFreq: 282, symbolRate: 6875000, qam: '256QAM' },
  { name: 'DTV-122', centerFreq: 290, symbolRate: 6875000, qam: '256QAM' },
  { name: 'DTV-123', centerFreq: 298, symbolRate: 6875000, qam: '256QAM' },
  { name: 'DTV-135', centerFreq: 306, symbolRate: 6875000, qam: '256QAM' },
  { name: 'DTV-124', centerFreq: 314, symbolRate: 6875000, qam: '256QAM' },
  { name: 'DTV-125', centerFreq: 322, symbolRate: 6875000, qam: '256QAM' },
  { name: 'DTV-126', centerFreq: 330, symbolRate: 6875000, qam: '256QAM' },
  { name: 'DTV-127', centerFreq: 338, symbolRate: 6875000, qam: '256QAM' },
  { name: 'DTV-128', centerFreq: 346, symbolRate: 6875000, qam: '256QAM' },
  { name: 'DTV-137', centerFreq: 554, symbolRate: 6875000, qam: '256QAM' },
  { name: 'DTV-153', centerFreq: 562, symbolRate: 6875000, qam: '256QAM' },
  { name: 'DTV-136', centerFreq: 570, symbolRate: 6875000, qam: '256QAM' },
  { name: 'DTV-102', centerFreq: 578, symbolRate: 6875000, qam: '256QAM' },
  { name: 'DTV-101', centerFreq: 586, symbolRate: 6875000, qam: '256QAM' },
  { name: 'DTV-104', centerFreq: 594, symbolRate: 6875000, qam: '256QAM' },
  { name: 'DTV-105', centerFreq: 602, symbolRate: 6875000, qam: '256QAM' },
  { name: 'DTV-106', centerFreq: 610, symbolRate: 6875000, qam: '256QAM' },
  { name: 'DTV-107', centerFreq: 618, symbolRate: 6875000, qam: '256QAM' },
  { name: 'DTV-130', centerFreq: 626, symbolRate: 6875000, qam: '256QAM' },
  { name: 'DTV-109', centerFreq: 642, symbolRate: 6875000, qam: '256QAM' },
  { name: 'DTV-108', centerFreq: 650, symbolRate: 6875000, qam: '256QAM' },
  { name: 'DTV-129', centerFreq: 658, symbolRate: 6875000, qam: '256QAM' },
  { name: 'DTV-132', centerFreq: 666, symbolRate: 6875000, qam: '256QAM' },
  { name: 'DTV-110', centerFreq: 674, symbolRate: 6875000, qam: '256QAM' },
  { name: 'DTV-134', centerFreq: 690, symbolRate: 6875000, qam: '256QAM' },
  { name: 'DTV-103', centerFreq: 698, symbolRate: 6875000, qam: '256QAM' },
]

export const dsChannels: DigitalChannel[] = [
  354, 362, 370, 378, 386, 394, 402, 410, 418,
  434, 442, 450, 458, 466, 474, 482, 490, 498,
  506, 514, 522, 530, 538, 546,
].map((f, i) => ({ name: `DS-${String(i + 1).padStart(2, '0')}`, centerFreq: f, symbolRate: 6952000, qam: '256QAM' }))

export const vodChannels: DigitalChannel[] = [
  826, 834, 842, 850,
].map((f, i) => ({ name: `VoD-${i + 1}`, centerFreq: f, symbolRate: 6900000, qam: '256QAM' }))
