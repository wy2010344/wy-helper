



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