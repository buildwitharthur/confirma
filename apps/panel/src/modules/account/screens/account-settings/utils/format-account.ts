/** "1440 min (24 h antes da consulta)", como o protótipo apresenta a antecedência. */
export function formatLeadMinutes(minutes: number) {
	const hours = (minutes / 60).toLocaleString('pt-BR', {
		maximumFractionDigits: 1,
	});

	return `${minutes} min (${hours} h antes da consulta)`;
}
