"use client";

import Image from "next/image";
import Link from "next/link";
import type { Recurso } from "@condo/shared";
import { useAuth } from "@/lib/auth-context";
import { temPermissao } from "@/lib/permissions";

interface AtalhoBase {
  href: string;
  label: string;
  descricao: string;
  icone: string;
}

const ATALHOS_POR_RECURSO: (AtalhoBase & { recurso: Recurso })[] = [
  {
    recurso: "AVISOS",
    href: "/dashboard/avisos",
    label: "Avisos",
    descricao: "Mural de comunicados do condomínio.",
    icone: "/icon-avisos.jpg",
  },
  {
    recurso: "UNIDADES",
    href: "/dashboard/unidades",
    label: "Unidades",
    descricao: "Blocos e apartamentos do condomínio.",
    icone: "/icon-unidades.jpg",
  },
  {
    recurso: "AREAS_COMUNS",
    href: "/dashboard/areas",
    label: "Áreas comuns",
    descricao: "Espaços disponíveis para reserva.",
    icone: "/icon-areas-comuns.jpg",
  },
  {
    recurso: "RESERVAS",
    href: "/dashboard/reservas",
    label: "Reservas",
    descricao: "Agenda das áreas comuns do condomínio.",
    icone: "/icon-reservas.jpg",
  },
  {
    recurso: "OCORRENCIAS",
    href: "/dashboard/ocorrencias",
    label: "Ocorrências",
    descricao: "Abra e acompanhe chamados do condomínio.",
    icone: "/icon-ocorrencias.jpg",
  },
  {
    recurso: "VISITANTES",
    href: "/dashboard/visitantes",
    label: "Visitantes",
    descricao: "Controle de entrada e saída de visitantes.",
    icone: "/icon-visitantes.jpg",
  },
  {
    recurso: "ENCOMENDAS",
    href: "/dashboard/encomendas",
    label: "Encomendas",
    descricao: "Recebimento e retirada de encomendas.",
    icone: "/icon-encomendas.jpg",
  },
];

const ATALHO_USUARIOS: AtalhoBase = {
  href: "/dashboard/usuarios",
  label: "Usuários",
  descricao: "Crie acessos e personalize permissões.",
  icone: "/icon-usuario.jpg",
};

function CartaoAtalho({ href, label, descricao, icone }: AtalhoBase) {
  return (
    <Link
      href={href}
      className="group flex flex-col items-center gap-3 rounded-lg border border-light-border bg-light-card p-5 text-center transition-colors hover:border-primary dark:border-dark-border dark:bg-dark-card dark:hover:border-primary"
    >
      <Image
        src={icone}
        alt=""
        width={56}
        height={56}
        className="h-14 w-14 rounded-lg border border-light-border object-contain dark:border-dark-border"
      />
      <div>
        <p className="text-sm font-semibold text-light-text group-hover:text-primary dark:text-dark-text">
          {label}
        </p>
        <p className="mt-1 text-xs text-light-text-muted dark:text-dark-text-muted">{descricao}</p>
      </div>
    </Link>
  );
}

export default function DashboardHomePage() {
  const { usuario } = useAuth();
  const podeGerenciarUsuarios = usuario?.papel === "SINDICO" || usuario?.papel === "ADMIN";

  const atalhosVisiveis = ATALHOS_POR_RECURSO.filter((atalho) =>
    temPermissao(usuario, atalho.recurso),
  );

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-light-text dark:text-dark-text">
          Olá, {usuario?.nome?.split(" ")[0]}
        </h1>
        <p className="text-sm text-light-text-muted dark:text-dark-text-muted">
          O que você precisa fazer hoje?
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
        {atalhosVisiveis.map((atalho) => (
          <CartaoAtalho key={atalho.href} {...atalho} />
        ))}
        {podeGerenciarUsuarios && <CartaoAtalho {...ATALHO_USUARIOS} />}
      </div>
    </div>
  );
}
