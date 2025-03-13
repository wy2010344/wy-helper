import { dateFromYearMonthDay, DAYMILLSECONDS, yearMonthDayEqual } from "./util"

export class YearMonthDayVirtualView {
  private constructor(
    public readonly year: number,
    public readonly month: number,
    public readonly day: number
  ) { }

  static from(year: number, month: number, day: number) {
    return new YearMonthDayVirtualView(year, month, day)
  }
  static fromDate(d: Date) {
    return this.from(d.getFullYear(), d.getMonth() + 1, d.getDate())
  }
  _beforeDay!: YearMonthDayVirtualView
  beforeDay() {
    if (!this._beforeDay) {
      const d = dateFromYearMonthDay(this)
      d.setTime(d.getTime() - DAYMILLSECONDS)
      const beforeDay = YearMonthDayVirtualView.fromDate(d)
      beforeDay._nextDay = this
      this._beforeDay = beforeDay
    }
    return this._beforeDay

  }
  _nextDay!: YearMonthDayVirtualView
  nextDay() {
    if (!this._nextDay) {
      const d = dateFromYearMonthDay(this)
      d.setTime(d.getTime() + DAYMILLSECONDS)
      const nextDay = YearMonthDayVirtualView.fromDate(d)
      nextDay._beforeDay = this
      this._nextDay = nextDay
    }
    return this._nextDay
  }
  equals(n: YearMonthDayVirtualView) {
    return yearMonthDayEqual(n, this)
  }
  toNumber() {
    return yearMonthDayToNumber(this.year, this.month, this.day)
  }
}


export function yearMonthDayToNumber(year: number, month: number, day: number) {
  return year * 10000 + month * 100 + day
}