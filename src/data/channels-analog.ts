export interface AnalogChannel {
  id: string
  frequency: number
  programStary: string
  programNowy: string
}

export const analogChannels: AnalogChannel[] = [
  { id: 'S 01', frequency: 111.25, programStary: 'TV PULS',                          programNowy: 'TV PULS' },
  { id: 'S 02', frequency: 119.25, programStary: 'TV TRWAM',                         programNowy: 'DOCSIS 3.1 OFDM' },
  { id: 'S 03', frequency: 127.25, programStary: 'Wolny – kamery / info lokalne',     programNowy: 'DOCSIS 3.1 OFDM' },
  { id: 'S 04', frequency: 135.25, programStary: 'Wolny lokalny',                    programNowy: 'DOCSIS 3.1 OFDM' },
  { id: 'S 05', frequency: 143.25, programStary: 'Wolny lokalny',                    programNowy: 'DOCSIS 3.1 OFDM' },
  { id: 'S 06', frequency: 151.25, programStary: 'POLSAT',                           programNowy: 'DOCSIS 3.1 OFDM' },
  { id: 'S 07', frequency: 159.25, programStary: 'TV4',                              programNowy: 'DOCSIS 3.1 OFDM' },
  { id: 'S 08', frequency: 167.25, programStary: 'TVN',                              programNowy: 'DOCSIS 3.1 OFDM' },
  { id: 'K 06', frequency: 175.25, programStary: 'TVP INFO',                         programNowy: 'DOCSIS 3.1 OFDM' },
  { id: 'K 07', frequency: 183.25, programStary: 'TVP 1',                            programNowy: 'DOCSIS 3.1 OFDM' },
  { id: 'K 08', frequency: 191.25, programStary: 'TVT',                              programNowy: 'DOCSIS 3.1 OFDM' },
  { id: 'K 09', frequency: 199.25, programStary: 'TVP POLONIA',                      programNowy: 'DOCSIS 3.1 OFDM' },
  { id: 'K 10', frequency: 207.25, programStary: 'TVP 2',                            programNowy: 'DOCSIS 3.1 OFDM' },
  { id: 'K 11', frequency: 215.25, programStary: 'TVP Historia',                     programNowy: 'DOCSIS 3.1 OFDM' },
  { id: 'K 12', frequency: 223.25, programStary: 'TVP 3 Katowice',                   programNowy: 'DOCSIS 3.1 OFDM' },
]
