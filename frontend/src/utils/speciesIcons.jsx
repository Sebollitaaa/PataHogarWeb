import {
  PawIcon, DogIcon, CatIcon, RabbitIcon, BirdIcon, RodentIcon, FishIcon, ReptileIcon, OtherAnimalIcon,
} from '../components/icons/Icons';

const MAP = {
  perro: DogIcon,
  gato: CatIcon,
  conejo: RabbitIcon,
  ave: BirdIcon,
  roedor: RodentIcon,
  pez: FishIcon,
  reptil: ReptileIcon,
  otro: OtherAnimalIcon,
};

export function speciesIcon(slug) {
  return MAP[slug] || PawIcon;
}
