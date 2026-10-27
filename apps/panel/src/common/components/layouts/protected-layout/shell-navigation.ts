import type { LucideIcon } from 'lucide-react';
import {
	Building2,
	Flag,
	KeyRound,
	LayoutGrid,
	List,
	MessageCircle,
	MessageSquareText,
	Shield,
	Webhook,
} from 'lucide-react';
import type { FileRoutesByTo } from '@/routeTree.gen';

type ShellPath = keyof FileRoutesByTo;

export type ShellNavItem = {
	label: string;
	to: ShellPath;
	icon: LucideIcon;
	/** Outras rotas que mantêm este item ativo, além das que começam por `to`. */
	activeOn?: ShellPath[];
};

export type ShellNavGroup = {
	label: string;
	items: ShellNavItem[];
};

/** Fonte única da navegação lateral: incluir, remover ou reordenar um item acontece só aqui. */
export const SHELL_NAVIGATION: ShellNavGroup[] = [
	{
		label: 'Operação',
		items: [
			{ label: 'Visão geral', to: '/visao-geral', icon: LayoutGrid },
			{ label: 'Agendamentos', to: '/agendamentos', icon: List },
		],
	},
	{
		label: 'Preparação',
		items: [{ label: 'Primeiros passos', to: '/primeiros-passos', icon: Flag }],
	},
	{
		label: 'Integrações',
		items: [
			{ label: 'WhatsApp', to: '/integracoes/whatsapp', icon: MessageCircle },
			{ label: 'Webhook e testes', to: '/integracoes/webhook', icon: Webhook },
			{ label: 'Chaves de API', to: '/integracoes/chaves-api', icon: KeyRound },
		],
	},
	{
		label: 'Configurações',
		items: [
			{ label: 'Conta', to: '/configuracoes/conta', icon: Building2 },
			{
				label: 'Mensagens',
				to: '/configuracoes/mensagens',
				icon: MessageSquareText,
			},
			{
				label: 'Privacidade',
				to: '/privacidade',
				icon: Shield,
				activeOn: ['/configuracoes/excluir-conta'],
			},
		],
	},
];
