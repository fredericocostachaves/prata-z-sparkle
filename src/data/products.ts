import p1 from "@/assets/prod-1.jpg";
import p2 from "@/assets/prod-2.jpg";
import p3 from "@/assets/prod-3.jpg";
import p4 from "@/assets/prod-4.jpg";
import catAnel from "@/assets/cat-anel.jpg";
import catBrinco from "@/assets/cat-brinco.jpg";
import catColar from "@/assets/cat-colar.jpg";
import catPulseira from "@/assets/cat-pulseira.jpg";

export type CategorySlug =
  | "colares"
  | "brincos"
  | "aneis"
  | "pulseiras"
  | "pingentes"
  | "berloques"
  | "piercings"
  | "tornozeleiras"
  | "cuidados";

export interface Category {
  slug: CategorySlug;
  name: string;
  description: string;
  image: string;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  category: CategorySlug;
  price: number;
  images: string[];
  description: string;
  highlights: string[];
  sizes?: string[];
  tag?: string;
  isNew?: boolean;
  bestSeller?: boolean;
}

export const categories: Category[] = [
  { slug: "colares", name: "Colares", description: "Choker, gargantilhas e correntes em prata 925", image: catColar },
  { slug: "brincos", name: "Brincos", description: "Argolas, ear cuffs, gotas e solitários", image: catBrinco },
  { slug: "aneis", name: "Anéis", description: "Solitários, falanges e alianças delicadas", image: catAnel },
  { slug: "pulseiras", name: "Pulseiras", description: "Riviera, elos e pulseiras com berloques", image: catPulseira },
  { slug: "pingentes", name: "Pingentes", description: "Símbolos, letras e peças que contam histórias", image: catColar },
  { slug: "berloques", name: "Berloques", description: "Charms para personalizar suas pulseiras", image: catPulseira },
  { slug: "piercings", name: "Piercings", description: "Piercings de prata 925 hipoalergênicos", image: catBrinco },
  { slug: "tornozeleiras", name: "Tornozeleiras", description: "Delicadas e perfeitas para qualquer estação", image: catPulseira },
  { slug: "cuidados", name: "Cuidados com suas pratas", description: "Flanelas, líquidos e acessórios para conservar", image: catAnel },
];

const imgs = [p1, p2, p3, p4, catAnel, catBrinco, catColar, catPulseira];

function makeProduct(
  i: number,
  category: CategorySlug,
  name: string,
  price: number,
  description: string,
  extras: Partial<Product> = {},
): Product {
  const slug = `${category}-${name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}-${i}`;
  return {
    id: `${category}-${i}`,
    slug,
    name,
    category,
    price,
    images: [imgs[i % imgs.length], imgs[(i + 1) % imgs.length], imgs[(i + 2) % imgs.length]],
    description,
    highlights: [
      "Prata esterlina 925 com selo de autenticidade",
      "Embalagem premium pronta para presentear",
    ],
    sizes: extras.sizes,
    ...extras,
  };
}

export const products: Product[] = [
  makeProduct(0, "colares", "Colar Coração Eterno", 189, "Pingente coração com acabamento polido em prata 925.", { tag: "Mais amado", bestSeller: true }),
  makeProduct(1, "colares", "Choker Veneziana", 169, "Corrente veneziana fina, perfeita para sobreposição.", { isNew: true }),
  makeProduct(2, "colares", "Gargantilha Estrela", 199, "Estrela cravejada em zircônias, brilho discreto."),
  makeProduct(3, "brincos", "Argola Lisa Polida", 149, "Clássica argola lisa, leve e versátil.", { bestSeller: true }),
  makeProduct(4, "brincos", "Ear Cuff Folha", 129, "Ear cuff com design floral, sem necessidade de furo."),
  makeProduct(5, "brincos", "Brinco Gota Cravejado", 219, "Gota com microcravação, brilho elegante.", { isNew: true, bestSeller: true }),
  makeProduct(6, "aneis", "Trio de Anéis Delicados", 229, "Conjunto com três anéis finos e combináveis.", { tag: "Novidade", sizes: ["12", "14", "16", "18", "20"] }),
  makeProduct(7, "aneis", "Solitário Zircônia", 259, "Solitário clássico com zircônia central.", { sizes: ["12", "14", "16", "18", "20"] }),
  makeProduct(8, "aneis", "Aliança Polida 4mm", 299, "Aliança em prata 925 com acabamento polido.", { sizes: ["12", "14", "16", "18", "20", "22"] }),
  makeProduct(9, "pulseiras", "Pulseira Riviera Cravejada", 319, "Riviera cravejada em zircônias brancas.", { tag: "Edição limitada" }),
  makeProduct(10, "pulseiras", "Pulseira Elos Cubanos", 249, "Elos cubanos em prata 925 com fechamento seguro."),
  makeProduct(11, "pulseiras", "Bracelete Liso", 279, "Bracelete polido, leve e atemporal."),
  makeProduct(12, "pingentes", "Pingente Letra Personalizada", 99, "Escolha sua letra e personalize sua corrente."),
  makeProduct(13, "pingentes", "Pingente Infinito", 119, "Símbolo do infinito com acabamento polido."),
  makeProduct(14, "pingentes", "Pingente Mandala", 139, "Mandala com detalhes vazados em prata 925."),
  makeProduct(15, "berloques", "Berloque Coração", 89, "Charm em formato de coração para personalizar pulseiras."),
  makeProduct(16, "berloques", "Berloque Estrela do Mar", 95, "Charm marinho com acabamento detalhado."),
  makeProduct(17, "berloques", "Berloque Inicial", 89, "Charm com letras para personalizar."),
  makeProduct(18, "piercings", "Piercing Argola Tragus", 79, "Argola fina hipoalergênica em prata 925.", { isNew: true }),
  makeProduct(19, "piercings", "Piercing Helix Estrela", 89, "Piercing helix com estrela cravejada."),
  makeProduct(20, "tornozeleiras", "Tornozeleira Veneziana", 159, "Corrente veneziana delicada com fecho seguro."),
  makeProduct(21, "tornozeleiras", "Tornozeleira Coração", 179, "Pingente coração em corrente fina."),
  makeProduct(22, "cuidados", "Flanela Antiembaçante", 29, "Flanela especial para limpeza e brilho da prata."),
  makeProduct(23, "cuidados", "Líquido Restaurador de Brilho", 49, "Líquido específico para joias em prata 925."),
];

export function getCategory(slug: string) {
  return categories.find((c) => c.slug === slug);
}

export function getProductsByCategory(slug: string) {
  return products.filter((p) => p.category === slug);
}

export function getProductBySlug(slug: string) {
  return products.find((p) => p.slug === slug);
}

export function searchProducts(query: string) {
  const q = query.toLowerCase().trim();
  if (!q) return [];
  return products.filter(
    (p) =>
      p.name.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q),
  );
}

export function getBestSellers() {
  return products.filter((p) => p.bestSeller || p.tag === "Mais amado" || p.tag === "Edição limitada").slice(0, 4);
}

export const formatPrice = (n: number) =>
  n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export const formatInstallment = (n: number, parts = 4) =>
  `${parts}x de ${formatPrice(n / parts)} sem juros`;
