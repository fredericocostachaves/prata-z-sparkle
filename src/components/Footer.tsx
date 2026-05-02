import { Instagram, Mail, MapPin } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-foreground text-background mt-12">
      <div className="mx-auto max-w-7xl px-6 sm:px-10 py-20">
        <div className="grid md:grid-cols-4 gap-12">
          <div className="md:col-span-2">
            <div className="brand-wordmark text-3xl">
              Prata <span className="italic font-serif text-nude">Z</span>
            </div>
            <p className="text-[10px] tracking-[0.45em] uppercase text-background/60 mt-1">
              Joias · Sterling 925
            </p>
            <p className="mt-6 text-sm text-background/70 max-w-md leading-relaxed">
              Alta joalheria em prata 925 com atendimento personalizado de joias.
              Peças que celebram momentos e acompanham a sua história.
            </p>
            <div className="flex gap-4 mt-6">
              <a href="https://instagram.com" aria-label="Instagram" className="h-10 w-10 rounded-full border border-background/20 flex items-center justify-center hover:bg-nude hover:border-nude transition">
                <Instagram className="h-4 w-4" />
              </a>
            </div>
          </div>

          <div>
            <h4 className="text-[11px] tracking-[0.3em] uppercase text-background/60">Catálogo</h4>
            <ul className="mt-5 space-y-3 text-sm text-background/85">
              <li><a href="#" className="hover:text-nude transition">Anéis</a></li>
              <li><a href="#" className="hover:text-nude transition">Brincos</a></li>
              <li><a href="#" className="hover:text-nude transition">Colares</a></li>
              <li><a href="#" className="hover:text-nude transition">Pulseiras</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-[11px] tracking-[0.3em] uppercase text-background/60">Atendimento</h4>
            <ul className="mt-5 space-y-3 text-sm text-background/85">
              <li className="flex items-center gap-2"><MapPin className="h-4 w-4 text-nude" /> Showroom (com agendamento)</li>
              <li className="flex items-center gap-2"><Mail className="h-4 w-4 text-nude" /> contato@prataz.com.br</li>
              <li><a href="#vip" className="hover:text-nude transition">Grupo VIP WhatsApp</a></li>
              <li><a href="#garantia" className="hover:text-nude transition">Garantia 925</a></li>
            </ul>
          </div>
        </div>

        <div className="mt-16 pt-8 border-t border-background/15 flex flex-col md:flex-row justify-between gap-4 text-xs text-background/55">
          <p>© {new Date().getFullYear()} Prata Z Joias. Todos os direitos reservados.</p>
          <p>CNPJ 00.000.000/0001-00 · Pagamentos seguros</p>
        </div>
      </div>
    </footer>
  );
}
