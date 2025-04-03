



/**
 * 
 * @param v 
 * @param format YYYY/yyyy MM DD/dd HH/hh mm ss
 * @returns 
 */
export function dateFormat(v: Date, format: string) {
  var str = format;
  str = str.replace(/yyyy|YYYY/, v.getFullYear() + '');
  str = str.replace(/MM/, (v.getMonth() + 1) > 9 ? (v.getMonth() + 1).toString() : '0' + (v.getMonth() + 1));
  str = str.replace(/dd|DD/, v.getDate() > 9 ? v.getDate().toString() : '0' + v.getDate());
  str = str.replace(/hh|HH/, v.getHours() > 9 ? v.getHours().toString() : '0' + v.getHours());
  str = str.replace(/mm/, v.getMinutes() > 9 ? v.getMinutes().toString() : '0' + v.getMinutes());
  str = str.replace(/ss/, v.getSeconds() > 9 ? v.getSeconds().toString() : '0' + v.getSeconds());
  return str;
}


/**
 * 一天的毫秒数
 */
export const DAYMILLSECONDS = 24 * 60 * 60 * 1000


/**
 * 今天是今年的第几周
 * @param date 
 * @param weekStart 
 * @returns 
 */
export function getWeekOfYear(date: Date, weekStart = 0) {
  const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
  const daysOffset = (firstDayOfYear.getDay() - weekStart + 7) % 7; // 计算1号到本周起始日的偏移
  const daysSinceStart = Math.floor((date.getTime() - firstDayOfYear.getTime()) / DAYMILLSECONDS) + daysOffset;
  return Math.floor(daysSinceStart / 7) + 1;
}
/**
 * 今天是这个月的第几周,第一周包含当月第一天
 * @param date 
 * @param weekStart 0~6
 * @returns 
 */
export function getWeekOfMonth(date: Date, weekStart = 0) {
  const firstDayOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
  const daysOffset = (firstDayOfMonth.getDay() - weekStart + 7) % 7; // 计算1号到本周起始日的偏移
  const daysSinceStart = date.getDate() - 1 + daysOffset; // 计算从当月第一天到今天的天数
  return Math.floor(daysSinceStart / 7) + 1;
}

/**
 * 今天是今年的第几天
 * @param date 
 * @returns 
 */
export function getDayOfYear(date: Date) {
  const startOfYear = new Date(date.getFullYear(), 0, 1);
  return Math.floor((date.valueOf() - startOfYear.valueOf()) / DAYMILLSECONDS) + 1;
}


export interface YearMonthDay {
  year: number
  month: number
  day: number
}
export function dateFromYearMonthDay(n: YearMonthDay) {
  const d = new Date()
  d.setFullYear(n.year)
  d.setMonth(n.month - 1)
  d.setDate(n.day)
  return d
}
export function yearMonthDayEqual(a: YearMonthDay, b: YearMonthDay) {
  return a.year == b.year && a.month == b.month && a.day == b.day
}