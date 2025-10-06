import moment from 'moment-timezone'

export function localTimeWithUserTz(startSeconds: number): string {
  const tz = moment.tz.guess()
  return moment.unix(startSeconds).tz(tz).format('HH:mm z')
}
