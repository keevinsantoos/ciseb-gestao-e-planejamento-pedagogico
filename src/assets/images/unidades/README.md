# Fotos das Unidades CISEB

Coloque as fotos das unidades escolares CISEB nesta pasta (ex: `ciseb_augusto_meira.jpg`).

Depois, vincule-as no arquivo `/src/data/unitSlides.ts`:

```ts
import fotoAugustoMeira from '../assets/images/unidades/ciseb_augusto_meira.jpg';

export const DEFAULT_UNIT_SLIDES: UnitSlide[] = [
  {
    id: 'augusto-meira',
    src: fotoAugustoMeira,
    unitName: 'CISEB EE Augusto Meira',
    municipio: 'Belém',
  },
  // ...
];
```
