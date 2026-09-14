export interface UnitSlide {
  id: string;
  /**
   * Caminho da imagem: pode ser um import local (ex: import foto from '...') ou uma URL direta.
   */
  src: string;
  /**
   * Nome da unidade escolar CISEB
   */
  unitName: string;
  /**
   * Município da unidade no Pará
   */
  municipio: string;
}

/**
 * 📸 CONFIGURAÇÃO DAS IMAGENS DO CARROSSEL DE FUNDO
 *
 * Como adicionar as fotos das suas unidades:
 * 1. Adicione os arquivos das fotos na pasta `src/assets/images/unidades/` (ex: `ciseb_belem.jpg`)
 * 2. Você pode importá-los diretamente aqui:
 *    `import fotoBelem from '../assets/images/unidades/ciseb_belem.jpg';`
 *    e atribuir `src: fotoBelem`
 * 3. Ou insira links diretos de imagens na propriedade `src`.
 */
export const DEFAULT_UNIT_SLIDES: UnitSlide[] = [
  {
    id: 'augusto-meira',
    src: 'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?auto=format&fit=crop&w=1920&q=80',
    unitName: 'CISEB EE Augusto Meira',
    municipio: 'Belém',
  },
  {
    id: 'jose-de-alencar',
    src: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1920&q=80',
    unitName: 'CISEB EE José de Alencar',
    municipio: 'Belém',
  },
  {
    id: 'paulino-de-brito',
    src: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=1920&q=80',
    unitName: 'CISEB EE Paulino de Brito',
    municipio: 'Marabá',
  },
  {
    id: 'raimundo-chaves',
    src: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=1920&q=80',
    unitName: 'CISEB EE Raimundo Chaves',
    municipio: 'Santarém',
  },
  {
    id: 'domingos-marreiros',
    src: 'https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&w=1920&q=80',
    unitName: 'CISEB EE Domingos Marreiros',
    municipio: 'Castanhal',
  },
];
