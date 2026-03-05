-- ========================================================================================
-- MIGRAÇÃO: Relatório de Turno — Criar tabelas no Supabase (schema gps_mec)
-- Execute este script no SQL Editor do Supabase (painel > SQL Editor > New Query > Run)
-- ========================================================================================

-- 1. Tabela principal de relatórios de turno
CREATE TABLE IF NOT EXISTS gps_mec.relatorio_gps_mec_relatorios_turno (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  supervisor_id uuid REFERENCES gps_mec.efetivo_gps_mec_supervisores(id),
  supervisor_nome text NOT NULL,
  letra_turno text,
  data date NOT NULL,
  observacoes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 2. Tabela de equipamentos por relatório (1:N)
CREATE TABLE IF NOT EXISTS gps_mec.relatorio_gps_mec_relatorio_equipamentos (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  relatorio_id uuid NOT NULL REFERENCES gps_mec.relatorio_gps_mec_relatorios_turno(id) ON DELETE CASCADE,
  equipamento_placa text NOT NULL,
  equipamento_tipo text,
  vaga text,
  area text,
  motorista text,
  operadores jsonb DEFAULT '[]',
  trocas jsonb DEFAULT '[]',
  created_at timestamptz DEFAULT now()
);

-- 3. Habilitar RLS
ALTER TABLE gps_mec.relatorio_gps_mec_relatorios_turno ENABLE ROW LEVEL SECURITY;
ALTER TABLE gps_mec.relatorio_gps_mec_relatorio_equipamentos ENABLE ROW LEVEL SECURITY;

-- 4. Policies — permitir CRUD para authenticated
CREATE POLICY "Authenticated users can read relatorios"
  ON gps_mec.relatorio_gps_mec_relatorios_turno
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert relatorios"
  ON gps_mec.relatorio_gps_mec_relatorios_turno
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update relatorios"
  ON gps_mec.relatorio_gps_mec_relatorios_turno
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated users can read relatorio_equipamentos"
  ON gps_mec.relatorio_gps_mec_relatorio_equipamentos
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert relatorio_equipamentos"
  ON gps_mec.relatorio_gps_mec_relatorio_equipamentos
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update relatorio_equipamentos"
  ON gps_mec.relatorio_gps_mec_relatorio_equipamentos
  FOR UPDATE TO authenticated USING (true);

-- 5. Grants
GRANT ALL ON gps_mec.relatorio_gps_mec_relatorios_turno TO authenticated;
GRANT ALL ON gps_mec.relatorio_gps_mec_relatorio_equipamentos TO authenticated;
GRANT SELECT ON gps_mec.relatorio_gps_mec_relatorios_turno TO anon;
GRANT SELECT ON gps_mec.relatorio_gps_mec_relatorio_equipamentos TO anon;

-- 6. Índices úteis para queries de dashboard
CREATE INDEX IF NOT EXISTS idx_relatorios_turno_data ON gps_mec.relatorio_gps_mec_relatorios_turno(data);
CREATE INDEX IF NOT EXISTS idx_relatorios_turno_supervisor ON gps_mec.relatorio_gps_mec_relatorios_turno(supervisor_id);
CREATE INDEX IF NOT EXISTS idx_relatorio_equip_relatorio ON gps_mec.relatorio_gps_mec_relatorio_equipamentos(relatorio_id);
