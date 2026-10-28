"""Travas de segurança: acesso só local à API, CSV sem fórmula, SSRF no
analisador de sites."""

import sqlite3

import pytest

import app as app_module
import db
import exportacao
import processar


@pytest.fixture
def cliente(tmp_path, monkeypatch):
    caminho_banco_teste = tmp_path / "leads_teste.db"
    monkeypatch.setattr(db, "CAMINHO_BANCO", caminho_banco_teste)
    conexao = sqlite3.connect(caminho_banco_teste)
    processar.preparar_banco(conexao)
    conexao.close()
    app_module.app.config["TESTING"] = True
    with app_module.app.test_client() as cliente_teste:
        yield cliente_teste


class TestAcessoSoLocal:
    def test_host_local_passa(self, cliente):
        for host in ("localhost:5000", "127.0.0.1:5173", "[::1]:5000"):
            assert cliente.get("/api/leads", headers={"Host": host}).status_code == 200

    def test_host_externo_e_barrado(self, cliente):
        # DNS rebinding: o navegador manda o Host do domínio do atacante
        resposta = cliente.get("/api/leads", headers={"Host": "evil.example:5000"})
        assert resposta.status_code == 403

    def test_escrita_com_origin_de_outro_site_e_barrada(self, cliente):
        resposta = cliente.post(
            "/api/instagram/posts/1/retomar", headers={"Origin": "https://evil.example"}
        )
        assert resposta.status_code == 403

    def test_escrita_com_origin_null_e_barrada(self, cliente):
        resposta = cliente.post("/api/instagram/posts/1/retomar", headers={"Origin": "null"})
        assert resposta.status_code == 403

    def test_escrita_vinda_do_frontend_local_passa(self, cliente):
        resposta = cliente.post(
            "/api/instagram/posts/999/retomar", headers={"Origin": "http://localhost:5173"}
        )
        assert resposta.status_code == 404  # chegou na rota (post inexistente)


class TestCsvSeguro:
    def test_formula_vira_texto(self):
        assert exportacao._celula_segura("=HYPERLINK(\"http://x\")") == "'=HYPERLINK(\"http://x\")"
        assert exportacao._celula_segura("@SUM(A1)") == "'@SUM(A1)"
        assert exportacao._celula_segura("+cmd|' /C calc'!A0") == "'+cmd|' /C calc'!A0"

    def test_telefone_e_numero_nao_sao_alterados(self):
        assert exportacao._celula_segura("+55 (17) 99999-0000") == "+55 (17) 99999-0000"
        assert exportacao._celula_segura("-3.5") == "-3.5"
        assert exportacao._celula_segura(4.5) == 4.5
        assert exportacao._celula_segura("Padaria") == "Padaria"

    def test_csv_sai_com_bom_para_o_excel(self, cliente):
        resposta = cliente.get("/api/exportar")
        assert resposta.status_code == 200
        assert resposta.get_data(as_text=True).startswith("﻿nome,")


class TestAnalisadorDeSites:
    def test_recusa_url_de_rede_interna(self):
        import requests

        for url in ("http://127.0.0.1:5000/api/leads", "http://192.168.0.1/", "http://[::1]/"):
            with pytest.raises(requests.exceptions.ConnectionError):
                processar.baixar_pagina(url)

    def test_recusa_redirecionamento_para_localhost(self, monkeypatch):
        import requests

        class Redireciona:
            is_redirect = True
            headers = {"Location": "http://127.0.0.1:5000/api/configuracoes/scraper-proxies"}

            def close(self):
                pass

        monkeypatch.setattr(processar, "_host_e_publico", lambda host: host != "127.0.0.1")
        monkeypatch.setattr(requests, "get", lambda *a, **kw: Redireciona())
        with pytest.raises(requests.exceptions.ConnectionError):
            processar.baixar_pagina("https://site-do-lead.com.br")

    def test_intervalo_de_copyright_usa_o_ano_final(self):
        _checklist, ano = processar.montar_checklist_site("<footer>© 2001-2026 Empresa</footer>", "https://x")
        assert ano == 2026
