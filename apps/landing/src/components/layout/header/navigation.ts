export interface NavigationItem {
  href: string;
  label: string;
  external?: boolean;
}

export const primaryNavigation: NavigationItem[] = [
  { href: '#como-funciona', label: 'Como funciona' },
  { href: '#painel', label: 'Painel' },
  { href: '#integracao', label: 'Integração' },
];

export const mobileNavigation: NavigationItem[] = [
  { href: '#como-funciona', label: 'Como funciona' },
  { href: '#whatsapp', label: 'WhatsApp' },
  { href: '#painel', label: 'Painel de acompanhamento' },
  { href: '#integracao', label: 'Integração' },
];

export const utilityNavigation: NavigationItem[] = [
  {
    href: 'https://docs.useconfirma.com.br',
    label: 'Documentação',
    external: true,
  },
  {
    href: 'https://app.useconfirma.com.br',
    label: 'Entrar',
    external: true,
  },
];

export const mobileUtilityNavigation: NavigationItem[] = [
  { ...utilityNavigation[0] },
  { ...utilityNavigation[1], label: 'Entrar no painel' },
];
