export type AppointmentStatusCounts = {
  scheduled: number;
  sent: number;
  confirmed: number;
  canceled: number;
  no_response: number;
  failed: number;
};

export interface AccountUsageModel {
  periodStart: string;
  timezone: string;
  acceptedAppointments: number;
  appointmentsByStatus: AppointmentStatusCounts;
}
