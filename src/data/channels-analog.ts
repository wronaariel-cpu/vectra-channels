export interface AnalogChannel {
  id: string
  frequency: number
  program: string
}

export const analogChannelsOld: AnalogChannel[] = [
  { id: 'S 01', frequency: 111.25, program: 'TV PULS' },
  { id: 'S 02', frequency: 119.25, program: 'TV TRWAM' },
  { id: 'S 03', frequency: 127.25, program: 'Wolny – kamery / info lokalne' },
  { id: 'S 04', frequency: 135.25, program: 'Wolny lokalny' },
  { id: 'S 05', frequency: 143.25, program: 'Wolny lokalny' },
  { id: 'S 06', frequency: 151.25, program: 'POLSAT' },
  { id: 'S 07', frequency: 159.25, program: 'TV4' },
  { id: 'S 08', frequency: 167.25, program: 'TVN' },
  { id: 'K 06', frequency: 175.25, program: 'TVP INFO' },
  { id: 'K 07', frequency: 183.25, program: 'TVP 1' },
  { id: 'K 08', frequency: 191.25, program: 'TVT' },
  { id: 'K 09', frequency: 199.25, program: 'TVP POLONIA' },
  { id: 'K 10', frequency: 207.25, program: 'TVP 2' },
  { id: 'K 11', frequency: 215.25, program: 'TVP Historia' },
  { id: 'K 12', frequency: 223.25, program: 'TVP 3 Katowice' },
]

export const analogChannelsNew: AnalogChannel[] = [
  { id: 'S 01', frequency: 111.25, program: 'TV PULS' },
  { id: 'K 50', frequency: 703.25, program: 'POLSAT' },
  { id: 'K 51', frequency: 711.25, program: 'TV 4' },
  { id: 'K 52', frequency: 719.25, program: 'TVN' },
  { id: 'K 53', frequency: 727.25, program: 'TVP INFO' },
  { id: 'K 54', frequency: 735.25, program: 'TVP 1' },
  { id: 'K 55', frequency: 743.25, program: 'TVP 2' },
  { id: 'K 56', frequency: 751.25, program: 'TVP HISTORIA' },
  { id: 'K 57', frequency: 759.25, program: 'TVP 3 KATOWICE' },
  { id: 'K 58', frequency: 767.25, program: 'TVT' },
  { id: 'K 59', frequency: 775.25, program: 'TVP POLONIA' },
  { id: 'K 60', frequency: 783.25, program: 'TV TRWAM' },
  { id: 'K 61', frequency: 791.25, program: 'LOKALNY – TV ZABRZE' },
  { id: 'K 62', frequency: 799.25, program: 'LOKALNY – ŚTM' },
]
