import { Link } from "@tanstack/react-router";
import { Instagram, Mail, MapPin } from "lucide-react";
import logo from "@/assets/prata-z-logo.png";

const catalogo: { label: string; to: string; params?: Record<string, string> }[] = [
  { label: "Blog", to: "/blog" },
  { label: "Colares", to: "/categoria/$slug", params: { slug: "colares" } },
  { label: "Brincos", to: "/categoria/$slug", params: { slug: "brincos" } },
  { label: "Anéis", to: "/categoria/$slug", params: { slug: "aneis" } },
  { label: "Pulseiras", to: "/categoria/$slug", params: { slug: "pulseiras" } },
  { label: "Pingentes", to: "/categoria/$slug", params: { slug: "pingentes" } },
  { label: "Berloques", to: "/categoria/$slug", params: { slug: "berloques" } },
  { label: "Piercings", to: "/categoria/$slug", params: { slug: "piercings" } },
  { label: "Tornozeleiras", to: "/categoria/$slug", params: { slug: "tornozeleiras" } },
  { label: "Cuidados com suas pratas", to: "/categoria/$slug", params: { slug: "cuidados" } },
];

const institucional: { label: string; to: string }[] = [
  { label: "Sobre a Prata Z", to: "/sobre" },
  { label: "Showroom", to: "/showroom" },
  { label: "Garantia 925", to: "/autenticidade" },
  { label: "Grupo VIP WhatsApp", to: "/grupo-vip" },
  { label: "Entrega e frete", to: "/entrega" },
  { label: "Trocas e devoluções", to: "/politica-troca" },
  { label: "Política de privacidade", to: "/politica-privacidade" },
  { label: "Termos de uso", to: "/termos" },
  { label: "Contato", to: "/contato" },
];

export function Footer() {
  return (
    <footer className="bg-foreground text-background mt-12">
      <div className="mx-auto max-w-7xl px-6 sm:px-10 py-20">
        <div className="grid md:grid-cols-4 gap-12">
          <div className="md:col-span-1">
            <img
              src={logo}
              alt="Prata Z Joias"
              className="h-16 w-auto object-contain brightness-0 invert"
            />
            <p className="text-[10px] tracking-[0.45em] uppercase text-background/60 mt-3">
              Joias · Sterling 925
            </p>
            <p className="mt-6 text-sm text-background/70 leading-relaxed">
              Alta joalheria em prata 925 com atendimento personalizado. Peças que
              celebram momentos e acompanham a sua história.
            </p>
          </div>

          <div>
            <h4 className="text-[11px] tracking-[0.3em] uppercase text-background/60">Catálogo</h4>
            <ul className="mt-5 space-y-3 text-sm text-background/85">
              {catalogo.map((item) => (
                <li key={item.label}>
                  {item.params ? (
                    <Link
                      to={item.to as "/categoria/$slug"}
                      params={item.params as { slug: string }}
                      className="hover:text-nude transition"
                    >
                      {item.label}
                    </Link>
                  ) : (
                    <Link to={item.to as "/blog"} className="hover:text-nude transition">
                      {item.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-[11px] tracking-[0.3em] uppercase text-background/60">Institucional</h4>
            <ul className="mt-5 space-y-3 text-sm text-background/85">
              {institucional.map((item) => (
                <li key={item.label}>
                  <Link to={item.to as "/sobre"} className="hover:text-nude transition">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-[11px] tracking-[0.3em] uppercase text-background/60">Atendimento</h4>
            <ul className="mt-5 space-y-3 text-sm text-background/85">
              <li className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-nude mt-0.5 shrink-0" />
                <Link to="/showroom" className="hover:text-nude transition">
                  Showroom (com agendamento)
                </Link>
              </li>
              <li className="flex items-start gap-2">
                <Mail className="h-4 w-4 text-nude mt-0.5 shrink-0" />
                <span>contato@prataz.com.br</span>
              </li>
              <li>
                <Link to="/grupo-vip" className="hover:text-nude transition">
                  Grupo VIP WhatsApp
                </Link>
              </li>
              <li>
                <Link to="/autenticidade" className="hover:text-nude transition">
                  Garantia 925
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-16 pt-8 border-t border-background/15 flex flex-col md:flex-row justify-between gap-4 text-xs text-background/55">
          <p>© {new Date().getFullYear()} Prata Z Joias. Todos os direitos reservados.</p>
          <p>CNPJ 47.369.536/0001-42 · Pagamentos seguros</p>
        </div>
      </div>
    </footer>
  );
}
