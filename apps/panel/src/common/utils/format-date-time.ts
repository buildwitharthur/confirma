/** Data e hora `DD/MM/AAAA HH:MM` no fuso da conta; volta ao fuso do navegador se o da conta não for reconhecido. */
export function formatDateTime(value: string, timeZone: string) {
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return '—';

	const options: Intl.DateTimeFormatOptions = {
		day: '2-digit',
		month: '2-digit',
		year: 'numeric',
		hour: '2-digit',
		minute: '2-digit',
	};

	let formatter: Intl.DateTimeFormat;
	try {
		formatter = new Intl.DateTimeFormat('pt-BR', { ...options, timeZone });
	} catch {
		formatter = new Intl.DateTimeFormat('pt-BR', options);
	}

	return formatter.format(date).replace(', ', ' ');
}
