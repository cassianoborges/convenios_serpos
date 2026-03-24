-- Adicione ao SQL Editor do Supabase (ou rode via npm run migrate)

CREATE TABLE IF NOT EXISTS eventos (
  id           SERIAL PRIMARY KEY,
  event_name   VARCHAR(50)  NOT NULL,             -- 'partner_click', 'category_filter', 'search', 'contact_click', 'page_view'
  partner_id   INT          REFERENCES convenios(id) ON DELETE SET NULL,
  partner_nome VARCHAR(150),
  categoria    VARCHAR(50),
  unidade_id   INT          REFERENCES unidades(id) ON DELETE SET NULL,
  valor        TEXT,                               -- termo de busca, categoria clicada, etc.
  utm_source   VARCHAR(100),
  utm_medium   VARCHAR(100),
  utm_campaign VARCHAR(100),
  utm_term     VARCHAR(100),
  utm_content  VARCHAR(100),
  referrer     TEXT,
  created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_eventos_event_name  ON eventos(event_name);
CREATE INDEX IF NOT EXISTS idx_eventos_created_at  ON eventos(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_eventos_partner_id  ON eventos(partner_id);
CREATE INDEX IF NOT EXISTS idx_eventos_utm_source  ON eventos(utm_source);
