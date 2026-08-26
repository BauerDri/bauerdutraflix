@echo off
setlocal
cd /d "%~dp0"

title BauerDutraFlix - Atualizador de Catalogo

cls

echo.
echo ============================================================
echo.
echo             BAUERDUTRAFLIX - ATUALIZADOR
echo.
echo ============================================================
echo.
echo Iniciando atualizacao do catalogo...
echo.

node scripts\sync-superflix.mjs

set EXIT_CODE=%ERRORLEVEL%

echo.
echo ============================================================
echo.

if "%EXIT_CODE%"=="0" (
    title BauerDutraFlix - ATUALIZADO COM SUCESSO

    echo        [OK] CATALOGO ATUALIZADO COM SUCESSO!
    echo.
    echo        O BauerDutraFlix ja esta usando
    echo        o catalogo atualizado no Supabase.
    echo.
) else (
    title BauerDutraFlix - ERRO NA ATUALIZACAO

    echo        [ERRO] A ATUALIZACAO NAO TERMINOU CORRETAMENTE.
    echo.
    echo        Veja os erros acima antes de fechar.
    echo.
)

echo ============================================================
echo.
echo Pressione qualquer tecla para fechar...
pause >nul

endlocal
exit /b %EXIT_CODE%