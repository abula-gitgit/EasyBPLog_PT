/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { SaltQuestion } from '../types';

export const SALT_QUESTIONS: SaltQuestion[] = [
  {
    id: 1,
    question: '1. Com que frequência você consome embutidos (presunto, mortadela, salame, calabresa, bacon ou salsicha)?',
    category: 'Embutidos e Carnes Processadas',
    options: [
      { label: 'Quase todos os dias (5+ dias/semana)', points: 3 },
      { label: '3 a 4 vezes por semana', points: 2 },
      { label: '1 a 2 vezes por semana', points: 1 },
      { label: 'Raramente ou nunca', points: 0 },
    ],
  },
  {
    id: 2,
    question: '2. Com que frequência você usa temperos prontos em cubo/sachê, caldos industrializados ou sopas de pacote?',
    category: 'Caldos e Temperos Prontos',
    options: [
      { label: 'Quase todos os dias (5+ dias/semana)', points: 3 },
      { label: '3 a 4 vezes por semana', points: 2 },
      { label: '1 a 2 vezes por semana', points: 1 },
      { label: 'Raramente (uso apenas temperos naturais)', points: 0 },
    ],
  },
  {
    id: 3,
    question: '3. Com que frequência você come pizza, lanches rápidos (hambúrguer, salgados fritos, pastel) ou fast-food?',
    category: 'Lanches e Fast-Food',
    options: [
      { label: '3 ou mais vezes por semana', points: 3 },
      { label: '1 a 2 vezes por semana', points: 2 },
      { label: 'Algumas vezes por mês', points: 1 },
      { label: 'Raramente ou nunca', points: 0 },
    ],
  },
  {
    id: 4,
    question: '4. Quantas unidades de pão francês, pão de forma comercial ou biscoito água e sal você consome por dia?',
    category: 'Pães e Massas',
    options: [
      { label: '3 ou mais porções todos os dias', points: 3 },
      { label: '1 a 2 porções por dia', points: 2 },
      { label: 'Algumas vezes por semana', points: 1 },
      { label: 'Raramente ou versão sem sal', points: 0 },
    ],
  },
  {
    id: 5,
    question: '5. Com que frequência você come petiscos salgados (batata chips, salgadinhos de pacote, amendoim salgado, azeitonas)?',
    category: 'Petiscos e Salgadinhos',
    options: [
      { label: 'Quase todos os dias', points: 3 },
      { label: '3 a 4 vezes por semana', points: 2 },
      { label: '1 a 2 vezes por semana', points: 1 },
      { label: 'Raramente (ou castanhas sem sal)', points: 0 },
    ],
  },
  {
    id: 6,
    question: '6. Como você utiliza molhos prontos (shoyu, molho inglês, ketchup, maionese, molhos para salada)?',
    category: 'Molhos e Condimentos',
    options: [
      { label: 'Coloco bastante em quase todas as refeições', points: 3 },
      { label: 'Uso molhos prontos com frequência', points: 2 },
      { label: 'Apenas pequenas quantidades ocasionalmente', points: 1 },
      { label: 'Uso azeite, limão, alho e ervas naturais', points: 0 },
    ],
  },
  {
    id: 7,
    question: '7. Com que frequência você consome pratos congelados prontos (lasanha, nuggets), macarrão instantâneo ou enlatados?',
    category: 'Refeições Prontas',
    options: [
      { label: 'Quase todos os dias (4+ vezes/semana)', points: 3 },
      { label: '2 a 3 vezes por semana', points: 2 },
      { label: 'Uma vez por semana ou menos', points: 1 },
      { label: 'Raramente (comida caseira feita na hora)', points: 0 },
    ],
  },
  {
    id: 8,
    question: '8. Você costuma adicionar sal extra no prato pronto à mesa (saleiro)?',
    category: 'Saleiro à Mesa',
    options: [
      { label: 'Sempre coloco sal antes mesmo de provar', points: 3 },
      { label: 'Costumo colocar sal após provar', points: 2 },
      { label: 'Apenas uma pitada ocasionalmente', points: 1 },
      { label: 'Nunca uso saleiro à mesa', points: 0 },
    ],
  },
  {
    id: 9,
    question: '9. Com que frequência você almoça em restaurantes, churrascarias, self-service ou pede marmita/delivery?',
    category: 'Almoço Fora de Casa',
    options: [
      { label: 'Quase todos os dias (4 a 5+ vezes/semana)', points: 3 },
      { label: '2 a 3 vezes por semana', points: 2 },
      { label: 'Uma vez por semana', points: 1 },
      { label: 'Raramente (levo marmita caseira)', points: 0 },
    ],
  },
  {
    id: 10,
    question: '10. Com que frequência você janta fora ou pede comida por aplicativo à noite?',
    category: 'Jantar Fora / Delivery',
    options: [
      { label: 'Quase todos os dias (4+ vezes/semana)', points: 3 },
      { label: '2 a 3 vezes por semana', points: 2 },
      { label: 'Uma vez por semana', points: 1 },
      { label: 'Raramente (jantar preparado em casa)', points: 0 },
    ],
  },
  {
    id: 11,
    question: '11. Com que frequência você consome queijos salgados (prato, mussarela, parmesão, queijo coalho, requeijão)?',
    category: 'Laticínios e Queijos',
    options: [
      { label: 'Várias vezes ao dia', points: 3 },
      { label: 'Uma vez por dia', points: 2 },
      { label: 'Algumas vezes por semana', points: 1 },
      { label: 'Raramente ou ricota/queijo branco sem sal', points: 0 },
    ],
  },
  {
    id: 12,
    question: '12. Qual frase descreve melhor o seu paladar em relação ao sal?',
    category: 'Preferência de Paladar',
    options: [
      { label: 'Prefiro comidas bem temperadas e mais salgadas', points: 3 },
      { label: 'Gosto do tempero padrão do dia a dia', points: 2 },
      { label: 'Prefiro comida com pouco sal e sabor suave', points: 1 },
      { label: 'Cozinho com mínimo de sal usando ervas, cebola e alho', points: 0 },
    ],
  },
];

export function evaluateSaltScore(totalPoints: number): {
  level: 'excellent' | 'good' | 'warning' | 'danger';
  title: string;
  description: string;
  advice: string;
  badgeColor: string;
} {
  if (totalPoints <= 8) {
    return {
      level: 'excellent',
      title: 'Consumo de Sódio Ideal (Meta SBC/ESC)',
      description: 'Sua ingestão estimada de sódio está excelente e alinhada com a meta ideal (< 2.000 mg de sódio ou < 5 g de sal/dia).',
      advice: 'Continue priorizando alimentos frescos, temperos naturais (alho, cebola, cheiro-verde) e evitando ultraprocessados.',
      badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    };
  } else if (totalPoints <= 14) {
    return {
      level: 'good',
      title: 'Consumo Moderado de Sódio (Próximo ao Limite)',
      description: 'Sua ingestão está próxima ao limite máximo recomendado pela Sociedade Brasileira de Cardiologia (SBC) e OMS.',
      advice: 'Troque temperos prontos em cubo por ervas naturais e reduza o consumo de embutidos e queijos amarelos.',
      badgeColor: 'bg-blue-100 text-blue-800 border-blue-300',
    };
  } else if (totalPoints <= 21) {
    return {
      level: 'warning',
      title: 'Consumo Elevado de Sal (Risco para a Pressão)',
      description: 'Seu consumo de sódio ultrapassa as recomendações médicas e pode estar elevando sua pressão arterial.',
      advice: 'Reduza presunto, calabresa, temperos prontos, pães e delivery. Retire o saleiro da mesa.',
      badgeColor: 'bg-amber-100 text-amber-800 border-amber-300',
    };
  } else {
    return {
      level: 'danger',
      title: 'Consumo Muito Alto de Sódio (Atenção Redobrada)',
      description: 'O excesso de sódio retém líquidos e pode diminuir o efeito dos seus medicamentos para pressão alta.',
      advice: 'Converse com seu cardiologista ou nutricionista sobre a dieta DASH e redução de alimentos ultraprocessados.',
      badgeColor: 'bg-rose-100 text-rose-800 border-rose-300',
    };
  }
}

export const BP_MEASUREMENT_RULES = [
  {
    number: '1',
    title: 'Repouso de 5 Minutos Antes',
    desc: 'Permaneça sentado em local calmo por 5 minutos antes de medir. Não converse durante a medição.',
  },
  {
    number: '2',
    title: 'Postura Correta na Cadeira',
    desc: 'Sente-se com as costas apoiadas no encosto da cadeira e mantenha os pés apoiados no chão (não cruze as pernas).',
  },
  {
    number: '3',
    title: 'Braço na Altura do Coração',
    desc: 'Apoie o braço sobre uma mesa para que a braçadeira fique exatamente no nível do coração, com a palma da mão para cima.',
  },
  {
    number: '4',
    title: 'Ajuste Correto da Braçadeira',
    desc: 'Coloque a braçadeira direto na pele (sem mangas grossas), 2 a 3 cm acima da dobra do cotovelo, sem apertar demais.',
  },
  {
    number: '5',
    title: 'Horário da Manhã',
    desc: 'Meça até 1 hora após acordar, depois de esvaziar a bexiga (urinar) e antes do café da manhã e dos medicamentos.',
  },
  {
    number: '6',
    title: 'Horário da Noite',
    desc: 'Meça antes de dormir ou antes do jantar, evitando medir logo após banho quente, bebida alcoólica ou exercício físico.',
  },
  {
    number: '7',
    title: 'Duas Medições (Intervalo de 1 Minuto)',
    desc: 'Faça 2 medições seguidas com 1 minuto de intervalo. O EasyBPLog registra ambas e calcula a média automaticamente.',
  },
];
