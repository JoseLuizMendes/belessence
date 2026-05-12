import { Button } from "./ui/button";
import { Separator } from "./ui/separator";
import { Instagram, Facebook, Youtube, X } from "lucide-react";
import { MariLogo } from "./mari-logo";
export default function Footer() {
  return (
    <section>
      {/* Footer */}
      <footer className="bg-muted py-10 sm:py-14 md:py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 sm:gap-10">
            <div>
              <div className="flex items-center gap-2 mb-4 text-brand-wine">
                <MariLogo className="h-9 w-8" />
                <h3 className="text-xl font-poppins font-medium">
                  <span className="uppercase tracking-[0.18em]">Mari</span>{" "}
                  <span className="uppercase tracking-[0.18em] text-ink-soft">Beauty</span>
                </h3>
              </div>
              <p className="text-muted-foreground mb-4">
                Beauty is a lifestyle.
              </p>
              <div className="flex space-x-4">
                <Button variant="ghost" size="icon">
                  <Instagram className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon">
                  <Facebook className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon">
                  <X className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon">
                  <Youtube className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Produtos</h4>
              <div className="space-y-2 text-sm">
                <p className="text-muted-foreground hover:text-foreground cursor-pointer">
                  Fragrâncias Femininas
                </p>
                <p className="text-muted-foreground hover:text-foreground cursor-pointer">
                  Fragrâncias Masculinas
                </p>
                <p className="text-muted-foreground hover:text-foreground cursor-pointer">
                  Unissex
                </p>
                <p className="text-muted-foreground hover:text-foreground cursor-pointer">
                  Edições Limitadas
                </p>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Atendimento</h4>
              <div className="space-y-2 text-sm">
                <p className="text-muted-foreground hover:text-foreground cursor-pointer">
                  Central de Ajuda
                </p>
                <p className="text-muted-foreground hover:text-foreground cursor-pointer">
                  Trocas e Devoluções
                </p>
                <p className="text-muted-foreground hover:text-foreground cursor-pointer">
                  Entrega
                </p>
                <p className="text-muted-foreground hover:text-foreground cursor-pointer">
                  Contato
                </p>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Empresa</h4>
              <div className="space-y-2 text-sm">
                <p className="text-muted-foreground hover:text-foreground cursor-pointer">
                  Sobre Nós
                </p>
                <p className="text-muted-foreground hover:text-foreground cursor-pointer">
                  Política de Privacidade
                </p>
                <p className="text-muted-foreground hover:text-foreground cursor-pointer">
                  Termos de Uso
                </p>
                <p className="text-muted-foreground hover:text-foreground cursor-pointer">
                  Trabalhe Conosco
                </p>
              </div>
            </div>
          </div>

          <Separator className="my-8" />

          <div className="text-center text-sm text-muted-foreground">
            <p>
              &copy; {new Date().getFullYear()} Mari Beauty. Todos os direitos
              reservados.
            </p>
            <p className="mt-1">
              Desenvolvido com ❤️ para despertar seus sentidos
            </p>
          </div>
        </div>
      </footer>
    </section>
  );
}
