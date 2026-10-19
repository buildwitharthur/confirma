import { utilityNavigation } from '../header/navigation';

export interface FooterLink {
  label: string;
  /** Ausente quando o destino ainda não foi publicado; o item é renderizado como texto. */
  href?: string;
}

const [documentation, panel] = utilityNavigation;

export const footerLinks: FooterLink[] = [
  { label: 'Documentação', href: documentation.href },
  { label: 'Painel', href: panel.href },
  // Páginas de termos e privacidade ainda não publicadas (docs/dominio/requisitos/nao-funcionais.md).
  { label: 'Termos' },
  { label: 'Privacidade' },
];
