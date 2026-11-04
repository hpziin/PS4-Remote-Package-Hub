
# PS4 Remote Package Hub

Aplicativo web estático para comunicação direta com o Remote Package Installer do PS4.

## Requisitos

- Windows
- Navegador atualizado
- PS4 na mesma rede local
- Remote Package Installer instalado e aberto
- IP local do PS4
- Porta padrão 12800

## Publicação

1. Crie um repositório no GitHub.
2. Envie todos os arquivos para a raiz.
3. Entre em Settings.
4. Abra Pages.
5. Selecione Deploy from a branch.
6. Escolha main.
7. Selecione /(root).
8. Salve.

## Configuração

1. Abra o site.
2. Entre em Console / RPI.
3. Informe o IP do PS4.
4. Mantenha a porta 12800.
5. Salve.
6. Teste a comunicação.

## API

POST /api/is_exists

POST /api/install

Envio direto:

{
  "type": "direct",
  "packages": [
    "https://servidor.com/arquivo.pkg"
  ]
}

Manifesto:

{
  "type": "ref_pkg_url",
  "url": "https://servidor.com/manifest.json"
}

## Limitações

O GitHub Pages utiliza HTTPS. O RPI original utiliza HTTP na rede local.

O navegador pode bloquear o acesso por conteúdo misto ou CORS.

O modo no-cors não confirma o recebimento do comando.

O catálogo, histórico e fila são armazenados localmente no navegador.
