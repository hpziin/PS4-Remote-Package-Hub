
(() => {

    const { $, store, addHistory, endpoint } = window.Hub;

    function bodyFor(item) {

        if (item.kind === 'manifest') {
            return {
                type: 'ref_pkg_url',
                url: item.url
            };
        }

        return {
            type: 'direct',
            packages: item.urls
        };
    }

    function explainError(error) {

        if (location.protocol === 'https:') {
            return 'O navegador pode ter bloqueado a comunicação HTTPS → HTTP com o PS4. Verifique conteúdo misto, acesso à rede local e CORS.';
        }

        return 'Falha de rede ou CORS. Confira o IP, a porta, a rede local e se o RPI está aberto.';
    }

    async function send(item) {

        const url = endpoint() + '/api/install';

        if (!window.Hub.getConfig().ip) {
            $('#send-feedback').textContent =
                'Configure o IP do PS4 primeiro.';
            return;
        }

        const payload = JSON.stringify(bodyFor(item));

        const mode = store.get('sendMode', 'auto');

        $('#send-feedback').textContent =
            'Tentando enviar comando diretamente ao PS4...';

        if (mode !== 'opaque') {

            try {

                const response = await fetch(url, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: payload,
                    mode: 'cors',
                    cache: 'no-store'
                });

                const text = await response.text();

                let data = {};

                try {
                    data = JSON.parse(text);
                } catch {}

                if (!response.ok) {
                    throw new Error('HTTP ' + response.status);
                }

                if (data.status === 'success') {

                    const message =
                        'RPI confirmou o recebimento.';

                    $('#send-feedback').textContent = message;

                    addHistory(
                        item.label,
                        'Confirmado',
                        message
                    );

                    return;
                }

                const message =
                    'Resposta recebida sem confirmação de sucesso: ' + text;

                $('#send-feedback').textContent = message;

                addHistory(
                    item.label,
                    'Resposta recebida',
                    message
                );

                return;

            } catch (error) {

                if (mode === 'read') {

                    const message =
                        explainError(error) + ' Detalhe: ' + error.message;

                    $('#send-feedback').textContent = message;

                    addHistory(
                        item.label,
                        'Falhou',
                        message
                    );

                    return;
                }
            }
        }

        try {

            await fetch(url, {
                method: 'POST',
                mode: 'no-cors',
                headers: {
                    'Content-Type': 'text/plain;charset=UTF-8'
                },
                body: payload,
                cache: 'no-store'
            });

            const message =
                'Solicitação despachada pelo navegador, mas sem confirmação. ' +
                'O navegador não permite verificar se o PS4 recebeu ou aceitou o comando.';

            $('#send-feedback').textContent = message;

            addHistory(
                item.label,
                'Não confirmado',
                message
            );

        } catch (error) {

            const message =
                explainError(error) + ' Detalhe: ' + error.message;

            $('#send-feedback').textContent = message;

            addHistory(
                item.label,
                'Bloqueado',
                message
            );
        }
    }

    async function test() {

        const config = window.Hub.getConfig();

        if (!config.ip) {
            $('#connection-feedback').textContent =
                'Informe o IP do PS4.';
            return;
        }

        $('#connection-feedback').textContent =
            'Testando comunicação com o RPI...';

        $('#connection-label').textContent = 'Testando...';

        const url = endpoint() + '/api/is_exists';

        try {

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    title_id: 'CUSA00000'
                }),
                mode: 'cors',
                cache: 'no-store'
            });

            const text = await response.text();

            if (!response.ok) {
                throw new Error('HTTP ' + response.status);
            }

            $('#connection-feedback').textContent =
                'O RPI respondeu. Resposta: ' + text;

            $('#connection-label').textContent =
                'Console respondendo';

            addHistory(
                'Teste de conexão',
                'Respondendo',
                'Endpoint /api/is_exists respondeu.'
            );

        } catch (error) {

            const message =
                explainError(error) + ' Detalhe: ' + error.message;

            $('#connection-feedback').textContent = message;

            $('#connection-label').textContent =
                'Não confirmado';

            addHistory(
                'Teste de conexão',
                'Não confirmado',
                message
            );
        }
    }

    $('#test-connection').addEventListener('click', test);

    window.RPI = {
        send,
        test
    };

})();
