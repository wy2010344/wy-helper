import {
  dateFromYearMonthDay,
  DAYMILLSECONDS,
  getDayOfYear,
  yearMonthDayEqual,
} from './date';
import { WeekVirtualView } from './WeekVirtualView';
import { YearMonthVirtualView } from './YearMonthVirtualView';

export class YearMonthDayVirtualView {
  private constructor(
    public readonly year: number,
    public readonly month: number,
    public readonly day: number,
    private flagDate: Date
  ) {}

  static from(year: number, month: number, day: number) {
    return this.fromDate(dateFromYearMonthDay({ year, month, day }));
  }
  static fromDate(d: Date) {
    return new YearMonthDayVirtualView(
      d.getFullYear(),
      d.getMonth() + 1,
      d.getDate(),
      d
    );
  }

  private _dayOfYear = -1;
  dayOfYear() {
    if (this._dayOfYear < 0) {
      this._dayOfYear = getDayOfYear(this.flagDate);
    }
    return this._dayOfYear;
  }
  private _beforeDay!: YearMonthDayVirtualView;

  getWeek(weekStart: number) {
    return WeekVirtualView.from(this.year, this.month, this.day, weekStart);
  }

  getMonth(weekStart: number) {
    return new YearMonthVirtualView(this.year, this.month, weekStart);
  }

  beforeDay() {
    if (!this._beforeDay) {
      const d = dateFromYearMonthDay(this);
      d.setTime(d.getTime() - DAYMILLSECONDS);
      const beforeDay = YearMonthDayVirtualView.fromDate(d);
      beforeDay._nextDay = this;
      this._beforeDay = beforeDay;
    }
    return this._beforeDay;
  }
  private _nextDay!: YearMonthDayVirtualView;
  nextDay() {
    if (!this._nextDay) {
      const d = dateFromYearMonthDay(this);
      d.setTime(d.getTime() + DAYMILLSECONDS);
      const nextDay = YearMonthDayVirtualView.fromDate(d);
      nextDay._beforeDay = this;
      this._nextDay = nextDay;
    }
    return this._nextDay;
  }
  equals(n: YearMonthDayVirtualView) {
    return yearMonthDayEqual(n, this);
  }
  toNumber() {
    return yearMonthDayToNumber(this.year, this.month, this.day);
  }
}

export function yearMonthDayToNumber(year: number, month: number, day: number) {
  return year * 10000 + month * 100 + day;
}
