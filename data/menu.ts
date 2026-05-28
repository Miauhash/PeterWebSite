export type PizzaSize = 'Plataformas (iFood / 99Food)' | 'Pedido Direto (WhatsApp)';

export interface MenuItem {
  id: string;
  name: string;
  description?: string;
  isNew?: boolean;
  priceIfood: number;
  priceWhatsapp?: number;
  category: string;
}

export const menuCategories = [
  'PIZZAS SALGADAS',
  'PIZZAS DOCES',
  'ESFIHAS & MINI PIZZAS',
  'BEBIDAS'
];

export const menuItems: MenuItem[] = [
  { id: 'ps1', category: 'PIZZAS SALGADAS', name: 'Bacon', description: 'Para os amantes do crocante! Generosas fatias de bacon dourado sobre mussarela e molho. Simplesmente irresistível.', priceIfood: 45.90, priceWhatsapp: 30.90 },
  { id: 'ps2', category: 'PIZZAS SALGADAS', name: 'Bacon com Alho', description: 'Sabor e aroma que hipnotizam! Bacon crocante e toque marcante do alho torrado, envolvidos em mussarela e molho.', priceIfood: 45.90, priceWhatsapp: 32.90 },
  { id: 'ps3', category: 'PIZZAS SALGADAS', name: 'Bacon com Ovos', description: 'A combinação perfeita para um sabor surpreendente! Bacon crocante e ovos fresquinhos harmonizando com molho e mussarela.', priceIfood: 45.90, priceWhatsapp: 32.90 },
  { id: 'ps4', category: 'PIZZAS SALGADAS', name: 'Bacon Especial', description: 'Uma elevação ao seu paladar! Bacon e a cremosidade do cheddar sobre molho e mussarela.', priceIfood: 45.90, priceWhatsapp: 32.90 },
  { id: 'ps5', category: 'PIZZAS SALGADAS', name: 'Calabresa', description: 'A tradição que conquista! Fatias suculentas de calabresa sobre molho e mussarela.', priceIfood: 41.90, priceWhatsapp: 30.90 },
  { id: 'ps6', category: 'PIZZAS SALGADAS', name: 'Calabresa Acebolada', description: 'Fatias de calabresa e cebola caramelizada cobertas com mussarela e molho.', priceIfood: 43.00, priceWhatsapp: 32.90 },
  { id: 'ps7', category: 'PIZZAS SALGADAS', name: 'Calabresa à Moda', description: 'Calabresa, cebola roxa, pimentão fresco, tomate e cremosidade do catupiry.', priceIfood: 45.90, priceWhatsapp: 32.90 },
  { id: 'ps8', category: 'PIZZAS SALGADAS', name: 'Calabresa Especial', description: 'Calabresa, bacon crocante e cream cheese.', priceIfood: 45.90, priceWhatsapp: 32.90 },
  { id: 'ps9', category: 'PIZZAS SALGADAS', name: 'Calabresa Toscana', description: 'Calabresa, azeitonas e mussarela.', priceIfood: 45.90, priceWhatsapp: 32.90 },
  { id: 'ps10', category: 'PIZZAS SALGADAS', name: 'Frango', description: 'Suculentos pedaços de frango desfiado sobre molho e mussarela.', priceIfood: 40.90, priceWhatsapp: 30.90 },
  { id: 'ps11', category: 'PIZZAS SALGADAS', name: 'Frango com Catupiry', description: 'Frango desfiado e catupiry cremoso sobre molho e mussarela.', priceIfood: 42.00, priceWhatsapp: 32.90 },
  { id: 'ps12', category: 'PIZZAS SALGADAS', name: 'Frango à Moda', description: 'Frango desfiado, cebola roxa e pimentão.', priceIfood: 42.60, priceWhatsapp: 32.90 },
  { id: 'ps13', category: 'PIZZAS SALGADAS', name: 'Frango Especial', description: 'Frango desfiado com cream cheese.', priceIfood: 47.00, priceWhatsapp: 35.90 },
  { id: 'ps14', category: 'PIZZAS SALGADAS', name: 'Mussarela', description: 'Uma generosa camada de mussarela gratinada sobre molho especial.', priceIfood: 37.90, priceWhatsapp: 30.90 },
  { id: 'ps15', category: 'PIZZAS SALGADAS', name: 'Mussarela Especial', description: 'Mussarela derretida, tomate fresco e catupiry.', priceIfood: 45.90, priceWhatsapp: 32.90 },
  { id: 'ps16', category: 'PIZZAS SALGADAS', name: 'Portuguesa', description: 'Molho, queijo mussarela, cebola, pimentão, azeitona, ovo e orégano.', isNew: true, priceIfood: 45.90, priceWhatsapp: 32.00 },
  { id: 'pd1', category: 'PIZZAS DOCES', name: 'Banana Nevada', description: 'Creme de leite, banana e chocolate branco.', isNew: true, priceIfood: 45.90, priceWhatsapp: 32.00 },
  { id: 'pd2', category: 'PIZZAS DOCES', name: 'Brigadeiro', description: 'Creme de leite, chocolate meio amargo e granulado.', isNew: true, priceIfood: 45.90, priceWhatsapp: 32.00 },
  { id: 'es1', category: 'ESFIHAS & MINI PIZZAS', name: 'Calabresa', description: 'Mussarela derretida e pedacinhos suculentos de calabresa.', priceIfood: 7.00 },
  { id: 'es2', category: 'ESFIHAS & MINI PIZZAS', name: 'Alho', description: 'Molho, mussarela e alho torrado.', priceIfood: 7.00 },
  { id: 'es3', category: 'ESFIHAS & MINI PIZZAS', name: 'Bacon', description: 'Molho, mussarela e bacon crocante.', priceIfood: 8.00 },
  { id: 'es4', category: 'ESFIHAS & MINI PIZZAS', name: 'Bacon com Ovos', description: 'Molho, mussarela, bacon e ovos.', priceIfood: 9.00 },
  { id: 'es5', category: 'ESFIHAS & MINI PIZZAS', name: 'Frango', description: 'Molho, mussarela e frango desfiado.', priceIfood: 8.00 },
  { id: 'es6', category: 'ESFIHAS & MINI PIZZAS', name: 'Frango com Catupiry', description: 'Molho, mussarela, frango e catupiry.', priceIfood: 10.00 },
  { id: 'es7', category: 'ESFIHAS & MINI PIZZAS', name: 'Frango Especial', description: 'Molho, mussarela, frango, provolone e cream cheese.', priceIfood: 12.00 },
  { id: 'bb1', category: 'BEBIDAS', name: 'Guaravita Natural 290ml', priceIfood: 3.00 }
];
