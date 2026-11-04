# PS4 Remote Package Hub

Interface web para comunicação com o Remote Package Installer do PS4.

## Recursos

- Interface adaptada para navegador do PS4.
- Configuração de IP e porta.
- Teste de comunicação com o RPI.
- Envio de URL direta de PKG.
- Catálogo em JSON.
- Histórico de operações.

## Requisitos

- PS4 conectado à mesma rede local do dispositivo que hospeda a página.
- Remote Package Installer instalado e em execução.
- Endereço IP correto do console.
- Porta padrão 12800.
- URL do PKG acessível pelo próprio PS4.

## Publicação no GitHub Pages

1. Crie um repositório no GitHub.
2. Envie todos os arquivos mantendo as pastas.
3. Acesse Settings.
4. Entre em Pages.
5. Em Build and deployment, escolha Deploy from a branch.
6. Escolha a branch main e a pasta /root.
7. Salve e aguarde a publicação.

## Configuração

Abra o endereço do GitHub Pages no navegador do PS4.

Informe o IP local do console e mantenha a porta 12800.

Clique em Salvar endereço e depois em Testar conexão.

## Limitações técnicas

O GitHub Pages é HTTPS, enquanto o RPI normalmente usa HTTP na rede local.

O navegador pode bloquear essa comunicação por políticas de conteúdo misto,
CORS ou segurança de rede local.

O RPI precisa aceitar a origem do GitHub Pages e responder aos pedidos
OPTIONS quando o navegador exigir preflight.

Uma resposta de instalação aceita pelo RPI não significa que o pacote
já terminou de instalar.

A URL do pacote deve ser acessível diretamente pelo PS4.
