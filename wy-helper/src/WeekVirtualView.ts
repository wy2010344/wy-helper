import { formatFirstWeek } from "./YearMonthVirtualView"





export interface YearMonthDay {
  year: number
  month: number
  day: number
}

export function yearMonthDayEqual(a: YearMonthDay, b: YearMonthDay) {
  return a.year == b.year && a.month == b.month && a.day == b.day
}
export function weekVirtualViewGetKey(a: WeekVirtualView) {
  return a.getKeys()
}

export const DAYMILLSECONDS = 24 * 60 * 60 * 1000
export function dateFromYearMonthDay(n: YearMonthDay) {
  const d = new Date()
  d.setFullYear(n.year)
  d.setMonth(n.month - 1)
  d.setDate(n.day)
  return d
}
export class WeekVirtualView {
  static from(
    year: number,
    month: number,
    day: number,
    firstWeek: number
  ) {
    const d = new Date()
    d.setFullYear(year)
    d.setMonth(month - 1)
    d.setDate(day)
    return this.fromv(d, firstWeek)
  }
  private static fromv(
    d: Date,
    firstWeek: number
  ) {
    firstWeek = formatFirstWeek(firstWeek)
    const time = d.getTime()
    const weekDay = d.getDay()
    const diff = weekDay - firstWeek
    if (diff > 0) {
      //今天是周2,但从周1开始
      d.setTime(time - diff * DAYMILLSECONDS)
    } else if (diff < 0) {
      //今天是周1,但从周2开始
      d.setTime(time - (7 + diff) * (DAYMILLSECONDS))
    }
    const cells: YearMonthDay[] = []
    for (let i = 0; i < 7; i++) {
      cells.push({
        year: d.getFullYear(),
        month: d.getMonth() + 1,
        day: d.getDate()
      })
      d.setTime(d.getTime() + DAYMILLSECONDS)
    }
    return new WeekVirtualView(cells, firstWeek)
  }
  private constructor(
    readonly cells: readonly Readonly<YearMonthDay>[],
    readonly firstWeek: number
  ) { }


  private _keys!: number[]
  getKeys() {
    if (!this._keys) {
      const cell = this.cells[0]
      this._keys = [cell.year, cell.month, cell.day]
    }
    return this._keys
  }

  _beforeWeek!: WeekVirtualView
  beforeWeek() {
    if (!this._beforeWeek) {
      const d = dateFromYearMonthDay(this.cells[0])
      d.setTime(d.getTime() - DAYMILLSECONDS)
      this._beforeWeek = WeekVirtualView.fromv(d, this.firstWeek)
    }
    return this._beforeWeek
  }
  _nextWeek!: WeekVirtualView
  nextWeek() {
    if (!this._nextWeek) {
      const d = dateFromYearMonthDay(this.cells[this.cells.length - 1])
      d.setTime(d.getTime() + DAYMILLSECONDS)
      this._nextWeek = WeekVirtualView.fromv(d, this.firstWeek)
    }
    return this._nextWeek
  }
}