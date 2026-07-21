import { useEffect, useState } from 'react';
import http from '../api/http';
import { useAuth } from '../contexts/AuthContext';
import { resolveMediaUrl } from '../utils/avatarPresets';

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

function MissionsPage() {
  const { isAdmin } = useAuth();
  const [missions, setMissions] = useState([]);
  const [form, setForm] = useState({
    titulo: '',
    descricao: '',
    pontuacao: 10,
    data_inicio: '',
    data_fim: '',
    tipo: 'FOTO',
    quiz_modo_pontuacao: 'PROPORCIONAL',
  });
  const [perguntas, setPerguntas] = useState([emptyQuestion()]);
  const [capaFile, setCapaFile] = useState(null);
  const [capaFileName, setCapaFileName] = useState('');
  const [submissionFiles, setSubmissionFiles] = useState({});
  const [activeQuizId, setActiveQuizId] = useState(null);
  const [quizData, setQuizData] = useState(null);
  const [quizAnswers, setQuizAnswers] = useState({});
  const [quizLoading, setQuizLoading] = useState(false);
  const [quizMessage, setQuizMessage] = useState('');
  const [quizError, setQuizError] = useState('');
  const [creating, setCreating] = useState(false);

  const loadMissions = async () => {
    const { data } = await http.get('/competition/missions');
    setMissions(data);
  };

  useEffect(() => {
    loadMissions();
  }, []);

  const createMission = async (event) => {
    event.preventDefault();
    setCreating(true);
    try {
      const payload = new FormData();
      Object.entries(form).forEach(([key, value]) => payload.append(key, value));
      if (capaFile) {
        payload.append('imagem_capa', capaFile);
      }
      if (form.tipo === 'QUIZ') {
        const perguntasPayload = perguntas.map(({ enunciado, alternativas }) => ({
          enunciado,
          alternativas,
        }));
        payload.append('perguntas', JSON.stringify(perguntasPayload));
        perguntas.forEach((pergunta, index) => {
          if (pergunta.midiaFile) {
            payload.append(`pergunta_midia_${index}`, pergunta.midiaFile);
          }
        });
      }
      await http.post('/competition/missions', payload);
      setForm({
        titulo: '',
        descricao: '',
        pontuacao: 10,
        data_inicio: '',
        data_fim: '',
        tipo: 'FOTO',
        quiz_modo_pontuacao: 'PROPORCIONAL',
      });
      setCapaFile(null);
      setCapaFileName('');
      setPerguntas([emptyQuestion()]);
      await loadMissions();
    } catch (error) {
      alert(error?.response?.data?.message || 'Não foi possível criar a missão.');
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

  const openQuiz = async (missionId) => {
    setActiveQuizId(missionId);
    setQuizLoading(true);
    setQuizError('');
    setQuizMessage('');
    setQuizAnswers({});
    try {
      const { data } = await http.get(`/competition/missions/${missionId}/quiz`);
      setQuizData(data);
      if (data.minha_tentativa) {
        setQuizMessage(
          `Você já respondeu: ${data.minha_tentativa.acertos}/${data.minha_tentativa.total_perguntas} · ${data.minha_tentativa.pontos_obtidos} pts`
        );
      }
    } catch (error) {
      setQuizError(error?.response?.data?.message || 'Não foi possível abrir o quiz.');
      setQuizData(null);
    } finally {
      setQuizLoading(false);
    }
  };

  const submitQuiz = async () => {
    if (!activeQuizId || !quizData?.perguntas?.length) return;
    const respostas = quizData.perguntas.map((pergunta) => ({
      pergunta_id: pergunta.id,
      alternativa_id: quizAnswers[pergunta.id],
    }));
    if (respostas.some((r) => !r.alternativa_id)) {
      setQuizError('Responda todas as perguntas antes de enviar.');
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
      setQuizData((prev) =>
        prev
          ? {
              ...prev,
              minha_tentativa: {
                acertos: data.acertos,
                total_perguntas: data.total_perguntas,
                pontos_obtidos: data.pontos_obtidos,
              },
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
        <p className="mt-1 text-sm text-zinc-500">
          Foto, áudio, vídeo ou quiz — pontuação automática no envio.
        </p>
      </header>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="grid gap-4">
          {isAdmin ? (
            <form
              className="ig-card grid gap-2 p-4 sm:grid-cols-2 xl:grid-cols-3"
              onSubmit={createMission}
            >
              <select
                className="ig-input"
                value={form.tipo}
                onChange={(e) => {
                  setForm((s) => ({ ...s, tipo: e.target.value }));
                  setCapaFile(null);
                  setCapaFileName('');
                }}
              >
                <option value="FOTO">Tipo: Foto</option>
                <option value="AUDIO">Tipo: Áudio</option>
                <option value="VIDEO">Tipo: Vídeo</option>
                <option value="QUIZ">Tipo: Quiz</option>
              </select>
              {form.tipo === 'QUIZ' ? (
                <select
                  className="ig-input"
                  value={form.quiz_modo_pontuacao}
                  onChange={(e) =>
                    setForm((s) => ({ ...s, quiz_modo_pontuacao: e.target.value }))
                  }
                >
                  <option value="PROPORCIONAL">Pontos: proporcional aos acertos</option>
                  <option value="TUDO_OU_NADA">Pontos: só se acertar tudo</option>
                </select>
              ) : (
                <div className="hidden sm:block" />
              )}
              <input
                className="ig-input"
                placeholder="Título"
                value={form.titulo}
                onChange={(e) => setForm((s) => ({ ...s, titulo: e.target.value }))}
                required
              />
              <textarea
                className="ig-input sm:col-span-2 xl:col-span-3"
                placeholder="Descrição"
                value={form.descricao}
                onChange={(e) => setForm((s) => ({ ...s, descricao: e.target.value }))}
                required
              />
              <input
                className="ig-input"
                type="number"
                min="1"
                value={form.pontuacao}
                onChange={(e) => setForm((s) => ({ ...s, pontuacao: e.target.value }))}
                title="Pontuação total da missão"
              />
              <input
                className="ig-input"
                type="datetime-local"
                value={form.data_inicio}
                onChange={(e) => setForm((s) => ({ ...s, data_inicio: e.target.value }))}
                required
              />
              <input
                className="ig-input"
                type="datetime-local"
                value={form.data_fim}
                onChange={(e) => setForm((s) => ({ ...s, data_fim: e.target.value }))}
                required
              />

              <label className="grid gap-1 text-sm text-zinc-600 sm:col-span-2 xl:col-span-3">
                {form.tipo === 'AUDIO'
                  ? 'Áudio da missão'
                  : form.tipo === 'VIDEO'
                    ? 'Vídeo da missão'
                    : form.tipo === 'QUIZ'
                      ? 'Imagem de capa (opcional)'
                      : 'Foto da missão'}
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
                  required={form.tipo === 'FOTO' || form.tipo === 'AUDIO' || form.tipo === 'VIDEO'}
                />
                {capaFileName ? (
                  <span className="text-xs text-zinc-500">{capaFileName}</span>
                ) : (
                  <span className="text-xs text-zinc-400">
                    {form.tipo === 'FOTO'
                      ? 'Selecione a foto que aparece na missão.'
                      : form.tipo === 'AUDIO'
                        ? 'Selecione o áudio de referência da missão.'
                        : form.tipo === 'VIDEO'
                          ? 'Selecione o vídeo de referência da missão.'
                          : 'Opcional para o quiz.'}
                  </span>
                )}
              </label>

              {form.tipo === 'QUIZ' ? (
                <div className="grid gap-3 sm:col-span-2 xl:col-span-3">
                  <p className="text-sm font-medium text-zinc-700">
                    Perguntas do quiz (pode anexar áudio/vídeo, ex.: “quem está cantando?”)
                  </p>
                  {perguntas.map((pergunta, qIndex) => (
                    <div
                      key={`q-${qIndex}`}
                      className="grid gap-2 rounded-xl border border-zinc-200 bg-zinc-50 p-3"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <strong className="text-sm text-zinc-800">
                          Pergunta {qIndex + 1}
                        </strong>
                        {perguntas.length > 1 ? (
                          <button
                            type="button"
                            className="bg-transparent p-0 text-xs text-rose-600 hover:underline"
                            onClick={() =>
                              setPerguntas((list) => list.filter((_, i) => i !== qIndex))
                            }
                          >
                            Remover
                          </button>
                        ) : null}
                      </div>
                      <input
                        className="ig-input"
                        placeholder='Ex.: Quem está cantando essa música?'
                        value={pergunta.enunciado}
                        onChange={(e) =>
                          updatePergunta(qIndex, { enunciado: e.target.value })
                        }
                        required
                      />
                      <label className="grid gap-1 text-xs text-zinc-500">
                        Mídia opcional (áudio, vídeo ou imagem)
                        <input
                          className="ig-input"
                          type="file"
                          accept="audio/*,video/*,image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0] || null;
                            updatePergunta(qIndex, {
                              midiaFile: file,
                              midiaPreview: file ? file.name : '',
                            });
                          }}
                        />
                        {pergunta.midiaPreview ? (
                          <span className="text-zinc-600">{pergunta.midiaPreview}</span>
                        ) : null}
                      </label>
                      {pergunta.alternativas.map((alt, aIndex) => (
                        <label
                          key={`a-${qIndex}-${aIndex}`}
                          className="flex items-center gap-2"
                        >
                          <input
                            type="radio"
                            name={`correta-${qIndex}`}
                            checked={Boolean(alt.correta)}
                            onChange={() =>
                              updateAlternativa(qIndex, aIndex, { correta: true })
                            }
                          />
                          <input
                            className="ig-input flex-1"
                            placeholder={`Alternativa ${aIndex + 1}`}
                            value={alt.texto}
                            onChange={(e) =>
                              updateAlternativa(qIndex, aIndex, {
                                texto: e.target.value,
                              })
                            }
                            required
                          />
                          {pergunta.alternativas.length > 2 ? (
                            <button
                              type="button"
                              className="bg-transparent p-0 text-xs text-zinc-500 hover:underline"
                              onClick={() =>
                                updatePergunta(qIndex, {
                                  alternativas: pergunta.alternativas.filter(
                                    (_, i) => i !== aIndex
                                  ),
                                })
                              }
                            >
                              ×
                            </button>
                          ) : null}
                        </label>
                      ))}
                      <button
                        type="button"
                        className="justify-self-start bg-transparent p-0 text-xs text-blue-700 hover:underline"
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
                  ))}
                  <button
                    type="button"
                    className="justify-self-start bg-transparent p-0 text-sm text-blue-700 hover:underline"
                    onClick={() => setPerguntas((list) => [...list, emptyQuestion()])}
                  >
                    + Nova pergunta
                  </button>
                </div>
              ) : null}

              <button
                type="submit"
                className="ig-button sm:col-span-2 xl:col-span-1"
                disabled={creating}
              >
                {creating ? 'Criando...' : 'Criar Missão'}
              </button>
            </form>
          ) : null}

          <div className="grid gap-3 md:grid-cols-2">
            {missions.map((mission) => (
              <article key={mission.id} className="ig-card grid gap-3 p-4">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-sm font-semibold text-zinc-900">{mission.titulo}</h3>
                  <div className="flex flex-wrap items-center justify-end gap-1">
                    <span className="rounded-full border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-xs text-zinc-600">
                      {TIPO_LABEL[mission.tipo] || mission.tipo || 'Foto'}
                    </span>
                    <span
                      className={`rounded-full border px-2 py-0.5 text-xs ${
                        mission.status === 'ABERTA'
                          ? 'border-emerald-200 bg-emerald-50 text-emerald-600'
                          : mission.status === 'ENCERRADA'
                            ? 'border-rose-200 bg-rose-50 text-rose-600'
                            : 'border-amber-200 bg-amber-50 text-amber-600'
                      }`}
                    >
                      {mission.status}
                    </span>
                  </div>
                </div>
                <p className="text-sm text-zinc-600">{mission.descricao}</p>
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
                <small className="text-xs text-zinc-500">
                  {mission.pontuacao} pts
                  {mission.tipo === 'QUIZ'
                    ? ` · ${mission.quiz_modo_pontuacao === 'TUDO_OU_NADA' ? 'tudo ou nada' : 'proporcional'}`
                    : ''}{' '}
                  • {new Date(mission.data_inicio).toLocaleDateString('pt-BR')} -{' '}
                  {new Date(mission.data_fim).toLocaleDateString('pt-BR')}
                </small>

                {mission.tipo === 'QUIZ' && mission.minha_tentativa ? (
                  <p className="text-sm text-emerald-700">
                    Sua pontuação: {mission.minha_tentativa.acertos}/
                    {mission.minha_tentativa.total_perguntas} ·{' '}
                    {mission.minha_tentativa.pontos_obtidos} pts para o time
                  </p>
                ) : null}

                {mission.tipo !== 'QUIZ' && mission.meu_envio ? (
                  <p className="text-sm text-emerald-700">
                    Envio concluído · +{mission.meu_envio.pontos_obtidos} pts para o
                    time
                  </p>
                ) : null}

                {isAdmin ? (
                  <button
                    className="ig-button"
                    type="button"
                    onClick={() => publishMission(mission.id)}
                    disabled={mission.status === 'ABERTA'}
                  >
                    {mission.status === 'ABERTA' ? 'Já liberada' : 'Liberar Missão'}
                  </button>
                ) : mission.tipo === 'QUIZ' ? (
                  <button
                    className="ig-button"
                    type="button"
                    onClick={() => openQuiz(mission.id)}
                    disabled={mission.status !== 'ABERTA'}
                  >
                    {mission.minha_tentativa ? 'Ver resultado' : 'Responder quiz'}
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
                      disabled={mission.status !== 'ABERTA'}
                    />
                    <button
                      className="ig-button"
                      type="button"
                      disabled={!submissionFiles[mission.id] || mission.status !== 'ABERTA'}
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
                    Pré-visualizar perguntas
                  </button>
                ) : null}
              </article>
            ))}
          </div>

          {activeQuizId ? (
            <div className="ig-card grid gap-3 border-zinc-300 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-base font-semibold text-zinc-900">
                    {quizData?.missao?.titulo || 'Quiz'}
                  </h3>
                  <p className="text-sm text-zinc-500">
                    {quizData?.missao?.pontuacao || 0} pts ·{' '}
                    {quizData?.missao?.quiz_modo_pontuacao === 'TUDO_OU_NADA'
                      ? 'tudo ou nada'
                      : 'proporcional'}
                  </p>
                </div>
                <button
                  type="button"
                  className="bg-transparent p-0 text-sm text-zinc-500 hover:underline"
                  onClick={() => {
                    setActiveQuizId(null);
                    setQuizData(null);
                    setQuizError('');
                    setQuizMessage('');
                  }}
                >
                  Fechar
                </button>
              </div>

              {quizLoading && !quizData ? (
                <p className="text-sm text-zinc-500">Carregando...</p>
              ) : null}
              {quizError ? <p className="text-sm text-rose-500">{quizError}</p> : null}
              {quizMessage ? (
                <p className="text-sm text-emerald-700">{quizMessage}</p>
              ) : null}

              {quizData?.perguntas?.map((pergunta, index) => (
                <fieldset key={pergunta.id} className="grid gap-2">
                  <legend className="text-sm font-medium text-zinc-800">
                    {index + 1}. {pergunta.enunciado}
                  </legend>
                  <QuestionMedia
                    midiaUrl={pergunta.midia_url}
                    midiaTipo={pergunta.midia_tipo}
                  />
                  {pergunta.alternativas.map((alt) => (
                    <label
                      key={alt.id}
                      className="flex cursor-pointer items-center gap-2 rounded-lg border border-zinc-200 px-3 py-2 text-sm"
                    >
                      <input
                        type="radio"
                        name={`quiz-${pergunta.id}`}
                        disabled={Boolean(quizData.minha_tentativa) || quizLoading}
                        checked={Number(quizAnswers[pergunta.id]) === Number(alt.id)}
                        onChange={() =>
                          setQuizAnswers((state) => ({
                            ...state,
                            [pergunta.id]: alt.id,
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
              ))}

              {!quizData?.minha_tentativa && quizData?.perguntas?.length ? (
                <button
                  type="button"
                  className="ig-button"
                  disabled={quizLoading}
                  onClick={submitQuiz}
                >
                  {quizLoading ? 'Enviando...' : 'Enviar respostas (1 tentativa)'}
                </button>
              ) : null}
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
              <span>Abertas</span>
              <strong className="text-zinc-900">
                {missions.filter((m) => m.status === 'ABERTA').length}
              </strong>
            </div>
            <div className="flex items-center justify-between text-sm text-zinc-500">
              <span>Quizzes</span>
              <strong className="text-zinc-900">
                {missions.filter((m) => m.tipo === 'QUIZ').length}
              </strong>
            </div>
            <div className="flex items-center justify-between text-sm text-zinc-500">
              <span>Em análise</span>
              <strong className="text-zinc-900">
                {missions.filter((m) => m.status === 'EM_ANALISE').length}
              </strong>
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}

export default MissionsPage;
