CREATE TABLE IF NOT EXISTS equipes (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(80) NOT NULL UNIQUE,
  cor VARCHAR(20) NOT NULL,
  escudo_url TEXT,
  foto_url TEXT,
  descricao TEXT,
  alimentos_arrecadados INT DEFAULT 0,
  pontuacao INT DEFAULT 0,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS usuarios (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(120) NOT NULL,
  email VARCHAR(120) NOT NULL UNIQUE,
  telefone VARCHAR(20),
  google_sub VARCHAR(64) UNIQUE,
  senha_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'PARTICIPANTE' CHECK (role IN ('ADMIN', 'PARTICIPANTE')),
  foto TEXT,
  equipe_id INT,
  acessos JSONB,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (equipe_id) REFERENCES equipes(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS participantes (
  id SERIAL PRIMARY KEY,
  usuario_id INT NOT NULL UNIQUE,
  equipe_id INT NOT NULL,
  quantidade_missoes INT DEFAULT 0,
  quantidade_fotos INT DEFAULT 0,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
  FOREIGN KEY (equipe_id) REFERENCES equipes(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS missoes (
  id SERIAL PRIMARY KEY,
  titulo VARCHAR(120) NOT NULL,
  descricao TEXT NOT NULL,
  imagem_capa TEXT,
  pontuacao INT NOT NULL,
  data_inicio TIMESTAMP NOT NULL,
  data_fim TIMESTAMP NOT NULL,
  status VARCHAR(20) DEFAULT 'EM_ANALISE' CHECK (status IN ('ABERTA', 'ENCERRADA', 'EM_ANALISE')),
  liberada_por INT,
  liberada_em TIMESTAMP,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (liberada_por) REFERENCES usuarios(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS envios_missao (
  id SERIAL PRIMARY KEY,
  missao_id INT NOT NULL,
  usuario_id INT NOT NULL,
  equipe_id INT NOT NULL,
  imagem_url TEXT NOT NULL,
  legenda VARCHAR(280),
  status VARCHAR(20) DEFAULT 'EM_ANALISE' CHECK (status IN ('EM_ANALISE', 'APROVADA', 'RECUSADA')),
  observacao_admin TEXT,
  pontuacao_creditada SMALLINT DEFAULT 0,
  aprovado_por INT,
  revisado_em TIMESTAMP,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (missao_id) REFERENCES missoes(id) ON DELETE CASCADE,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
  FOREIGN KEY (equipe_id) REFERENCES equipes(id) ON DELETE CASCADE,
  FOREIGN KEY (aprovado_por) REFERENCES usuarios(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS publicacoes (
  id SERIAL PRIMARY KEY,
  autor_id INT NOT NULL,
  equipe_id INT,
  imagem_url TEXT NOT NULL,
  texto TEXT,
  tipo_publicacao VARCHAR(20) DEFAULT 'LIVRE' CHECK (tipo_publicacao IN ('LIVRE', 'MISSAO_CONCLUIDA')),
  missao_id INT,
  possui_selo_missao SMALLINT DEFAULT 0,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (autor_id) REFERENCES usuarios(id) ON DELETE CASCADE,
  FOREIGN KEY (equipe_id) REFERENCES equipes(id) ON DELETE SET NULL,
  FOREIGN KEY (missao_id) REFERENCES missoes(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS comentarios (
  id SERIAL PRIMARY KEY,
  publicacao_id INT NOT NULL,
  usuario_id INT NOT NULL,
  parent_id INT,
  texto VARCHAR(300) NOT NULL,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  atualizado_em TIMESTAMP,
  FOREIGN KEY (publicacao_id) REFERENCES publicacoes(id) ON DELETE CASCADE,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
  FOREIGN KEY (parent_id) REFERENCES comentarios(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS curtidas (
  id SERIAL PRIMARY KEY,
  publicacao_id INT NOT NULL,
  usuario_id INT NOT NULL,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT unique_like UNIQUE (publicacao_id, usuario_id),
  FOREIGN KEY (publicacao_id) REFERENCES publicacoes(id) ON DELETE CASCADE,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS pontuacoes (
  id SERIAL PRIMARY KEY,
  equipe_id INT NOT NULL,
  pontos INT NOT NULL,
  tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('ADICAO', 'REMOCAO')),
  motivo VARCHAR(150) NOT NULL,
  observacao TEXT,
  referencia_tipo VARCHAR(40),
  referencia_id INT,
  criado_por INT,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (equipe_id) REFERENCES equipes(id) ON DELETE CASCADE,
  FOREIGN KEY (criado_por) REFERENCES usuarios(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS alimentos (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(120) NOT NULL,
  quantidade INT NOT NULL,
  equipe_id INT NOT NULL,
  status VARCHAR(20) DEFAULT 'PENDENTE' CHECK (status IN ('PENDENTE', 'CONFIRMADO')),
  criado_por INT NOT NULL,
  confirmado_por INT,
  confirmado_em TIMESTAMP,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (equipe_id) REFERENCES equipes(id) ON DELETE CASCADE,
  FOREIGN KEY (criado_por) REFERENCES usuarios(id) ON DELETE CASCADE,
  FOREIGN KEY (confirmado_por) REFERENCES usuarios(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS noticias (
  id SERIAL PRIMARY KEY,
  titulo VARCHAR(140) NOT NULL,
  conteudo TEXT NOT NULL,
  imagem_url TEXT,
  autor_id INT,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (autor_id) REFERENCES usuarios(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS notificacoes (
  id SERIAL PRIMARY KEY,
  usuario_id INT NOT NULL,
  titulo VARCHAR(140) NOT NULL,
  mensagem VARCHAR(255) NOT NULL,
  tipo VARCHAR(40) NOT NULL,
  lida SMALLINT DEFAULT 0,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  lida_em TIMESTAMP,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS configuracoes (
  id SERIAL PRIMARY KEY,
  chave VARCHAR(80) UNIQUE NOT NULL,
  valor TEXT,
  atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
