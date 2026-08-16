export default function PoliticaDePrivacidadePage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-12">
      <div>
        <h1 className="text-2xl font-semibold">Política de Privacidade</h1>
        <p className="mt-1 text-sm text-slate-500">Última atualização: agosto de 2026.</p>
      </div>

      <div className="rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        Este documento é um modelo inicial, criado para orientar o tratamento de dados dentro
        da plataforma conforme a Lei Geral de Proteção de Dados (LGPD — Lei 13.709/2018). Antes
        de publicar formalmente e vincular contratos com condomínios, recomenda-se revisão por
        um advogado especializado, especialmente quanto à definição de controlador/operador e à
        nomeação de um encarregado (DPO).
      </div>

      <section className="space-y-2">
        <h2 className="text-lg font-medium">1. Quem trata os seus dados</h2>
        <p className="text-sm text-slate-700">
          Esta plataforma é fornecida como um serviço (SaaS) contratado pelo condomínio para
          gestão administrativa. Nessa relação, o <strong>condomínio</strong> (representado pelo
          síndico) é, em regra, o <strong>controlador</strong> dos dados de moradores, porteiros
          e visitantes — ou seja, quem decide o que fazer com esses dados. Nós operamos a
          infraestrutura técnica como <strong>operador</strong>, seguindo as instruções do
          condomínio e as finalidades descritas abaixo.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-medium">2. Quais dados coletamos</h2>
        <ul className="list-disc space-y-1 pl-5 text-sm text-slate-700">
          <li>
            <strong>Usuários do sistema</strong> (síndico, moradores, porteiros): nome, e-mail,
            unidade vinculada e papel de acesso.
          </li>
          <li>
            <strong>Visitantes</strong>: nome, documento de identificação (quando informado pela
            portaria) e horário de entrada/saída.
          </li>
          <li>
            <strong>Encomendas</strong>: descrição do item e unidade destinatária.
          </li>
          <li>
            <strong>Uso da plataforma</strong>: avisos publicados, reservas de área comum,
            ocorrências registradas e respectivos horários.
          </li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-medium">3. Para que usamos esses dados</h2>
        <p className="text-sm text-slate-700">
          Os dados são usados exclusivamente para viabilizar a gestão do condomínio: controle de
          acesso e portaria, comunicação entre síndico e moradores, organização de reservas e
          registro de ocorrências. Não vendemos, alugamos nem compartilhamos dados pessoais com
          terceiros para fins de marketing.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-medium">4. Base legal</h2>
        <p className="text-sm text-slate-700">
          O tratamento se baseia principalmente na <strong>execução de contrato</strong> (Art. 7º,
          V, LGPD) firmado entre o condomínio e seus moradores/prestadores, e no{" "}
          <strong>legítimo interesse</strong> do condomínio em manter a segurança e organização
          do prédio (Art. 7º, IX). Dados sensíveis não são coletados intencionalmente por esta
          plataforma.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-medium">5. Com quem compartilhamos</h2>
        <p className="text-sm text-slate-700">
          Os dados ficam armazenados em provedores de infraestrutura em nuvem contratados para
          hospedar a aplicação e o banco de dados. Esses provedores têm acesso apenas como parte
          da operação técnica do serviço, não para uso próprio. Não compartilhamos dados com
          outros condomínios ou com terceiros fora dessa cadeia técnica, exceto quando exigido
          por lei ou ordem judicial.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-medium">6. Segurança</h2>
        <ul className="list-disc space-y-1 pl-5 text-sm text-slate-700">
          <li>Senhas armazenadas com hash (nunca em texto puro).</li>
          <li>Documentos de identificação de visitantes criptografados em repouso no banco.</li>
          <li>
            Acesso aos dados controlado por permissões — cada pessoa só vê o que é necessário
            para sua função, e moradores só enxergam dados da própria unidade.
          </li>
          <li>Conexões entre o aplicativo e o servidor protegidas por HTTPS.</li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-medium">7. Por quanto tempo guardamos</h2>
        <p className="text-sm text-slate-700">
          Os dados são mantidos enquanto durar o contrato entre o condomínio e a plataforma, ou
          pelo prazo necessário para cumprir obrigações legais (ex: registros de portaria para
          fins de segurança). Ao encerrar o contrato, o condomínio pode solicitar a exclusão ou
          exportação dos dados.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-medium">8. Seus direitos</h2>
        <p className="text-sm text-slate-700">
          Conforme o Art. 18 da LGPD, você pode solicitar ao síndico do seu condomínio (como
          controlador dos dados) a confirmação, o acesso, a correção, a anonimização, a
          portabilidade ou a exclusão dos seus dados pessoais, bem como informações sobre com
          quem eles foram compartilhados.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-medium">9. Contato</h2>
        <p className="text-sm text-slate-700">
          Para exercer seus direitos ou tirar dúvidas sobre o tratamento dos seus dados, entre em
          contato com a administração do seu condomínio. Para questões técnicas sobre a
          plataforma, utilize os canais de suporte informados pelo síndico.
        </p>
      </section>
    </div>
  );
}
