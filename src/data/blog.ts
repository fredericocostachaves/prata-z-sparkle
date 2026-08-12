import hero1 from "@/assets/hero-1.jpg";
import hero2 from "@/assets/hero-2.jpg";
import hero3 from "@/assets/hero-3.jpg";
import catAnel from "@/assets/cat-anel.jpg";
import catBrinco from "@/assets/cat-brinco.jpg";
import catColar from "@/assets/cat-colar.jpg";
import catPulseira from "@/assets/cat-pulseira.jpg";
import unboxing from "@/assets/unboxing.jpg";
import showroom from "@/assets/showroom.jpg";

export type BlockType =
  | { type: "p"; text: string }
  | { type: "h2"; text: string }
  | { type: "h3"; text: string }
  | { type: "quote"; text: string; author?: string }
  | { type: "list"; items: string[] }
  | { type: "image"; src: string; alt: string; caption?: string };

export interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  category: string;
  cover: string;
  readTime: number;
  featured?: boolean;
  body: BlockType[];
}

export const categories = [
  "Cuidados",
  "Inspiração",
  "Tendências",
  "Sobre nós",
  "Presentes",
] as const;

export const posts: BlogPost[] = [
  {
    slug: "como-cuidar-prata-925",
    title: "Como cuidar da sua prata 925 no dia a dia",
    excerpt:
      "Dicas simples e práticas para preservar o brilho e a beleza das suas joias em prata 925 por muitos anos.",
    date: "2026-04-15",
    category: "Cuidados",
    cover: catAnel,
    readTime: 5,
    featured: true,
    body: [
      {
        type: "p",
        text: "A prata 925 é uma das ligas mais nobres da joalheria: 92,5% de prata pura e 7,5% de outros metais, combinação que garante resistência sem abrir mão do brilho. Com os cuidados certos, uma peça atravessa gerações.",
      },
      { type: "h2", text: "O básico que faz diferença" },
      {
        type: "list",
        items: [
          "Guarde suas joias em local seco, longe da umidade e da luz direta.",
          "Evite contato com perfumes, cremes, cloro e produtos de limpeza.",
          "Coloque a joia por último ao se arrumar e retire-a primeiro ao voltar para casa.",
          "Limpe periodicamente com flanela própria para prata, sempre com movimentos suaves.",
        ],
      },
      {
        type: "image",
        src: catBrinco,
        alt: "Brincos em prata 925 sobre superfície clara",
        caption: "Peças guardadas separadamente evitam riscos entre si.",
      },
      { type: "h2", text: "Por que a prata escurece?" },
      {
        type: "p",
        text: "O escurecimento é uma reação natural do metal com o enxofre presente no ar e na pele. Não é defeito, e é totalmente reversível com limpeza adequada.",
      },
      {
        type: "quote",
        text: "Joia gasta é joia amada — o que ela pede é ritual de cuidado, não vitrine.",
        author: "Equipe Prata Z",
      },
      { type: "h3", text: "Quando procurar polimento profissional" },
      {
        type: "p",
        text: "Se a peça tem detalhes trabalhados, pedras ou banho especial, prefira a manutenção com quem entende. No nosso showroom fazemos polimento e pequenos ajustes — basta agendar sua visita.",
      },
    ],
  },
  {
    slug: "guia-presentes-joias",
    title: "Guia de presentes: a joia certa para cada ocasião",
    excerpt:
      "Aniversário, formatura, dia das mães — como escolher a peça perfeita para cada momento e cada estilo.",
    date: "2026-03-28",
    category: "Presentes",
    cover: catColar,
    readTime: 6,
    body: [
      {
        type: "p",
        text: "Presentear com joia é presentear com memória. A peça certa não é a mais cara, é a que conversa com o estilo de quem recebe.",
      },
      { type: "h2", text: "Comece pelo estilo, não pelo preço" },
      {
        type: "p",
        text: "Observe o que a pessoa já usa: peças delicadas do dia a dia ou statement marcantes? Prata polida ou acabamento fosco? Essa leitura resolve metade da escolha.",
      },
      {
        type: "list",
        items: [
          "Aniversário: pingentes com significado pessoal.",
          "Formatura: anéis clássicos que marcam a conquista.",
          "Dia das mães: colares delicados para uso diário.",
          "Namoro: pulseiras de elos para sobreposição.",
        ],
      },
      {
        type: "image",
        src: unboxing,
        alt: "Embalagem de presente Prata Z",
        caption: "Toda peça sai daqui pronta para presentear.",
      },
      {
        type: "quote",
        text: "A embalagem é parte do presente. Abrir uma caixa Prata Z já é um pequeno ritual.",
      },
    ],
  },
  {
    slug: "tendencias-2026",
    title: "Tendências de joias para 2026",
    excerpt:
      "Sobreposições, peças statement e o retorno do clássico atemporal: o que vai brilhar neste ano.",
    date: "2026-02-10",
    category: "Tendências",
    cover: hero2,
    readTime: 4,
    body: [
      {
        type: "p",
        text: "2026 chega com um movimento claro: menos regras, mais intenção. As sobreposições continuam fortes, mas com curadoria — peças que contam histórias diferentes no mesmo pulso.",
      },
      { type: "h2", text: "Sobreposição com intenção" },
      {
        type: "p",
        text: "Misture comprimentos e espessuras, mantendo uma peça protagonista. Colares choker com correntes longas seguem sendo a combinação mais elegante da estação.",
      },
      {
        type: "image",
        src: catPulseira,
        alt: "Pulseiras em prata 925 sobrepostas",
      },
      { type: "h3", text: "O clássico volta (e fica)" },
      {
        type: "p",
        text: "Argolas, solitários e correntes veneziana provam que atemporal nunca sai da vitrine. São as peças que você usa hoje e empresta para a próxima geração.",
      },
    ],
  },
  {
    slug: "historia-prata-z",
    title: "A história por trás da Prata Z",
    excerpt:
      "Conheça a paixão, o cuidado e as escolhas por trás de cada peça da nossa coleção.",
    date: "2026-01-05",
    category: "Sobre nós",
    cover: showroom,
    readTime: 5,
    body: [
      {
        type: "p",
        text: "A Prata Z nasceu de um incômodo simples: joia bonita não deveria ser inacessível, nem o atendimento impessoal.",
      },
      { type: "h2", text: "Atendimento como assinatura" },
      {
        type: "p",
        text: "Cada cliente conversa com alguém que conhece as peças de verdade. É por isso que mantemos o showroom com hora marcada — para dedicar tempo a cada história.",
      },
      {
        type: "quote",
        text: "Não vendemos catálogo. Ajudamos a escolher a peça que vai ficar.",
      },
      {
        type: "image",
        src: hero3,
        alt: "Detalhe de joia em prata 925 da Prata Z",
      },
    ],
  },
  {
    slug: "prata-ou-prateado-diferencas",
    title: "Prata 925 ou prateado? Entenda a diferença",
    excerpt:
      "O que muda entre uma joia de prata legítima e uma peça apenas banhada — e como reconhecer cada uma.",
    date: "2026-03-02",
    category: "Cuidados",
    cover: hero1,
    readTime: 4,
    body: [
      {
        type: "p",
        text: "Peça prateada é metal comum com uma camada superficial. Prata 925 é prata em toda a estrutura, com selo de autenticidade e valor que se mantém.",
      },
      { type: "h2", text: "Como identificar" },
      {
        type: "list",
        items: [
          "Procure o selo 925 gravado na peça.",
          "Prata legítima escurece com o tempo — banho barato descasca.",
          "Peso e toque: prata é mais densa e gelada ao contato.",
        ],
      },
      {
        type: "p",
        text: "Todas as peças Prata Z acompanham garantia de autenticidade em prata 925.",
      },
    ],
  },
  {
    slug: "sobreposicao-colares",
    title: "A arte da sobreposição de colares",
    excerpt:
      "Comprimentos, espessuras e proporções: um guia visual para montar combinações harmônicas.",
    date: "2026-02-24",
    category: "Inspiração",
    cover: catColar,
    readTime: 5,
    body: [
      {
        type: "p",
        text: "Sobrepor colares é questão de ritmo. Três peças costumam ser o número mágico: uma curta, uma média e uma longa.",
      },
      { type: "h2", text: "Regra dos três dedos" },
      {
        type: "p",
        text: "Deixe cerca de três dedos de distância entre cada colar. Isso evita que as correntes se embaracem e dá respiro visual ao conjunto.",
      },
      {
        type: "image",
        src: catColar,
        alt: "Colares em prata 925 sobrepostos",
        caption: "Choker, corrente média e pingente longo.",
      },
    ],
  },
  {
    slug: "aneis-formato-maos",
    title: "Anéis: como escolher pelo formato das mãos",
    excerpt:
      "Dedos longos, curtos, largos ou finos — cada mão pede um desenho de anel diferente.",
    date: "2026-01-28",
    category: "Inspiração",
    cover: catAnel,
    readTime: 4,
    body: [
      {
        type: "p",
        text: "Não existe anel errado, existe proporção. Entender o formato da sua mão facilita escolhas que valorizam ainda mais o conjunto.",
      },
      {
        type: "list",
        items: [
          "Dedos longos: anéis largos e peças statement.",
          "Dedos curtos: desenhos verticais e alongados.",
          "Dedos finos: falangeiras e aros delicados sobrepostos.",
        ],
      },
    ],
  },
  {
    slug: "joias-para-presentear-em-datas",
    title: "Datas especiais: montando um presente memorável",
    excerpt:
      "Como combinar peça, embalagem e mensagem para transformar a entrega em um momento.",
    date: "2026-04-02",
    category: "Presentes",
    cover: unboxing,
    readTime: 3,
    body: [
      {
        type: "p",
        text: "O presente memorável tem três camadas: a escolha certa, a apresentação cuidada e a palavra que acompanha.",
      },
      {
        type: "quote",
        text: "Escreva um bilhete. É o detalhe que ninguém esquece.",
      },
      {
        type: "p",
        text: "Todos os pedidos saem em embalagem premium, prontos para presentear sem etapa extra.",
      },
    ],
  },
  {
    slug: "brincos-do-dia-a-dia",
    title: "Brincos para usar todos os dias sem tirar",
    excerpt:
      "Modelos confortáveis, seguros e resistentes para quem quer praticidade sem abrir mão da elegância.",
    date: "2026-03-18",
    category: "Tendências",
    cover: catBrinco,
    readTime: 4,
    body: [
      {
        type: "p",
        text: "Existe uma categoria de brinco feita para viver com você: leve, com fecho seguro e desenho que combina com tudo.",
      },
      { type: "h2", text: "O que procurar" },
      {
        type: "list",
        items: [
          "Argolas de aro fino com fecho articulado.",
          "Pontos de luz com rosca ou tarraxa de pressão firme.",
          "Prata 925 legítima, que não irrita a pele.",
        ],
      },
    ],
  },
];

export function getPostBySlug(slug: string) {
  return posts.find((p) => p.slug === slug);
}

export function getFeaturedPost() {
  return posts.find((p) => p.featured) ?? posts[0];
}

export function formatDate(date: string) {
  return new Date(`${date}T12:00:00`).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}
