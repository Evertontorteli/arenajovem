export const LGPD_VERSION = '1.0';

export const LGPD_TITLE = 'Aviso de Privacidade e Proteção de Dados (LGPD)';

export const LGPD_ORG =
  'Assembleia de Deus Ministério Belém de Jales — Arena Jovem';

export const LGPD_SECTIONS = [
  {
    title: '1. Para que serve este aplicativo',
    body: 'O Arena Jovem é uma plataforma criada para uso pontual da gincana/evento da juventude da Assembleia de Deus Ministério Belém de Jales. O objetivo é organizar cadastro de participantes, equipes, missões, ranking, feed e comunicação relacionada ao evento.',
  },
  {
    title: '2. Quais dados coletamos',
    body: 'Podemos tratar dados como: nome e sobrenome, e-mail, telefone (se informado), foto/avatar, equipe escolhida, interações no app (missões, publicações, comentários, curtidas) e registros necessários à pontuação e funcionamento da gincana.',
  },
  {
    title: '3. Finalidade do tratamento',
    body: 'Seus dados serão usados exclusivamente para a realização e organização do Arena Jovem: identificação dos participantes, formação de equipes, cumprimento de missões, ranking, feed e comunicação do evento. Não utilizaremos seus dados para fins ilícitos, comerciais externos ou compartilhamento indevido com terceiros alheios ao evento.',
  },
  {
    title: '4. Base legal e consentimento',
    body: 'Ao criar uma conta e marcar o aceite, você consente com o tratamento dos seus dados pessoais para as finalidades acima, nos termos da Lei Geral de Proteção de Dados (Lei nº 13.709/2018 — LGPD).',
  },
  {
    title: '5. Tempo de uso da plataforma',
    body: 'Este aplicativo foi desenvolvido para uso temporário, durante o período do Arena Jovem. Após o encerramento do evento, a plataforma poderá ser desativada e removida do ar. Nesse caso, os dados poderão ser excluídos ou anonimizados conforme a necessidade operacional e a LGPD.',
  },
  {
    title: '6. Seus direitos',
    body: 'Você pode solicitar acesso, correção ou exclusão dos seus dados. No próprio aplicativo, em Meu Perfil, é possível apagar a conta. Ao apagar a conta, seus dados de cadastro e conteúdos associados serão removidos na medida tecnicamente possível, respeitando vínculos necessários à integridade do evento (quando aplicável).',
  },
  {
    title: '7. Segurança',
    body: 'Adotamos medidas razoáveis de segurança para proteger os dados contra acessos não autorizados, perda ou uso indevido, considerando a natureza temporária e o porte desta aplicação.',
  },
  {
    title: '8. Contato',
    body: 'Em caso de dúvidas sobre privacidade ou LGPD relacionadas ao Arena Jovem, procure a liderança/organização do evento na Assembleia de Deus Ministério Belém de Jales.',
  },
];

export function getLgpdAcceptLabel() {
  return 'Li e aceito o Aviso de Privacidade e LGPD. Autorizo o uso dos meus dados apenas para o Arena Jovem.';
}
