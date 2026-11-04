
(function () {
    "use strict";

    window.RPI = {
        ip: "",
        port: 12800,

        configure: function (ip, port) {
            this.ip = String(ip || "")
                .replace(/^https?:\/\//i, "")
                .replace(/\/.*$/, "");

            this.port = parseInt(port, 10) || 12800;
        },

        getBaseURL: function () {
            if (!this.ip) {
                throw new Error("IP do PS4 não configurado.");
            }

            return "http://" + this.ip + ":" + this.port;
        },

        request: function (endpoint, data, callback) {
            var xhr = new XMLHttpRequest();
            var url;

            try {
                url = this.getBaseURL() + endpoint;
            } catch (error) {
                callback(error, null);
                return;
            }

            xhr.open("POST", url, true);
            xhr.timeout = 15000;

            /*
             * text/plain evita o preflight CORS tradicional
             * causado pelo Content-Type application/json.
             *
             * O corpo continua sendo JSON. O RPI original
             * interpreta o corpo como JSON.
             */
            xhr.setRequestHeader(
                "Content-Type",
                "text/plain;charset=UTF-8"
            );

            xhr.onreadystatechange = function () {
                if (xhr.readyState !== 4) {
                    return;
                }

                if (xhr.status >= 200 && xhr.status < 300) {
                    var response;

                    try {
                        response = JSON.parse(xhr.responseText);
                    } catch (error) {
                        callback(
                            new Error("Resposta do RPI não é JSON válido."),
                            null
                        );
                        return;
                    }

                    callback(null, response);
                } else {
                    callback(
                        new Error("Resposta HTTP: " + xhr.status),
                        null
                    );
                }
            };

            xhr.onerror = function () {
                callback(
                    new Error(
                        "O navegador bloqueou a comunicação ou o RPI não respondeu. " +
                        "Verifique CORS, HTTP e acesso à rede local."
                    ),
                    null
                );
            };

            xhr.ontimeout = function () {
                callback(
                    new Error("Tempo esgotado aguardando o RPI."),
                    null
                );
            };

            try {
                xhr.send(JSON.stringify(data));
            } catch (error) {
                callback(error, null);
            }
        },

        test: function (callback) {
            this.request(
                "/api/is_exists",
                { title_id: "CUSA00000" },
                callback
            );
        },

        install: function (pkgURL, callback) {
            if (!/^https?:\/\//i.test(pkgURL)) {
                callback(
                    new Error("Informe uma URL HTTP ou HTTPS válida."),
                    null
                );
                return;
            }

            this.request(
                "/api/install",
                {
                    type: "direct",
                    packages: [pkgURL]
                },
                callback
            );
        }
    };
})();
