import { useEffect, useState } from 'react';
import { FaTimes } from 'react-icons/fa';
import http from '../api/http';
import UserAvatar from '../components/UserAvatar';
import { useAuth } from '../contexts/AuthContext';
import { resolveMediaUrl } from '../utils/avatarPresets';
import {
  formatBrazilDisplay,
  toDatetimeLocalBrazil,
} from '../utils/brazilDateTime';
import { getTeamThemeByLabel } from '../utils/teamColors';

const emptyQuestion = () => ({
  enunciado: '',
  midiaFile: null,
  midiaPreview: '',
  alternativas: [
    { texto: '', correta: true },
    { texto: '', correta: false },
  ],
});

const TIPO_LABEL = {
  FOTO: 'Foto',
  AUDIO: 'Áudio',
  VIDEO: 'Vídeo',
  QUIZ: 'Quiz',
};

const DIFICULDADE_LABEL = {
  FACIL: 'Fácil',
  MEDIO: 'Médio',
  DIFICIL: 'Difícil',
  MUITO_DIFICIL: 'Muito Difícil',
};

function acceptForMissionTipo(tipo) {
  if (tipo === 'AUDIO') return 'audio/*';
  if (tipo === 'VIDEO') return 'video/*';
  return 'image/*';
}

function submitLabel(tipo) {
  if (tipo === 'AUDIO') return 'Enviar áudio';
  if (tipo === 'VIDEO') return 'Enviar vídeo';
  return 'Enviar foto';
}

function formatDuration(ms) {
  if (ms == null) return '—';
  const total = Math.max(0, Math.round(Number(ms) / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

function isMissionActionable(mission) {
  return mission.status === 'ABERTA' && mission.janela === 'NO_PRAZO';
}

function windowLabel(mission) {
  if (mission.janela === 'AINDA_NAO_COMECOU') return 'Ainda não começou';
  if (mission.janela === 'ENCERRADA_PRAZO') return 'Prazo encerrado';
  if (mission.status !== 'ABERTA') return mission.status;
  return 'No prazo';
}

function toDatetimeLocalValue(value) {
  return toDatetimeLocalBrazil(value);
}

function emptyFormState() {
  return {
    titulo: '',
    descricao: '',
    pontuacao: 10,
    data_inicio: '',
    data_fim: '',
    tipo: 'FOTO',
    quiz_modo_pontuacao: 'PROPORCIONAL',
    quiz_tempo_segundos: '',
    quiz_dificuldade: 'MEDIO',
  };
}

function QuestionMedia({ midiaUrl, midiaTipo }) {
  if (!midiaUrl) return null;
  const src = resolveMediaUrl(midiaUrl);
  if (midiaTipo === 'AUDIO') {
    return (
      <audio className="w-full" controls preload="metadata" src={src}>
        Seu navegador não suporta áudio.
      </audio>
    );
  }
  if (midiaTipo === 'VIDEO') {
    return (
      <video className="max-h-56 w-full rounded-lg bg-black" controls preload="metadata" src={src}>
        Seu navegador não suporta vídeo.
      </video>
    );
  }
  return (
    <img
      src={src}
      alt="Mídia da pergunta"
      className="max-h-48 w-full rounded-lg object-contain"
    />
  );
}

function EngajadoProfileModal({ person, onClose }) {
  const teamTheme = getTeamThemeByLabel(person.equipe_nome);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/55 p-0 sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="engajado-perfil-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm overflow-hidden rounded-t-2xl bg-white shadow-xl sm:rounded-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="flex items-center justify-between gap-3 border-b border-zinc-200 px-4 py-3">
          <h3
            id="engajado-perfil-title"
            className="text-base font-semibold text-zinc-900"
          >
            Perfil
          </h3>
          <button
            type="button"
            className="grid h-8 w-8 place-items-center rounded-full border border-zinc-300 text-zinc-600 transition hover:bg-zinc-100"
            onClick={onClose}
            aria-label="Fechar"
          >
            <FaTimes />
          </button>
        </header>

        <div className="grid gap-4 p-5 text-center">
          <div className="mx-auto">
            <UserAvatar
              foto={person.usuario_foto}
              nome={person.usuario_nome}
              equipeNome={person.equipe_nome}
              sizeClass="h-24 w-24"
              ringClass={`ring-4 ${teamTheme.ring}`}
            />
          </div>
          <div>
            <p className="text-lg font-semibold text-zinc-900">
              {person.usuario_nome}
            </p>
            <p className="mt-1 text-sm text-zinc-500">
              #{person.posicao} nos mais engajados
            </p>
          </div>
          <div
            className={`rounded-xl border px-4 py-3 ${teamTheme.border} ${teamTheme.softBg}`}
          >
            <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
              Equipe
            </p>
            <p className={`mt-1 text-base font-semibold ${teamTheme.softText}`}>
              {person.equipe_nome || 'Sem equipe'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function MissionsPage() {
  const { isAdmin } = useAuth();
  const [missions, setMissions] = useState([]);
  const [form, setForm] = useState(emptyFormState());
  const [perguntas, setPerguntas] = useState([emptyQuestion()]);
  const [capaFile, setCapaFile] = useState(null);
  const [capaFileName, setCapaFileName] = useState('');
  const [capaPreviewUrl, setCapaPreviewUrl] = useState('');
  const [editingMissionId, setEditingMissionId] = useState(null);
  const [submissionFiles, setSubmissionFiles] = useState({});
  const [activeQuizId, setActiveQuizId] = useState(null);
  const [quizData, setQuizData] = useState(null);
  const [quizAnswers, setQuizAnswers] = useState({});
  const [quizLoading, setQuizLoading] = useState(false);
  const [quizMessage, setQuizMessage] = useState('');
  const [quizError, setQuizError] = useState('');
  const [creating, setCreating] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(null);
  /** 0 = intro, 1..N = pergunta, 'confirm' = revisão final */
  const [quizStep, setQuizStep] = useState(0);
  const [userRanking, setUserRanking] = useState([]);
  const [selectedEngajado, setSelectedEngajado] = useState(null);

  const loadMissions = async () => {
    const { data } = await http.get('/competition/missions');
    if (Array.isArray(data)) {
      setMissions(data);
      return;
    }
    setMissions(Array.isArray(data?.missions) ? data.missions : []);
    if (Array.isArray(data?.engajados) && data.engajados.length) {
      setUserRanking(data.engajados);
    }
  };

  const loadUserRanking = async () => {
    try {
      const { data } = await http.get('/competition/ranking/users');
      const list = Array.isArray(data) ? data : data?.ranking || data?.items || [];
      if (list.length) {
        setUserRanking(list);
        return;
      }
    } catch {
      // tenta fallback abaixo
    }

    // Fallback admin: usa lista de usuários com avatar
    try {
      const { data } = await http.get('/users');
      const participants = (Array.isArray(data) ? data : [])
        .filter((u) => String(u.role).toUpperCase() === 'PARTICIPANTE' && u.equipe_id)
        .slice(0, 10)
        .map((u, index) => ({
          usuario_id: u.id,
          usuario_nome: u.nome,
          usuario_foto: u.foto,
          equipe_id: u.equipe_id,
          equipe_nome: u.equipe_nome,
          posicao: index + 1,
        }));
      setUserRanking(participants);
    } catch {
      setUserRanking([]);
    }
  };

  useEffect(() => {
    loadMissions();
    loadUserRanking();
  }, []);

  useEffect(() => {
    if (!capaFile || !capaFile.type?.startsWith('image/')) {
      setCapaPreviewUrl('');
      return undefined;
    }
    const url = URL.createObjectURL(capaFile);
    setCapaPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [capaFile]);

  useEffect(() => {
    if (!activeQuizId) return undefined;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [activeQuizId]);

  useEffect(() => {
    if (!quizData?.sessao || quizData.minha_tentativa) {
      setSecondsLeft(null);
      return undefined;
    }
    const tempoLimite = Number(quizData.missao?.quiz_tempo_segundos || 0);
    if (!tempoLimite || !quizData.sessao.iniciado_em) {
      setSecondsLeft(null);
      return undefined;
    }

    const tick = () => {
      const elapsed = Math.floor(
        (Date.now() - new Date(quizData.sessao.iniciado_em).getTime()) / 1000
      );
      setSecondsLeft(Math.max(0, tempoLimite - elapsed));
    };
    tick();
    const id = setInterval(tick, 500);
    return () => clearInterval(id);
  }, [quizData]);

  const resetMissionForm = () => {
    setEditingMissionId(null);
    setForm(emptyFormState());
    setCapaFile(null);
    setCapaFileName('');
    setCapaPreviewUrl('');
    setPerguntas([emptyQuestion()]);
  };

  const startEditMission = async (mission) => {
    setEditingMissionId(mission.id);
    setForm({
      titulo: mission.titulo || '',
      descricao: mission.descricao || '',
      pontuacao: mission.pontuacao ?? 10,
      data_inicio: toDatetimeLocalValue(mission.data_inicio),
      data_fim: toDatetimeLocalValue(mission.data_fim),
      tipo: mission.tipo || 'FOTO',
      quiz_modo_pontuacao: mission.quiz_modo_pontuacao || 'PROPORCIONAL',
      quiz_tempo_segundos: mission.quiz_tempo_segundos || '',
      quiz_dificuldade: mission.quiz_dificuldade || 'MEDIO',
    });
    setCapaFile(null);
    setCapaFileName('');
    setPerguntas([emptyQuestion()]);

    if (mission.tipo === 'QUIZ') {
      try {
        const { data } = await http.get(`/competition/missions/${mission.id}/quiz`);
        const loaded = (data.perguntas || []).map((pergunta) => ({
          enunciado: pergunta.enunciado || '',
          midiaFile: null,
          midiaPreview: pergunta.midia_url || '',
          midia_url: pergunta.midia_url || '',
          midia_tipo: pergunta.midia_tipo || '',
          alternativas: (pergunta.alternativas || []).map((alt) => ({
            texto: alt.texto || '',
            correta: Boolean(alt.correta),
          })),
        }));
        setPerguntas(loaded.length ? loaded : [emptyQuestion()]);
      } catch (error) {
        alert(
          error?.response?.data?.message ||
            'Não foi possível carregar as perguntas do quiz.'
        );
      }
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const deleteMission = async (mission) => {
    const ok = window.confirm(
      `Eliminar a missão "${mission.titulo}"? Esta ação não pode ser desfeita.`
    );
    if (!ok) return;
    try {
      await http.delete(`/competition/missions/${mission.id}`);
      if (editingMissionId === mission.id) resetMissionForm();
      if (activeQuizId === mission.id) closeQuiz();
      await loadMissions();
      await loadUserRanking();
    } catch (error) {
      alert(error?.response?.data?.message || 'Não foi possível eliminar a missão.');
    }
  };

  const createMission = async (event) => {
    event.preventDefault();
    setCreating(true);
    try {
      const payload = new FormData();
      Object.entries(form).forEach(([key, value]) => {
        if (value === '' || value == null) return;
        payload.append(key, value);
      });
      if (capaFile) {
        payload.append('imagem_capa', capaFile);
      }
      if (form.tipo === 'QUIZ') {
        const perguntasPayload = perguntas.map(
          ({ enunciado, alternativas, midia_url, midia_tipo, midiaFile }) => ({
            enunciado,
            alternativas,
            midia_url: midiaFile ? undefined : midia_url || undefined,
            midia_tipo: midiaFile ? undefined : midia_tipo || undefined,
          })
        );
        payload.append('perguntas', JSON.stringify(perguntasPayload));
        perguntas.forEach((pergunta, index) => {
          if (pergunta.midiaFile) {
            payload.append(`pergunta_midia_${index}`, pergunta.midiaFile);
          }
        });
      }

      if (editingMissionId) {
        // Garante envio do tempo mesmo quando vazio (limpar limite)
        if (form.tipo === 'QUIZ' && form.quiz_tempo_segundos === '') {
          payload.append('quiz_tempo_segundos', '');
        }
        await http.put(`/competition/missions/${editingMissionId}`, payload);
      } else {
        await http.post('/competition/missions', payload);
      }
      resetMissionForm();
      await loadMissions();
    } catch (error) {
      alert(
        error?.response?.data?.message ||
          (editingMissionId
            ? 'Não foi possível atualizar a missão.'
            : 'Não foi possível criar a missão.')
      );
    } finally {
      setCreating(false);
    }
  };

  const publishMission = async (id) => {
    try {
      await http.patch(`/competition/missions/${id}/status`, { status: 'ABERTA' });
      await loadMissions();
    } catch (error) {
      alert(error?.response?.data?.message || 'Não foi possível liberar a missão.');
    }
  };

  const submitMission = async (id) => {
    try {
      const payload = new FormData();
      payload.append('imagem', submissionFiles[id]);
      const { data } = await http.post(`/competition/missions/${id}/submit`, payload);
      setSubmissionFiles((state) => ({ ...state, [id]: null }));
      alert(data.message || 'Missão concluída! Pontos creditados ao time.');
      await loadMissions();
    } catch (error) {
      alert(error?.response?.data?.message || 'Não foi possível enviar a missão.');
    }
  };

  const closeQuiz = () => {
    setActiveQuizId(null);
    setQuizData(null);
    setQuizError('');
    setQuizMessage('');
    setQuizStep(0);
    setQuizAnswers({});
  };

  const openQuiz = async (missionId) => {
    setActiveQuizId(missionId);
    setQuizLoading(true);
    setQuizError('');
    setQuizMessage('');
    setQuizAnswers({});
    setQuizStep(0);
    try {
      const { data } = await http.get(`/competition/missions/${missionId}/quiz`);
      setQuizData(data);
      if (data.minha_tentativa) {
        setQuizStep('done');
        setQuizMessage(
          isAdmin && data.minha_tentativa.acertos != null
            ? `Resultado: ${data.minha_tentativa.acertos}/${data.minha_tentativa.total_perguntas} · ${data.minha_tentativa.pontos_obtidos} pts · ${formatDuration(data.minha_tentativa.duracao_ms)}`
            : 'Respostas enviadas! O resultado será uma surpresa quando a missão for encerrada e publicada no feed.'
        );
      } else {
        // Sempre mostra a tela "Antes de começar" ao abrir o modal.
        setQuizStep(0);
      }
    } catch (error) {
      const apiMessage = error?.response?.data?.message;
      const status = error?.response?.status;
      setQuizError(
        apiMessage ||
          (status === 404
            ? 'Rota do quiz não encontrada. Reinicie o backend e tente de novo.'
            : error?.message === 'Network Error'
              ? 'Sem conexão com a API. Confira se o backend está rodando na porta 3333.'
              : 'Não foi possível abrir o quiz.')
      );
      setQuizData(null);
    } finally {
      setQuizLoading(false);
    }
  };

  const beginQuiz = async () => {
    if (!activeQuizId) return;
    setQuizError('');
    setQuizLoading(true);
    try {
      const { data } = await http.post(
        `/competition/missions/${activeQuizId}/quiz/start`
      );
      setQuizData((prev) =>
        prev
          ? {
              ...prev,
              sessao: data.sessao || prev.sessao,
            }
          : prev
      );
      setQuizStep(1);
    } catch (error) {
      // Admin sem equipe pode só pré-visualizar.
      if (isAdmin) {
        setQuizStep(1);
      } else {
        setQuizError(
          error?.response?.data?.message || 'Não foi possível iniciar o quiz.'
        );
      }
    } finally {
      setQuizLoading(false);
    }
  };

  const submitQuiz = async () => {
    if (!activeQuizId || !quizData?.perguntas?.length) return;
    if (secondsLeft === 0) {
      setQuizError('Tempo esgotado.');
      return;
    }
    const respostas = quizData.perguntas.map((pergunta) => ({
      pergunta_id: pergunta.id,
      alternativa_id: quizAnswers[pergunta.id],
    }));
    if (respostas.some((r) => !r.alternativa_id)) {
      setQuizError('Responda todas as perguntas antes de enviar.');
      setQuizStep(1);
      return;
    }
    setQuizLoading(true);
    setQuizError('');
    try {
      const { data } = await http.post(
        `/competition/missions/${activeQuizId}/quiz/submit`,
        { respostas }
      );
      setQuizMessage(data.message);
      setQuizStep('done');
      setQuizData((prev) =>
        prev
          ? {
              ...prev,
              minha_tentativa: {
                total_perguntas: data.total_perguntas,
                duracao_ms: data.duracao_ms,
                enviado: true,
              },
              historico: data.historico || prev.historico,
              sessao: null,
            }
          : prev
      );
      await loadMissions();
    } catch (error) {
      setQuizError(error?.response?.data?.message || 'Não foi possível enviar o quiz.');
    } finally {
      setQuizLoading(false);
    }
  };

  const getAnswerLabel = (pergunta) => {
    const selectedId = quizAnswers[pergunta.id];
    if (!selectedId) return 'Sem resposta';
    const alt = pergunta.alternativas.find(
      (item) => Number(item.id) === Number(selectedId)
    );
    return alt?.texto || 'Sem resposta';
  };

  const totalQuizQuestions = quizData?.perguntas?.length || 0;
  const currentQuestion =
    typeof quizStep === 'number' && quizStep >= 1
      ? quizData?.perguntas?.[quizStep - 1]
      : null;

  const updatePergunta = (index, patch) => {
    setPerguntas((list) =>
      list.map((item, i) => (i === index ? { ...item, ...patch } : item))
    );
  };

  const updateAlternativa = (qIndex, aIndex, patch) => {
    setPerguntas((list) =>
      list.map((pergunta, i) => {
        if (i !== qIndex) return pergunta;
        const alternativas = pergunta.alternativas.map((alt, j) => {
          if (patch.correta === true) {
            return j === aIndex
              ? { ...alt, ...patch }
              : { ...alt, correta: false };
          }
          return j === aIndex ? { ...alt, ...patch } : alt;
        });
        return { ...pergunta, alternativas };
      })
    );
  };

  return (
    <section className="space-y-4">
      <header>
        <h2 className="text-2xl font-semibold text-zinc-900">Missões</h2>
        {userRanking.length ? (
          <div className="mt-3" aria-label="10 mais engajados">
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-zinc-500">
              10 mais engajados
            </p>
            <div className="flex items-center gap-2 overflow-x-auto overflow-y-hidden pb-2">
              {userRanking.map((row) => (
                <button
                  key={row.usuario_id}
                  type="button"
                  title={`Ver perfil de ${row.usuario_nome}`}
                  aria-label={`Ver perfil de ${row.usuario_nome}`}
                  className="relative h-11 w-11 shrink-0 rounded-full transition hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-400"
                  onClick={() => setSelectedEngajado(row)}
                >
                  <UserAvatar
                    foto={row.usuario_foto}
                    nome={row.usuario_nome}
                    equipeNome={row.equipe_nome}
                    sizeClass="h-11 w-11"
                    ringClass="ring-2 ring-white"
                  />
                  <span className="absolute -bottom-0.5 -right-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-zinc-900 px-0.5 text-[9px] font-semibold text-white">
                    {row.posicao}
                  </span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <p className="mt-2 text-xs text-zinc-500">
            Cadastre participantes nas equipes para ver os mais engajados.
          </p>
        )}
        <p className="mt-2 text-sm text-zinc-500">
          Pontuação automática, prazo real e 1 envio por pessoa.
        </p>
      </header>

      {selectedEngajado ? (
        <EngajadoProfileModal
          person={selectedEngajado}
          onClose={() => setSelectedEngajado(null)}
        />
      ) : null}

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="grid gap-4">
          {isAdmin ? (
            <form className="grid gap-4" onSubmit={createMission}>
              {editingMissionId ? (
                <div className="ig-card flex flex-wrap items-center justify-between gap-2 px-4 py-3">
                  <div>
                    <p className="text-sm font-semibold text-zinc-900">
                      Editando missão
                    </p>
                    <p className="text-xs text-zinc-500">#{editingMissionId}</p>
                  </div>
                  <button
                    type="button"
                    className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm text-zinc-700 hover:bg-zinc-50"
                    onClick={resetMissionForm}
                  >
                    Cancelar edição
                  </button>
                </div>
              ) : null}

              {/* 1. Tipo */}
              <section className="ig-card grid gap-3 p-4">
                <div>
                  <h3 className="text-sm font-semibold text-zinc-900">Tipo da missão</h3>
                  <p className="mt-0.5 text-xs text-zinc-500">
                    Escolha o formato do desafio. No quiz, a capa é opcional e as
                    perguntas ficam em um bloco separado.
                  </p>
                </div>
                <div className="grid gap-2 sm:grid-cols-4">
                  {[
                    { value: 'FOTO', label: 'Foto', hint: 'Envio de imagem' },
                    { value: 'AUDIO', label: 'Áudio', hint: 'Envio de áudio' },
                    { value: 'VIDEO', label: 'Vídeo', hint: 'Envio de vídeo' },
                    { value: 'QUIZ', label: 'Quiz', hint: 'Perguntas e respostas' },
                  ].map((option) => {
                    const selected = form.tipo === option.value;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        disabled={Boolean(editingMissionId)}
                        onClick={() => {
                          setForm((s) => ({ ...s, tipo: option.value }));
                          setCapaFile(null);
                          setCapaFileName('');
                        }}
                        className={`rounded-xl border px-3 py-3 text-left transition ${
                          selected
                            ? 'border-zinc-800 bg-zinc-900 text-white'
                            : 'border-zinc-200 bg-zinc-50 text-zinc-800 hover:border-zinc-400'
                        } disabled:cursor-not-allowed disabled:opacity-60`}
                      >
                        <span className="block text-sm font-semibold">{option.label}</span>
                        <span
                          className={`mt-0.5 block text-[11px] ${
                            selected ? 'text-zinc-300' : 'text-zinc-500'
                          }`}
                        >
                          {option.hint}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </section>

              {/* 2. Identidade */}
              <section className="ig-card grid gap-3 p-4">
                <div>
                  <h3 className="text-sm font-semibold text-zinc-900">Identidade</h3>
                  <p className="mt-0.5 text-xs text-zinc-500">
                    Título e descrição que os participantes verão no card.
                  </p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="grid gap-1 text-sm font-medium text-zinc-700 sm:col-span-2">
                    Título
                    <input
                      className="ig-input"
                      placeholder="Nome da missão"
                      value={form.titulo}
                      onChange={(e) => setForm((s) => ({ ...s, titulo: e.target.value }))}
                      required
                    />
                  </label>
                  <label className="grid gap-1 text-sm font-medium text-zinc-700 sm:col-span-2">
                    Descrição
                    <textarea
                      className="ig-input min-h-[88px]"
                      placeholder="Explique o desafio para os participantes"
                      value={form.descricao}
                      onChange={(e) =>
                        setForm((s) => ({ ...s, descricao: e.target.value }))
                      }
                      required
                    />
                  </label>
                </div>
              </section>

              {/* 3. Pontos e prazo */}
              <section className="ig-card grid gap-3 p-4">
                <div>
                  <h3 className="text-sm font-semibold text-zinc-900">Pontos e prazo</h3>
                  <p className="mt-0.5 text-xs text-zinc-500">
                    Defina a recompensa e a janela em que a missão fica aberta
                    (horário de Brasília).
                  </p>
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  <label className="grid gap-1 text-sm font-medium text-zinc-700">
                    Pontuação
                    <input
                      className="ig-input"
                      type="number"
                      min="1"
                      placeholder="Ex.: 10"
                      value={form.pontuacao}
                      onChange={(e) =>
                        setForm((s) => ({ ...s, pontuacao: e.target.value }))
                      }
                      required
                    />
                  </label>
                  <label className="grid gap-1 text-sm font-medium text-zinc-700">
                    Início (Brasília)
                    <input
                      className="ig-input"
                      type="datetime-local"
                      value={form.data_inicio}
                      onChange={(e) =>
                        setForm((s) => ({ ...s, data_inicio: e.target.value }))
                      }
                      required
                    />
                  </label>
                  <label className="grid gap-1 text-sm font-medium text-zinc-700">
                    Fim (Brasília)
                    <input
                      className="ig-input"
                      type="datetime-local"
                      value={form.data_fim}
                      onChange={(e) =>
                        setForm((s) => ({ ...s, data_fim: e.target.value }))
                      }
                      required
                    />
                  </label>
                </div>
              </section>

              {/* 4. Config do quiz */}
              {form.tipo === 'QUIZ' ? (
                <section className="ig-card grid gap-3 p-4">
                  <div>
                    <h3 className="text-sm font-semibold text-zinc-900">
                      Configuração do quiz
                    </h3>
                    <p className="mt-0.5 text-xs text-zinc-500">
                      Regras de pontuação, dificuldade e tempo limite.
                    </p>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-3">
                    <label className="grid gap-1 text-sm font-medium text-zinc-700">
                      Modo de pontuação
                      <select
                        className="ig-input"
                        value={form.quiz_modo_pontuacao}
                        onChange={(e) =>
                          setForm((s) => ({
                            ...s,
                            quiz_modo_pontuacao: e.target.value,
                          }))
                        }
                      >
                        <option value="PROPORCIONAL">Proporcional aos acertos</option>
                        <option value="TUDO_OU_NADA">Só se acertar tudo</option>
                      </select>
                    </label>
                    <label className="grid gap-1 text-sm font-medium text-zinc-700">
                      Nível de dificuldade
                      <select
                        className="ig-input"
                        value={form.quiz_dificuldade}
                        onChange={(e) =>
                          setForm((s) => ({ ...s, quiz_dificuldade: e.target.value }))
                        }
                      >
                        <option value="FACIL">Fácil</option>
                        <option value="MEDIO">Médio</option>
                        <option value="DIFICIL">Difícil</option>
                        <option value="MUITO_DIFICIL">Muito Difícil</option>
                      </select>
                    </label>
                    <label className="grid gap-1 text-sm font-medium text-zinc-700">
                      Tempo limite (segundos)
                      <input
                        className="ig-input"
                        type="number"
                        min="10"
                        placeholder="Vazio = sem limite"
                        value={form.quiz_tempo_segundos}
                        onChange={(e) =>
                          setForm((s) => ({
                            ...s,
                            quiz_tempo_segundos: e.target.value,
                          }))
                        }
                      />
                    </label>
                  </div>
                </section>
              ) : null}

              {/* 5. Mídia / capa */}
              <section className="ig-card grid gap-3 p-4">
                <div>
                  <h3 className="text-sm font-semibold text-zinc-900">
                    {form.tipo === 'QUIZ'
                      ? 'Capa do quiz'
                      : form.tipo === 'AUDIO'
                        ? 'Arquivo de áudio'
                        : form.tipo === 'VIDEO'
                          ? 'Arquivo de vídeo'
                          : 'Arquivo de foto'}
                  </h3>
                  <p className="mt-0.5 text-xs text-zinc-500">
                    {form.tipo === 'QUIZ'
                      ? 'Opcional. Aparece no card da missão e no feed ao encerrar.'
                      : 'Obrigatório. Este é o arquivo que a equipe precisa enviar / a referência da missão.'}
                  </p>
                </div>
                <label className="grid gap-2">
                  <span className="inline-flex w-fit items-center rounded-full border border-zinc-200 bg-zinc-50 px-2.5 py-0.5 text-[11px] font-medium text-zinc-600">
                    {form.tipo === 'QUIZ' ? 'Opcional' : 'Obrigatório'}
                  </span>
                  <input
                    key={form.tipo}
                    className="ig-input"
                    type="file"
                    accept={
                      form.tipo === 'AUDIO'
                        ? 'audio/*'
                        : form.tipo === 'VIDEO'
                          ? 'video/*'
                          : 'image/*'
                    }
                    onChange={(e) => {
                      const file = e.target.files?.[0] || null;
                      setCapaFile(file);
                      setCapaFileName(file ? file.name : '');
                    }}
                    required={
                      form.tipo === 'FOTO' ||
                      form.tipo === 'AUDIO' ||
                      form.tipo === 'VIDEO'
                    }
                  />
                  {capaFileName ? (
                    <span className="text-xs text-zinc-500">
                      Selecionado: {capaFileName}
                    </span>
                  ) : null}
                  {capaPreviewUrl ? (
                    <img
                      src={capaPreviewUrl}
                      alt="Prévia da capa"
                      className="mt-1 max-h-40 w-full rounded-lg bg-zinc-100 object-contain"
                    />
                  ) : null}
                </label>
              </section>

              {/* 6. Perguntas do quiz */}
              {form.tipo === 'QUIZ' ? (
                <section className="ig-card grid gap-4 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <h3 className="text-sm font-semibold text-zinc-900">
                        Perguntas do quiz
                      </h3>
                      <p className="mt-0.5 text-xs text-zinc-500">
                        Cada pergunta pode ter mídia opcional (foto, áudio ou vídeo) e
                        alternativas com uma resposta correta.
                      </p>
                    </div>
                    <span className="rounded-full border border-zinc-200 bg-zinc-50 px-2.5 py-0.5 text-[11px] font-medium text-zinc-600">
                      {perguntas.length} pergunta{perguntas.length === 1 ? '' : 's'}
                    </span>
                  </div>

                  <div className="grid gap-4">
                    {perguntas.map((pergunta, qIndex) => (
                      <div
                        key={`q-${qIndex}`}
                        className="grid gap-3 rounded-xl border border-zinc-200 bg-zinc-50/80 p-4"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-semibold text-zinc-800">
                            Pergunta {qIndex + 1}
                          </p>
                          {perguntas.length > 1 ? (
                            <button
                              type="button"
                              className="rounded-lg px-2 py-1 text-xs font-medium text-rose-600 hover:bg-rose-50"
                              onClick={() =>
                                setPerguntas((list) =>
                                  list.filter((_, i) => i !== qIndex)
                                )
                              }
                            >
                              Remover
                            </button>
                          ) : null}
                        </div>

                        <label className="grid gap-1 text-sm font-medium text-zinc-700">
                          Enunciado
                          <input
                            className="ig-input"
                            placeholder="Ex.: Quem está na foto?"
                            value={pergunta.enunciado}
                            onChange={(e) =>
                              updatePergunta(qIndex, { enunciado: e.target.value })
                            }
                            required
                          />
                        </label>

                        <div className="grid gap-2 rounded-lg border border-dashed border-zinc-300 bg-white p-3">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                              Mídia da pergunta
                            </p>
                            <span className="text-[11px] text-zinc-400">Opcional</span>
                          </div>
                          <input
                            className="ig-input"
                            type="file"
                            accept="audio/*,video/*,image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0] || null;
                              updatePergunta(qIndex, {
                                midiaFile: file,
                                midiaPreview: file ? file.name : pergunta.midiaPreview,
                              });
                            }}
                          />
                          {pergunta.midiaFile ? (
                            <p className="text-xs text-zinc-500">
                              Novo arquivo: {pergunta.midiaFile.name}
                            </p>
                          ) : pergunta.midia_url ? (
                            <QuestionMedia
                              midiaUrl={pergunta.midia_url}
                              midiaTipo={pergunta.midia_tipo}
                            />
                          ) : null}
                        </div>

                        <div className="grid gap-2">
                          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                            Alternativas
                          </p>
                          {pergunta.alternativas.map((alt, aIndex) => (
                            <label
                              key={`a-${qIndex}-${aIndex}`}
                              className={`flex items-center gap-2 rounded-lg border px-3 py-2 ${
                                alt.correta
                                  ? 'border-emerald-300 bg-emerald-50'
                                  : 'border-zinc-200 bg-white'
                              }`}
                            >
                              <input
                                type="radio"
                                name={`correta-${qIndex}`}
                                checked={Boolean(alt.correta)}
                                onChange={() =>
                                  updateAlternativa(qIndex, aIndex, { correta: true })
                                }
                                className="shrink-0"
                              />
                              <input
                                className="ig-input flex-1 border-0 bg-transparent px-0 py-1 shadow-none focus:ring-0"
                                placeholder={`Alternativa ${aIndex + 1}`}
                                value={alt.texto}
                                onChange={(e) =>
                                  updateAlternativa(qIndex, aIndex, {
                                    texto: e.target.value,
                                  })
                                }
                                required
                              />
                              {alt.correta ? (
                                <span className="shrink-0 text-[11px] font-medium text-emerald-700">
                                  Correta
                                </span>
                              ) : null}
                            </label>
                          ))}
                          <button
                            type="button"
                            className="justify-self-start text-xs font-medium text-blue-700 hover:underline"
                            onClick={() =>
                              updatePergunta(qIndex, {
                                alternativas: [
                                  ...pergunta.alternativas,
                                  { texto: '', correta: false },
                                ],
                              })
                            }
                          >
                            + Alternativa
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    className="rounded-lg border border-dashed border-zinc-300 bg-zinc-50 px-4 py-3 text-sm font-medium text-zinc-700 transition hover:border-zinc-400 hover:bg-white"
                    onClick={() => setPerguntas((list) => [...list, emptyQuestion()])}
                  >
                    + Nova pergunta
                  </button>
                </section>
              ) : null}

              <div className="flex flex-wrap items-center gap-2">
                <button type="submit" className="ig-button" disabled={creating}>
                  {creating
                    ? editingMissionId
                      ? 'Salvando...'
                      : 'Criando...'
                    : editingMissionId
                      ? 'Salvar alterações'
                      : 'Criar missão'}
                </button>
                {editingMissionId ? (
                  <button
                    type="button"
                    className="rounded-lg border border-zinc-300 bg-white px-4 py-2.5 text-sm font-medium text-zinc-700"
                    onClick={resetMissionForm}
                  >
                    Cancelar
                  </button>
                ) : null}
              </div>
            </form>
          ) : null}

          <div className="grid gap-3 md:grid-cols-2">
            {missions.map((mission) => (
              <article key={mission.id} className="ig-card flex flex-col gap-3 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="text-base font-semibold text-zinc-900">
                      {mission.titulo}
                    </h3>
                    <p className="mt-1 line-clamp-2 text-sm text-zinc-600">
                      {mission.descricao}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <span className="rounded-full border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-xs text-zinc-600">
                      {TIPO_LABEL[mission.tipo] || mission.tipo || 'Foto'}
                    </span>
                    <span className="rounded-full border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-xs text-zinc-600">
                      {windowLabel(mission)}
                    </span>
                  </div>
                </div>
                {mission.imagem_capa ? (
                  <QuestionMedia
                    midiaUrl={mission.imagem_capa}
                    midiaTipo={
                      mission.tipo === 'AUDIO'
                        ? 'AUDIO'
                        : mission.tipo === 'VIDEO'
                          ? 'VIDEO'
                          : 'IMAGEM'
                    }
                  />
                ) : null}
                <div className="mt-auto grid gap-3 border-t border-zinc-100 pt-3">
                <small className="text-xs text-zinc-500">
                  {mission.pontuacao} pts
                  {mission.tipo === 'QUIZ'
                    ? ` · ${mission.quiz_modo_pontuacao === 'TUDO_OU_NADA' ? 'tudo ou nada' : 'proporcional'} · ${DIFICULDADE_LABEL[mission.quiz_dificuldade] || 'Médio'}`
                    : ''}
                  {mission.tipo === 'QUIZ' && mission.quiz_tempo_segundos
                    ? ` · ${mission.quiz_tempo_segundos}s`
                    : ''}{' '}
                  • {formatBrazilDisplay(mission.data_inicio)} —{' '}
                  {formatBrazilDisplay(mission.data_fim)}
                </small>

                {mission.tipo === 'QUIZ' && mission.minha_tentativa ? (
                  <p className="text-sm text-emerald-700">
                    {isAdmin && mission.minha_tentativa.acertos != null
                      ? `Sua pontuação: ${mission.minha_tentativa.acertos}/${mission.minha_tentativa.total_perguntas} · ${mission.minha_tentativa.pontos_obtidos} pts · ${formatDuration(mission.minha_tentativa.duracao_ms)}`
                      : 'Quiz enviado · resultado no feed ao encerrar'}
                  </p>
                ) : null}

                {mission.tipo !== 'QUIZ' && mission.meu_envio ? (
                  <p className="text-sm text-emerald-700">
                    Envio concluído · +{mission.meu_envio.pontos_obtidos} pts para o
                    time
                  </p>
                ) : null}

                {isAdmin ? (
                  <div className="grid gap-2">
                    <div className="flex flex-wrap gap-2">
                      <button
                        className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-700"
                        type="button"
                        onClick={() => startEditMission(mission)}
                      >
                        Editar
                      </button>
                      <button
                        className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700"
                        type="button"
                        onClick={() => deleteMission(mission)}
                      >
                        Eliminar
                      </button>
                    </div>
                    <button
                      className="ig-button"
                      type="button"
                      onClick={() => publishMission(mission.id)}
                      disabled={mission.status === 'ABERTA' || mission.status === 'ENCERRADA'}
                    >
                      {mission.status === 'ABERTA'
                        ? 'Já liberada'
                        : mission.status === 'ENCERRADA'
                          ? 'Encerrada'
                          : 'Liberar Missão'}
                    </button>
                    {mission.status === 'ABERTA' || mission.status === 'ENCERRADA' ? (
                      <button
                        className="ig-button"
                        type="button"
                        onClick={async () => {
                          try {
                            const { data } = await http.post(
                              `/competition/missions/${mission.id}/feed-post`,
                              { encerrar: true }
                            );
                            alert(data.message || 'Publicado no feed!');
                            await loadMissions();
                            await loadUserRanking();
                          } catch (error) {
                            alert(
                              error?.response?.data?.message ||
                                'Não foi possível postar no feed.'
                            );
                          }
                        }}
                      >
                        Encerrar e postar no feed
                      </button>
                    ) : null}
                  </div>
                ) : mission.tipo === 'QUIZ' ? (
                  <button
                    className="ig-button"
                    type="button"
                    onClick={() => openQuiz(mission.id)}
                    disabled={!isMissionActionable(mission) && !mission.minha_tentativa}
                  >
                    {mission.minha_tentativa
                      ? 'Ver histórico'
                      : 'Responder quiz'}
                  </button>
                ) : mission.meu_envio ? (
                  <p className="text-xs text-zinc-500">
                    Você já concluiu esta missão (1 envio por pessoa).
                  </p>
                ) : (
                  <div className="grid gap-2 sm:grid-cols-2">
                    <input
                      className="ig-input"
                      type="file"
                      accept={acceptForMissionTipo(mission.tipo)}
                      onChange={(e) =>
                        setSubmissionFiles((state) => ({
                          ...state,
                          [mission.id]: e.target.files?.[0],
                        }))
                      }
                      disabled={!isMissionActionable(mission)}
                    />
                    <button
                      className="ig-button"
                      type="button"
                      disabled={
                        !submissionFiles[mission.id] || !isMissionActionable(mission)
                      }
                      onClick={() => submitMission(mission.id)}
                    >
                      {submitLabel(mission.tipo)}
                    </button>
                  </div>
                )}

                {isAdmin && mission.tipo === 'QUIZ' ? (
                  <button
                    type="button"
                    className="bg-transparent p-0 text-left text-xs text-blue-700 hover:underline"
                    onClick={() => openQuiz(mission.id)}
                  >
                    Pré-visualizar
                  </button>
                ) : null}
                </div>
              </article>
            ))}
          </div>

          {activeQuizId ? (
            <div
              className="fixed inset-0 z-50 flex items-end justify-center bg-black/55 p-0 sm:items-center sm:p-4"
              role="dialog"
              aria-modal="true"
              aria-labelledby="quiz-modal-title"
              onClick={() => {
                // Evita fechar no meio das perguntas por clique acidental no fundo.
                if (quizStep === 0 || quizStep === 'done' || quizData?.minha_tentativa) {
                  closeQuiz();
                }
              }}
            >
              <div
                className="flex max-h-[min(92dvh,920px)] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl bg-white shadow-xl sm:rounded-2xl"
                onClick={(event) => event.stopPropagation()}
              >
                <header className="flex shrink-0 items-start justify-between gap-3 border-b border-zinc-200 px-4 py-3">
                  <div className="min-w-0">
                    <h3
                      id="quiz-modal-title"
                      className="truncate text-base font-semibold text-zinc-900"
                    >
                      {quizData?.missao?.titulo || 'Quiz'}
                    </h3>
                    <p className="text-sm text-zinc-500">
                      {quizData?.missao?.pontuacao || 0} pts ·{' '}
                      {quizData?.missao?.quiz_modo_pontuacao === 'TUDO_OU_NADA'
                        ? 'tudo ou nada'
                        : 'proporcional'}
                      {quizData?.missao?.quiz_dificuldade
                        ? ` · ${DIFICULDADE_LABEL[quizData.missao.quiz_dificuldade] || 'Médio'}`
                        : ''}
                      {quizData?.missao?.quiz_tempo_segundos
                        ? ` · limite ${quizData.missao.quiz_tempo_segundos}s`
                        : ''}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-zinc-300 text-zinc-600 transition hover:bg-zinc-100"
                    onClick={closeQuiz}
                    aria-label="Fechar quiz"
                  >
                    <FaTimes />
                  </button>
                </header>

                <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-4 py-4">
              {secondsLeft != null && !quizData?.minha_tentativa ? (
                <p
                  className={`text-sm font-semibold ${
                    secondsLeft <= 10 ? 'text-rose-600' : 'text-zinc-800'
                  }`}
                >
                  Tempo restante: {secondsLeft}s
                </p>
              ) : null}

              {quizLoading && !quizData ? (
                <p className="text-sm text-zinc-500">Carregando...</p>
              ) : null}
              {quizError ? <p className="text-sm text-rose-500">{quizError}</p> : null}
              {quizMessage && quizStep === 'done' ? (
                <p className="text-sm text-emerald-700">{quizMessage}</p>
              ) : null}

              {!quizData?.minha_tentativa && quizData?.perguntas?.length ? (
                <>
                  {quizStep === 0 ? (
                    <div className="grid gap-3 rounded-xl border border-zinc-200 bg-zinc-50 p-4">
                      <p className="text-sm font-semibold text-zinc-900">Antes de começar</p>
                      <ul className="list-disc space-y-1.5 pl-5 text-sm text-zinc-700">
                        <li>
                          São {totalQuizQuestions} pergunta
                          {totalQuizQuestions === 1 ? '' : 's'} — uma por vez.
                        </li>
                        <li>
                          Você tem <strong>apenas 1 tentativa</strong>. Depois de enviar, não
                          dá para mudar.
                        </li>
                        {quizData.missao?.quiz_tempo_segundos ? (
                          <li>
                            Há limite de {quizData.missao.quiz_tempo_segundos}s no
                            total. O cronômetro começa ao clicar em{' '}
                            <strong>Começar quiz</strong>.
                          </li>
                        ) : (
                          <li>Não há limite de tempo neste quiz.</li>
                        )}
                        <li>
                          No final você verá um resumo e precisará confirmar o envio.
                        </li>
                      </ul>
                      <button
                        type="button"
                        className="ig-button"
                        disabled={quizLoading}
                        onClick={() => {
                          if (quizData.sessao?.iniciado_em) {
                            setQuizError('');
                            setQuizStep(1);
                            return;
                          }
                          beginQuiz();
                        }}
                      >
                        {quizLoading
                          ? 'Iniciando...'
                          : quizData.sessao?.iniciado_em
                            ? 'Continuar quiz'
                            : 'Começar quiz'}
                      </button>
                    </div>
                  ) : null}

                  {currentQuestion ? (
                    <div className="grid gap-3">
                      <div className="flex items-center justify-between gap-2 text-xs text-zinc-500">
                        <span>
                          Pergunta {quizStep} de {totalQuizQuestions}
                        </span>
                        <span>
                          {
                            Object.keys(quizAnswers).filter((id) =>
                              quizData.perguntas.some((p) => String(p.id) === String(id))
                            ).length
                          }{' '}
                          respondida(s)
                        </span>
                      </div>
                      <div
                        className="h-1.5 overflow-hidden rounded-full bg-zinc-200"
                        aria-hidden
                      >
                        <div
                          className="h-full rounded-full bg-zinc-800 transition-all duration-300"
                          style={{
                            width: `${(quizStep / totalQuizQuestions) * 100}%`,
                          }}
                        />
                      </div>
                      <fieldset className="grid gap-2">
                        <legend className="text-sm font-medium text-zinc-800">
                          {quizStep}. {currentQuestion.enunciado}
                        </legend>
                        <QuestionMedia
                          midiaUrl={currentQuestion.midia_url}
                          midiaTipo={currentQuestion.midia_tipo}
                        />
                        {currentQuestion.alternativas.map((alt) => (
                          <label
                            key={alt.id}
                            className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2.5 text-sm transition ${
                              Number(quizAnswers[currentQuestion.id]) === Number(alt.id)
                                ? 'border-zinc-800 bg-zinc-100'
                                : 'border-zinc-200 hover:border-zinc-400'
                            }`}
                          >
                            <input
                              type="radio"
                              name={`quiz-${currentQuestion.id}`}
                              disabled={quizLoading || secondsLeft === 0}
                              checked={
                                Number(quizAnswers[currentQuestion.id]) === Number(alt.id)
                              }
                              onChange={() =>
                                setQuizAnswers((state) => ({
                                  ...state,
                                  [currentQuestion.id]: alt.id,
                                }))
                              }
                            />
                            <span>{alt.texto}</span>
                            {isAdmin && alt.correta ? (
                              <span className="ml-auto text-xs text-emerald-600">correta</span>
                            ) : null}
                          </label>
                        ))}
                      </fieldset>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700"
                          onClick={() => {
                            setQuizError('');
                            setQuizStep(quizStep === 1 ? 0 : quizStep - 1);
                          }}
                        >
                          Voltar
                        </button>
                        <button
                          type="button"
                          className="ig-button"
                          disabled={
                            !quizAnswers[currentQuestion.id] || secondsLeft === 0
                          }
                          onClick={() => {
                            setQuizError('');
                            if (quizStep >= totalQuizQuestions) {
                              setQuizStep('confirm');
                            } else {
                              setQuizStep(quizStep + 1);
                            }
                          }}
                        >
                          {quizStep >= totalQuizQuestions
                            ? 'Revisar respostas'
                            : 'Próxima'}
                        </button>
                      </div>
                    </div>
                  ) : null}

                  {quizStep === 'confirm' ? (
                    <div className="grid gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
                      <p className="text-sm font-semibold text-zinc-900">
                        Confirme antes de enviar
                      </p>
                      <p className="text-sm text-zinc-700">
                        Revise suas respostas. Depois de confirmar, a tentativa é
                        definitiva — não será possível alterar.
                      </p>
                      <ul className="grid gap-2">
                        {quizData.perguntas.map((pergunta, index) => (
                          <li
                            key={pergunta.id}
                            className="rounded-lg border border-amber-100 bg-white px-3 py-2 text-sm"
                          >
                            <p className="font-medium text-zinc-800">
                              {index + 1}. {pergunta.enunciado}
                            </p>
                            <p className="mt-0.5 text-zinc-600">
                              Sua resposta: {getAnswerLabel(pergunta)}
                            </p>
                            <button
                              type="button"
                              className="mt-1 bg-transparent p-0 text-xs text-blue-700 hover:underline"
                              onClick={() => {
                                setQuizError('');
                                setQuizStep(index + 1);
                              }}
                            >
                              Alterar esta resposta
                            </button>
                          </li>
                        ))}
                      </ul>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700"
                          onClick={() => {
                            setQuizError('');
                            setQuizStep(totalQuizQuestions);
                          }}
                        >
                          Voltar
                        </button>
                        <button
                          type="button"
                          className="ig-button"
                          disabled={quizLoading || secondsLeft === 0}
                          onClick={submitQuiz}
                        >
                          {quizLoading
                            ? 'Enviando...'
                            : secondsLeft === 0
                              ? 'Tempo esgotado'
                              : 'Confirmar e enviar'}
                        </button>
                      </div>
                    </div>
                  ) : null}
                </>
              ) : null}

              {quizData?.historico?.itens?.length ? (
                <div className="grid gap-2 border-t border-zinc-200 pt-3">
                  <h4 className="text-sm font-semibold text-zinc-900">
                    Suas respostas
                  </h4>
                  <p className="text-xs text-zinc-500">
                    Acertos e gabarito serão divulgados no feed quando a missão
                    for encerrada.
                  </p>
                  {quizData.historico.itens.map((item, index) => (
                    <div
                      key={item.pergunta_id}
                      className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm"
                    >
                      <p className="font-medium text-zinc-800">
                        {index + 1}. {item.enunciado}
                      </p>
                      <p className="text-xs text-zinc-600">
                        Sua resposta: {item.resposta_escolhida}
                      </p>
                      {isAdmin && item.acertou != null ? (
                        <p className="text-xs text-zinc-600">
                          {item.acertou ? 'Acertou' : 'Errou'}
                          {item.resposta_correta
                            ? ` · Correta: ${item.resposta_correta}`
                            : ''}
                        </p>
                      ) : null}
                    </div>
                  ))}
                </div>
              ) : null}
                </div>
              </div>
            </div>
          ) : null}
        </div>

        <aside className="hidden lg:block">
          <div className="ig-card sticky top-7 space-y-3 p-4">
            <h3 className="text-base font-semibold text-zinc-900">Resumo de Missões</h3>
            <div className="flex items-center justify-between text-sm text-zinc-500">
              <span>Total</span>
              <strong className="text-zinc-900">{missions.length}</strong>
            </div>
            <div className="flex items-center justify-between text-sm text-zinc-500">
              <span>No prazo</span>
              <strong className="text-zinc-900">
                {missions.filter((m) => m.janela === 'NO_PRAZO' && m.status === 'ABERTA').length}
              </strong>
            </div>
            <div className="flex items-center justify-between text-sm text-zinc-500">
              <span>Quizzes</span>
              <strong className="text-zinc-900">
                {missions.filter((m) => m.tipo === 'QUIZ').length}
              </strong>
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}

export default MissionsPage;
