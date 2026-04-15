# Renomeador de Pranchas

Ferramenta web em React + Vite para padronização e renomeação de arquivos **PDF** e **DWG** com foco em fluxos de documentação técnica.

## Funcionalidades

- Upload de arquivos PDF e DWG
- Organização de blocos com drag and drop
- Ativação e desativação de partes do nome
- Presets salvos localmente no navegador
- Importação e exportação de presets em JSON
- Revisão global quando detectada no nome
- Preview em tempo real
- Exportação dos arquivos renomeados em ZIP
- Deploy via GitHub Pages

## Privacidade e processamento local

Todos os arquivos são processados localmente no navegador.

Na prática, isso significa que os nomes dos arquivos, os PDFs, os DWGs, a revisão global, os presets e a geração do ZIP acontecem diretamente no computador do usuário durante o uso da ferramenta.

A aplicação **não depende de upload dos arquivos para a nuvem** para executar a renomeação no fluxo normal de uso, o que oferece mais privacidade, mais controle e mais segurança para o processo.

## Tecnologias

- React
- Vite
- TypeScript
- Tailwind CSS
- dnd-kit
- JSZip
- file-saver

## Rodando localmente

```bash
npm install
npm run dev