import { arrayEqual } from "./equal"
import { dateFromYearMonthDay, DAYMILLSECONDS, yearMonthDayEqual } from "./util"
import { YearMonthDayVirtualView } from "./YearMonthDayVirtualView"
import { formatFirstWeek } from "./YearMonthVirtualView"





export function weekVirtualViewGetKey(a: WeekVirtualView) {
  return a.getKeys()
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
    return this.fromDate(d, firstWeek)
  }
  static fromDate(
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
    const cells: YearMonthDayVirtualView[] = []
    for (let i = 0; i < 7; i++) {
      cells.push(YearMonthDayVirtualView.fromDate(d))
      d.setTime(d.getTime() + DAYMILLSECONDS)
    }
    return new WeekVirtualView(cells, firstWeek)
  }
  private constructor(
    readonly cells: readonly Readonly<YearMonthDayVirtualView>[],
    readonly firstWeek: number
  ) { }
  /**
   * 星期的列表，如"一二三四五六日".split("")
   * 下标映射下标
   * @param i 下标，0-6
   * @returns 映射下标
   */
  weekDay(i: number) {
    return (i + this.firstWeek - 1) % 7;
  }
  equals(n: WeekVirtualView) {
    return n.firstWeek == this.firstWeek && arrayEqual(n.cells, this.cells, yearMonthDayEqual)
  }
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
      const beforeWeek = WeekVirtualView.fromDate(d, this.firstWeek)
      this._beforeWeek = beforeWeek
      beforeWeek._nextWeek = this
    }
    return this._beforeWeek
  }
  _nextWeek!: WeekVirtualView
  nextWeek() {
    if (!this._nextWeek) {
      const d = dateFromYearMonthDay(this.cells[this.cells.length - 1])
      d.setTime(d.getTime() + DAYMILLSECONDS)
      const nextWeek = WeekVirtualView.fromDate(d, this.firstWeek)
      this._nextWeek = nextWeek
      nextWeek._beforeWeek = this
    }
    return this._nextWeek
  }
}