import { Map, ShoppingBasket, Swords } from 'lucide-react';
import { getirRush } from './getir-rush-meta';
import { depoTetris } from './depo-tetris-meta';
import { nebulaEscape } from './nebula-escape-meta';

export const games = [
  nebulaEscape,
  getirRush,
  depoTetris,
  {
    id: 'rota-ustasi', name: 'Rota Ustası', type: 'Strateji',
    description: 'En hızlı rotayı çiz, şehri çöz.', color: '#ff8c69',
    ink: '#4a2116', icon: Map, image: '/images/game-covers/rota-ustasi.svg', ready: false, badge: 'YAKINDA',
  },
  {
    id: 'sepet-savasi', name: 'Sepet Savaşı', type: 'Eşleştirme',
    description: 'Ürünleri kap, komboları patlat.', color: '#9ac7ff',
    ink: '#18385f', icon: ShoppingBasket, image: '/images/game-covers/sepet-savasi.svg', ready: false, badge: 'YAKINDA',
  },
  {
    id: 'televole-wars', name: 'Televole Wars', type: 'Kart Savaşı',
    description: 'Kartlarını diz, ekranın yıldızlarını karşı karşıya getir.', color: '#ff4f9a',
    ink: '#3a1230', icon: Swords, image: '/images/game-covers/televole-wars.svg', ready: false, badge: 'YAKINDA',
  },
];
