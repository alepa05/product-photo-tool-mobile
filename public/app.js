<!doctype html>
<html lang="it">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
    <title>Packshot Automatico</title>
    <meta name="theme-color" content="#111827" />
    <link rel="manifest" href="/manifest.json" />
    <link rel="stylesheet" href="/styles.css" />
  </head>
  <body>
    <main class="app-shell">
      <section class="card hero-card">
        <div class="badge">Versione smartphone</div>
        <h1>Packshot Automatico</h1>
        <p class="subtitle">
          Carica una foto del prodotto, inserisci il codice articolo e genera un JPEG con sfondo bianco, luci e ombre.
        </p>
      </section>

      <section class="card form-card">
        <form id="packshotForm">
          <label class="field">
            <span>Codice articolo</span>
            <input
              id="articleCode"
              name="articleCode"
              type="text"
              inputmode="text"
              autocomplete="off"
              placeholder="Es. 0334415"
              required
            />
          </label>

          <label class="field file-field">
            <span>Foto prodotto</span>
            <input
              id="image"
              name="image"
              type="file"
              accept="image/*"
              capture="environment"
              required
            />
            <small>Puoi scattare direttamente dalla fotocamera o scegliere una foto dalla galleria.</small>
          </label>

          <div id="previewWrap" class="preview-wrap hidden">
            <img id="preview" alt="Anteprima foto caricata" />
          </div>

          <button id="submitBtn" type="submit">Genera JPEG</button>
        </form>
      </section>

      <section id="statusCard" class="card status-card hidden" aria-live="polite">
        <div id="statusText">In attesa...</div>
      </section>

      <section id="resultCard" class="card result-card hidden">
        <h2>File pronto</h2>
        <p id="resultText"></p>
        <a id="downloadLink" class="download-btn" href="#" download>Scarica JPEG</a>
      </section>
    </main>

    <script src="/app.js"></script>
  </body>
</html>
