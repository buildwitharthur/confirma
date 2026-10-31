import dayjs from 'dayjs';
import timezonePlugin from 'dayjs/plugin/timezone.js';
import utcPlugin from 'dayjs/plugin/utc.js';

import { DateTimeProvider } from '../../../domain/providers/date-time.provider.js';

dayjs.extend(utcPlugin);
dayjs.extend(timezonePlugin);

export class DayjsDateTimeProvider implements DateTimeProvider {
  constructor(private readonly clock: () => Date = () => new Date()) {}

  now(): Date {
    return this.clock();
  }

  // Recebe uma data já validada pelo Zod; o offset é aplicado pelo Day.js.
  parseRfc3339(value: string): Date {
    return dayjs(value).toDate();
  }

  isFuture(value: Date, reference: Date = this.now()): boolean {
    return value.getTime() > reference.getTime();
  }

  addMinutes(value: Date, minutes: number): Date {
    return dayjs(value).add(minutes, 'minute').toDate();
  }

  // Timezone IANA inválido não tem fallback: o erro do Day.js é propagado.
  getMinutesOfDay(value: Date, timezone: string): number {
    const local = dayjs(value).tz(timezone);

    return local.hour() * 60 + local.minute();
  }

  // Início inclusivo e fim exclusivo, no horário local do timezone.
  isWithinTimeWindow(
    value: Date,
    timezone: string,
    start: string,
    end: string,
  ): boolean {
    const minutes = this.getMinutesOfDay(value, timezone);

    return minutes >= this.toMinutes(start) && minutes < this.toMinutes(end);
  }

  // Se o início de hoje já passou no horário local, usa o de amanhã.
  nextTimeWindowStart(value: Date, timezone: string, start: string): Date {
    const minutes = this.toMinutes(start);
    const local = dayjs(value).tz(timezone);
    const today = local
      .hour(Math.floor(minutes / 60))
      .minute(minutes % 60)
      .second(0)
      .millisecond(0);

    return (today.isAfter(local) ? today : today.add(1, 'day')).toDate();
  }

  // Converte um horário "HH:mm" em minutos desde a meia-noite.
  private toMinutes(time: string): number {
    const [hour = 0, minute = 0] = time.split(':').map(Number);

    return hour * 60 + minute;
  }
}
