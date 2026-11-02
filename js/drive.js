/* Backup no Google Drive, 100% no navegador.
   Usa o login do Google (Google Identity Services, "token model") e a API REST do Drive com o escopo
   drive.appdata: a pasta oculta do aplicativo. O app só enxerga o arquivo que ele mesmo criou, nunca o resto do Drive.
   O token de acesso fica só na memória (expira em cerca de 1 hora) e nunca é gravado. */
(function (root) {
  /* ID de cliente OAuth do app (público por natureza: não é segredo; só vale nas origens autorizadas no Google Cloud).
     Quem hospedar o próprio site pode trocar por outro ID na tela de configuração. */
  var ID_PADRAO = '123288636103-k55hebl3lti48m6f1c8d0kdh08ip81ch.apps.googleusercontent.com';
  var ESCOPO = 'https://www.googleapis.com/auth/drive.appdata';
  var ARQUIVO = 'estoque-inteligente-backup.json';
  var token = null, expira = 0, clienteId = '';

  function erro(codigo, msg) { var e = new Error(msg); e.codigo = codigo; return e; }

  function carregarGIS() {
    if (root.google && root.google.accounts && root.google.accounts.oauth2) return Promise.resolve();
    return new Promise(function (res, rej) {
      var s = document.createElement('script');
      s.src = 'https://accounts.google.com/gsi/client'; s.async = true;
      s.onload = function () { (root.google && root.google.accounts) ? res() : rej(erro('offline', 'O login do Google não carregou.')); };
      s.onerror = function () { rej(erro('offline', 'Não foi possível carregar o login do Google. Confira a internet.')); };
      document.head.appendChild(s);
    });
  }

  function conectar(id) {
    id = String(id || '').trim() || ID_PADRAO;
    return carregarGIS().then(function () {
      return new Promise(function (res, rej) {
        var c = root.google.accounts.oauth2.initTokenClient({
          client_id: id, scope: ESCOPO,
          callback: function (r) {
            if (!r || r.error) { rej(erro('auth', (r && (r.error_description || r.error)) || 'Falha no login.')); return; }
            token = r.access_token; clienteId = id; expira = Date.now() + ((r.expires_in || 3600) * 1000) - 60000; res();
          },
          error_callback: function (e) {
            rej(erro('auth', e && e.type === 'popup_closed' ? 'A janela do Google foi fechada antes de concluir.' :
              e && e.type === 'popup_failed_to_open' ? 'O navegador bloqueou a janela do Google. Permita pop-ups e tente de novo.' : (e && e.message) || 'Falha no login.'));
          }
        });
        c.requestAccessToken();
      });
    });
  }

  function temToken() { return !!token && Date.now() < expira; }
  function expiraEm() { return temToken() ? new Date(expira) : null; }

  function req(url, opts) {
    if (!temToken()) { token = null; return Promise.reject(erro('auth', 'Sessão expirada. Clique em Conectar de novo.')); }
    opts = opts || {}; opts.headers = Object.assign({ Authorization: 'Bearer ' + token }, opts.headers || {});
    return fetch(url, opts).then(function (r) {
      if (r.ok) return r;
      if (r.status === 401) { token = null; throw erro('auth', 'Sessão expirada. Clique em Conectar de novo.'); }
      return r.text().then(function (t) {
        if (r.status === 403 && /(accessNotConfigured|has not been used|is disabled|SERVICE_DISABLED)/i.test(t)) throw erro('api', 'A Google Drive API não está ativada no projeto Google deste app. Quem mantém o app precisa ativá-la em APIs e serviços → Biblioteca.');
        if (r.status === 403) throw erro('permissao', 'O Google negou a permissão. Se o app ainda está em modo de teste, o seu e-mail precisa estar na lista de usuários de teste do projeto.');
        throw erro('http', 'O Drive respondeu com erro ' + r.status + '.');
      });
    }, function () { throw erro('offline', 'Sem internet. Seus dados continuam salvos neste aparelho.'); });
  }

  /* arquivo de backup mais recente na pasta do app, ou null */
  function info() {
    var q = encodeURIComponent("name='" + ARQUIVO + "' and trashed=false");
    return req('https://www.googleapis.com/drive/v3/files?spaces=appDataFolder&q=' + q + '&orderBy=modifiedTime%20desc&pageSize=1&fields=files(id,name,modifiedTime,size)')
      .then(function (r) { return r.json(); }).then(function (j) { return (j.files && j.files[0]) || null; });
  }

  function salvar(obj, idExistente) {
    var corpo = JSON.stringify(obj);
    if (idExistente) {
      return req('https://www.googleapis.com/upload/drive/v3/files/' + encodeURIComponent(idExistente) + '?uploadType=media&fields=id,modifiedTime',
        { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: corpo }).then(function (r) { return r.json(); });
    }
    var b = 'estoque' + Date.now().toString(36);
    var multi = '--' + b + '\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n' +
      JSON.stringify({ name: ARQUIVO, parents: ['appDataFolder'], mimeType: 'application/json' }) + '\r\n--' + b +
      '\r\nContent-Type: application/json\r\n\r\n' + corpo + '\r\n--' + b + '--';
    return req('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,modifiedTime',
      { method: 'POST', headers: { 'Content-Type': 'multipart/related; boundary=' + b }, body: multi }).then(function (r) { return r.json(); });
  }

  function baixar(id) {
    return req('https://www.googleapis.com/drive/v3/files/' + encodeURIComponent(id) + '?alt=media').then(function (r) { return r.json(); });
  }

  function desconectar() {
    var t = token; token = null; expira = 0;
    try { if (t && root.google && root.google.accounts && root.google.accounts.oauth2.revoke) root.google.accounts.oauth2.revoke(t, function () {}); } catch (e) { /* ignora */ }
  }

  var api = { ID_PADRAO: ID_PADRAO, ARQUIVO: ARQUIVO, ESCOPO: ESCOPO, conectar: conectar, temToken: temToken, expiraEm: expiraEm, info: info, salvar: salvar, baixar: baixar, desconectar: desconectar };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.DRIVE = api;
})(typeof window !== 'undefined' ? window : this);
