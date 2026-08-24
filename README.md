# BauerDutraFlix v2

## Instalação

1. Copie `.env.example` para `.env.local`.
2. Coloque sua chave TMDB em `NEXT_PUBLIC_TMDB_KEY`.
3. Execute:

```powershell
npm install
npm run dev
```

Abra `http://localhost:3000`.

A consulta de IDs da SuperFlix passa pelo servidor Next. Os metadados do TMDB são carregados no navegador para evitar os timeouts que ocorriam no Node.
