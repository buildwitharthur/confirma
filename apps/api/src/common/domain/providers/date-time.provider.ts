export interface DateTimeProvider {
  now(): Date;
  parseRfc3339(value: string): Date;
  isFuture(value: Date, reference?: Date): boolean;
  addMinutes(value: Date, minutes: number): Date;
  getMinutesOfDay(value: Date, timezone: string): number;
  isWithinTimeWindow(
    value: Date,
    timezone: string,
    start: string,
    end: string,
  ): boolean;
  // Próximo instante, estritamente posterior a value, em que o relógio local do timezone marca start.
  nextTimeWindowStart(value: Date, timezone: string, start: string): Date;
}
