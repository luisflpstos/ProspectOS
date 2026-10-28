"""Geração dos CSVs de exportação (leads do Maps e do Instagram)."""

import csv
import io
import re

from flask import Response

# Planilha executa como fórmula qualquer célula que comece com estes caracteres:
# "=HYPERLINK(...)" numa bio ou comentário do Instagram (texto de terceiros)
# viraria link/fórmula viva ao abrir no Excel (CSV injection)
_INICIO_DE_FORMULA = ("=", "+", "-", "@", "\t", "\r")
# "+55 (17) 99999-0000", "-3.5": número/telefone legítimo, não precisa escapar
_PARECE_NUMERO = re.compile(r"[+-][\d\s().,-]*")


def _celula_segura(valor):
    if not isinstance(valor, str) or not valor.startswith(_INICIO_DE_FORMULA):
        return valor
    if _PARECE_NUMERO.fullmatch(valor):
        return valor
    return "'" + valor


def resposta_csv(cabecalho, linhas, nome_arquivo):
    """Monta o download do CSV. Sai com BOM (utf-8-sig): sem ele o Excel no
    Windows abre o arquivo como ANSI e embaralha os acentos."""
    saida = io.StringIO()
    escritor = csv.writer(saida)
    escritor.writerow(cabecalho)
    for linha in linhas:
        escritor.writerow([_celula_segura(valor) for valor in linha])

    resposta = Response("﻿" + saida.getvalue(), mimetype="text/csv; charset=utf-8")
    resposta.headers["Content-Disposition"] = f"attachment; filename={nome_arquivo}"
    return resposta
