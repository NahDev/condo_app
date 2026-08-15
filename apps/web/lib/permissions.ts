import type { Recurso, UsuarioPublico } from "@condo/shared";

export function temPermissao(
  usuario: UsuarioPublico | null,
  recurso: Recurso,
  nivel: "visualizar" | "gerenciar" = "visualizar",
): boolean {
  if (!usuario) return false;
  if (usuario.papel === "SINDICO" || usuario.papel === "ADMIN") return true;

  const permissao = usuario.permissoes.find((p) => p.recurso === recurso);
  if (!permissao) return false;

  return nivel === "gerenciar" ? permissao.podeGerenciar : permissao.podeVisualizar;
}
