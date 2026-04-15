type AppFooterProps = {
  version: string
}

export default function AppFooter({ version }: AppFooterProps) {
  return (
    <footer className="mt-10 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="grid gap-6 lg:grid-cols-[1.7fr_1fr]">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">
            Processamento 100% local
          </h2>

          <p className="mt-3 text-sm leading-6 text-slate-600">
            Seus arquivos são processados diretamente no seu navegador. O sistema
            não envia PDFs, DWGs, nomes de arquivos ou presets para servidores
            externos durante o uso normal da ferramenta.
          </p>

          <p className="mt-3 text-sm leading-6 text-slate-600">
            Isso significa que a renomeação, a organização dos blocos, a revisão
            global e a geração do ZIP acontecem localmente no seu computador,
            oferecendo mais privacidade, mais controle e mais segurança para o
            seu fluxo de trabalho.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-slate-900">Contato</h2>

          <div className="mt-3 space-y-2 text-sm text-slate-600">
            <p>
              YouTube:{' '}
              <a
                href="https://www.youtube.com/@BIMBLIOTECAREVIT"
                target="_blank"
                rel="noreferrer"
                className="font-medium text-sky-700 hover:underline"
              >
                BIMBLIOTECA REVIT
              </a>
            </p>

            <p>
              E-mail:{' '}
              <a
                href="mailto:bimbliotecarevit@gmail.com"
                className="font-medium text-sky-700 hover:underline"
              >
                bimbliotecarevit@gmail.com
              </a>
            </p>

            <p className="pt-2 text-xs text-slate-400">Versão {version}</p>
          </div>
        </div>
      </div>
    </footer>
  )
}