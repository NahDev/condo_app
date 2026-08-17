"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  ApiError,
  RECURSOS,
  RECURSO_LABEL,
  type Papel,
  type PermissaoRecurso,
  type Unidade,
  type UsuarioAdmin,
} from "@condo/shared";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

const PAPEL_LABEL: Record<Papel, string> = {
  ADMIN: "Admin",
  SINDICO: "Síndico",
  MORADOR: "Morador",
  PORTEIRO: "Porteiro",
};

function permissoesParaMapa(permissoes: PermissaoRecurso[]): Record<string, PermissaoRecurso> {
  const mapa: Record<string, PermissaoRecurso> = {};
  for (const recurso of RECURSOS) {
    const existente = permissoes.find((p) => p.recurso === recurso);
    mapa[recurso] = existente ?? { recurso, podeVisualizar: false, podeGerenciar: false };
  }
  return mapa;
}

export default function UsuariosPage() {
  const { usuario: usuarioLogado } = useAuth();
  const router = useRouter();
  const podeGerenciar = usuarioLogado?.papel === "SINDICO" || usuarioLogado?.papel === "ADMIN";

  const [unidades, setUnidades] = useState<Unidade[]>([]);
  const [usuarios, setUsuarios] = useState<UsuarioAdmin[]>([]);
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [papel, setPapel] = useState<Papel>("MORADOR");
  const [unidadeId, setUnidadeId] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [editando, setEditando] = useState<Record<string, Record<string, PermissaoRecurso>>>({});

  useEffect(() => {
    if (usuarioLogado && !podeGerenciar) {
      router.push("/dashboard/avisos");
    }
  }, [usuarioLogado, podeGerenciar, router]);

  async function carregar() {
    setCarregando(true);
    try {
      const [unidadesResp, usuariosResp] = await Promise.all([
        api.listarUnidades(),
        api.listarUsuarios(),
      ]);
      setUnidades(unidadesResp);
      setUsuarios(usuariosResp);
      if (!unidadeId && unidadesResp.length > 0) {
        setUnidadeId(unidadesResp[0]!.id);
      }
      const mapaInicial: Record<string, Record<string, PermissaoRecurso>> = {};
      for (const u of usuariosResp) {
        mapaInicial[u.id] = permissoesParaMapa(u.permissoes);
      }
      setEditando(mapaInicial);
    } catch {
      setErro("Não foi possível carregar os usuários.");
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    if (podeGerenciar) carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [podeGerenciar]);

  async function handleCriar(e: FormEvent) {
    e.preventDefault();
    if (!nome.trim() || !email.trim() || !senha) return;
    setEnviando(true);
    setErro(null);
    try {
      await api.criarUsuario({
        nome: nome.trim(),
        email: email.trim(),
        senha,
        papel,
        unidadeId: papel === "MORADOR" ? unidadeId : undefined,
      });
      setNome("");
      setEmail("");
      setSenha("");
      await carregar();
    } catch (err) {
      setErro(err instanceof ApiError ? err.message : "Não foi possível criar o usuário.");
    } finally {
      setEnviando(false);
    }
  }

  async function handleToggleAtivo(u: UsuarioAdmin) {
    try {
      await api.atualizarStatusUsuario(u.id, !u.ativo);
      await carregar();
    } catch (err) {
      setErro(err instanceof ApiError ? err.message : "Não foi possível atualizar o usuário.");
    }
  }

  function handleTogglePermissao(
    usuarioId: string,
    recurso: string,
    campo: "podeVisualizar" | "podeGerenciar",
  ) {
    setEditando((prev) => {
      const usuarioPermissoes = { ...prev[usuarioId] };
      const atual = usuarioPermissoes[recurso]!;
      usuarioPermissoes[recurso] = { ...atual, [campo]: !atual[campo] };
      return { ...prev, [usuarioId]: usuarioPermissoes };
    });
  }

  async function handleSalvarPermissoes(usuarioId: string) {
    const permissoes = Object.values(editando[usuarioId] ?? {});
    try {
      await api.atualizarPermissoesUsuario(usuarioId, permissoes);
      await carregar();
    } catch (err) {
      setErro(err instanceof ApiError ? err.message : "Não foi possível salvar as permissões.");
    }
  }

  if (!podeGerenciar) {
    return null;
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center gap-3">
        <img src="/icon-usuario.jpg" alt="" className="h-12 w-12 rounded-lg border border-slate-200 object-contain" />
        <div>
          <h1 className="text-lg font-semibold">Usuários</h1>
          <p className="text-sm text-slate-500">
            Crie acessos para moradores e porteiros e personalize o que cada um pode ver e fazer.
          </p>
        </div>
      </div>

      <form onSubmit={handleCriar} className="space-y-2 rounded-md border border-slate-200 bg-white p-4">
        <div className="grid grid-cols-2 gap-2">
          <input
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Nome"
            className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
          />
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="E-mail"
            type="email"
            className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <input
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            placeholder="Senha inicial"
            type="password"
            className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
          />
          <select
            value={papel}
            onChange={(e) => setPapel(e.target.value as Papel)}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
          >
            <option value="MORADOR">Morador</option>
            <option value="PORTEIRO">Porteiro</option>
            <option value="SINDICO">Síndico</option>
          </select>
        </div>
        {papel === "MORADOR" && (
          <select
            value={unidadeId}
            onChange={(e) => setUnidadeId(e.target.value)}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
          >
            {unidades.map((u) => (
              <option key={u.id} value={u.id}>
                {u.identificacao}
              </option>
            ))}
          </select>
        )}
        <button
          type="submit"
          disabled={enviando}
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
        >
          {enviando ? "Criando..." : "Criar usuário"}
        </button>
      </form>

      {erro && <p className="text-sm text-red-600">{erro}</p>}

      {carregando ? (
        <p className="text-sm text-slate-500">Carregando...</p>
      ) : (
        <ul className="space-y-3">
          {usuarios.map((u) => (
            <li key={u.id} className="rounded-md border border-slate-200 bg-white p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">
                    {u.nome}{" "}
                    <span className="ml-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                      {PAPEL_LABEL[u.papel]}
                    </span>
                    {!u.ativo && (
                      <span className="ml-1 rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-700">
                        Inativo
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-slate-400">
                    {u.email}
                    {u.unidadeIdentificacao ? ` · ${u.unidadeIdentificacao}` : ""}
                  </p>
                </div>
                {u.id !== usuarioLogado?.id && (
                  <button
                    onClick={() => handleToggleAtivo(u)}
                    className="text-sm text-slate-600 hover:text-slate-900"
                  >
                    {u.ativo ? "Desativar" : "Reativar"}
                  </button>
                )}
              </div>

              {(u.papel === "MORADOR" || u.papel === "PORTEIRO") && editando[u.id] && (
                <div className="mt-3 border-t border-slate-100 pt-3">
                  <p className="mb-2 text-xs font-medium text-slate-500">Permissões</p>
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="text-left text-slate-400">
                        <th className="pb-1 font-normal">Recurso</th>
                        <th className="pb-1 font-normal">Ver</th>
                        <th className="pb-1 font-normal">Gerenciar</th>
                      </tr>
                    </thead>
                    <tbody>
                      {RECURSOS.map((recurso) => {
                        const p = editando[u.id]![recurso]!;
                        return (
                          <tr key={recurso}>
                            <td className="py-1">{RECURSO_LABEL[recurso]}</td>
                            <td>
                              <input
                                type="checkbox"
                                checked={p.podeVisualizar}
                                onChange={() => handleTogglePermissao(u.id, recurso, "podeVisualizar")}
                              />
                            </td>
                            <td>
                              <input
                                type="checkbox"
                                checked={p.podeGerenciar}
                                onChange={() => handleTogglePermissao(u.id, recurso, "podeGerenciar")}
                              />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  <button
                    onClick={() => handleSalvarPermissoes(u.id)}
                    className="mt-2 text-sm text-slate-700 underline hover:text-slate-900"
                  >
                    Salvar permissões
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
