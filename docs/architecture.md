# Arquitetura do Omnicast

Este documento descreve a estrutura de pastas e o fluxo de dados do projeto.

## Visão Geral

- **backend**: endpoint Python para enviar/atualizar status.
- **lib**: lógica core (adapters, db, ingestion, jobs, policies, quarantine, subtitles, utils, validators).
- **frontend**: PWA, páginas, componentes e assets.
- **scripts**: build, tarefas de dados e jobs automatizados.
- **tests**: unitários e end-to-end.
- **docker**: Dockerfile e Nginx.

## Fluxo de Dados

client/browser → frontend → API (backend) → lib/ingestion → lib/db → lib/utils → frontend


## Descrição dos Módulos em lib/

- **adapters/**: integração com serviços externos (Pluto, Radiobrowser, RTP).  
- **db/**: abstrações de acesso a PostgreSQL (pg).  
- **ingestion/**: orquestra ingestão de fluxos e metadata.  
- **jobs/**: agendamento e reprocessamento de quarentena.  
- **policies/**: regras de priorização e seleção de VOD.  
- **quarantine/**: lógica de detecção e reprocessamento de conteúdos em quarentena.  
- **subtitles/**: download e sincronização de legendas.  
- **utils/**: métodos auxiliares de normalização e fallback.  
- **validators/**: schemas e validações (AJV, HLS, ICY, VOD).

## Diagramas

Adicione aqui um diagrama ASCII ou referencie um arquivo `.png`/`.svg` em `docs/`.

## Como Estender

Explique como adicionar novos adaptadores, pipeline de ingestão ou regras de política.
