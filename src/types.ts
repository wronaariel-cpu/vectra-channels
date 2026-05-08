export type Category =
  | 'radio'
  | 'ogolne'
  | 'sport'
  | 'filmy'
  | 'dzieci'
  | 'dokumentalne'
  | 'muzyka'
  | 'styl'
  | 'informacje'
  | 'doroslych'

export interface Channel {
  lcn: number
  name: string
  transponder: number
  frequency: string
  serviceId: number
}

export const CATEGORIES: { key: Category; label: string; min: number; max: number; color: string; bg: string }[] = [
  { key: 'radio',        label: 'Radio',           min: 1,   max: 99,  color: '#1a6fc4', bg: '#ddeeff' },
  { key: 'ogolne',       label: 'Ogólnotematyczne', min: 100, max: 199, color: '#2d5a1b', bg: '#e8f5e2' },
  { key: 'sport',        label: 'Sport',            min: 200, max: 299, color: '#a05000', bg: '#fff0d8' },
  { key: 'filmy',        label: 'Filmy i Seriale',  min: 300, max: 399, color: '#6b1a9c', bg: '#f5e8ff' },
  { key: 'dzieci',       label: 'Dla Dzieci',       min: 400, max: 499, color: '#a07a00', bg: '#fffbd8' },
  { key: 'dokumentalne', label: 'Dokumentalne',     min: 500, max: 599, color: '#004d60', bg: '#d8f5ff' },
  { key: 'muzyka',       label: 'Muzyczne',         min: 600, max: 699, color: '#8b1a3a', bg: '#ffe8f0' },
  { key: 'styl',         label: 'Styl Życia',       min: 700, max: 799, color: '#1a6b5a', bg: '#e2fff8' },
  { key: 'informacje',   label: 'Informacyjne',     min: 800, max: 899, color: '#3a3a3a', bg: '#f0f0f0' },
  { key: 'doroslych',    label: 'Dla Dorosłych',    min: 900, max: 999, color: '#8b1a1a', bg: '#ffe8e8' },
]

export function getCategory(lcn: number): Category {
  for (const cat of CATEGORIES) {
    if (lcn >= cat.min && lcn <= cat.max) return cat.key
  }
  return 'ogolne'
}

export function getCategoryInfo(lcn: number) {
  return CATEGORIES.find(c => lcn >= c.min && lcn <= c.max) ?? CATEGORIES[1]!
}
