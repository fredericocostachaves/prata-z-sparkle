import anel from "@/assets/cat-anel.jpg";
import brinco from "@/assets/cat-brinco.jpg";
import colar from "@/assets/cat-colar.jpg";
import pulseira from "@/assets/cat-pulseira.jpg";

const cats = [
  { name: "Anéis", img: anel, desc: "Solitários, falanges e alianças" },
  { name: "Brincos", img: brinco, desc: "Argolas, ear cuffs e gotas" },
  { name: "Colares", img: colar, desc: "Choker, gargantilhas e pingentes" },
  { name: "Pulseiras", img: pulseira, desc: "Riviera, elos e berloques" },
];

export function Categories() {
  return (
    <section id="categorias" className="fluid-section py-24 md:py-32">
      <div className="mx-auto max-w-7xl px-6 sm:px-10">
        <div className="text-center max-w-2xl mx-auto mb-16 md:mb-20">
          <p className="text-[11px] tracking-[0.4em] uppercase text-nude-deep">Catálogo</p>
          <h2 className="mt-5 text-4xl md:text-5xl text-foreground">
            Encontre a joia que conta a sua história
          </h2>
          <p className="mt-5 text-muted-foreground">
            Quatro categorias, uma única promessa: prata 925 trabalhada com delicadeza
            para acompanhar você todos os dias.
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 md:gap-8">
          {cats.map((c, idx) => (
            <a
              key={c.name}
              href="#"
              className="group block reveal"
              style={{ transitionDelay: `${idx * 80}ms` }}
            >
              <div className="img-zoom aspect-[3/4] bg-secondary rounded-sm">
                <img
                  src={c.img}
                  alt={`Categoria ${c.name} em prata 925`}
                  loading="lazy"
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="pt-5 text-center">
                <h3 className="font-serif text-2xl text-foreground group-hover:text-nude-deep transition-colors">
                  {c.name}
                </h3>
                <p className="mt-1 text-xs tracking-wider text-muted-foreground uppercase">
                  {c.desc}
                </p>
                <span className="mt-3 inline-block text-[11px] tracking-[0.3em] uppercase text-foreground story-link">
                  Explorar
                </span>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
