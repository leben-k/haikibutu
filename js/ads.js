/* 不法投棄罰  広告の読み込み
   Googleスプレッドシート（ウェブに公開したCSV）から広告コードを読み込み、
   各ページの広告枠（data-ad-id）に表示します。
   ・画像リンク型 … そのまま枠に表示
   ・script型（モーションウィジェットなど）… 枠の中の小さな窓（iframe）で動かす
   ※ どちらも楽天のコードを書き換えず、指定の大きさのまま表示します（縮小・切り取りなし）
*/
(function () {
  'use strict';

  var url = window.AD_SHEET_CSV_URL;
  if (!url || !window.fetch) { return; }        // 設定がなければ何もしない（HTMLに直接貼った広告はそのまま表示）

  var slots = document.querySelectorAll('.ad-slot[data-ad-id]');
  if (!slots.length) { return; }

  /* ---- CSVを読む（セルの中の改行・カンマ・" にも対応） ---- */
  function parseCSV(text) {
    var rows = [], row = [], cell = '', q = false, i, c;
    text = text.replace(/^﻿/, '');
    for (i = 0; i < text.length; i++) {
      c = text[i];
      if (q) {
        if (c === '"') {
          if (text[i + 1] === '"') { cell += '"'; i++; } else { q = false; }
        } else { cell += c; }
      } else if (c === '"') { q = true; }
      else if (c === ',') { row.push(cell); cell = ''; }
      else if (c === '\n' || c === '\r') {
        if (c === '\r' && text[i + 1] === '\n') { i++; }
        row.push(cell); rows.push(row); row = []; cell = '';
      } else { cell += c; }
    }
    if (cell !== '' || row.length) { row.push(cell); rows.push(row); }
    return rows;
  }

  /* ---- 見出しの行から「枠ID」「広告コード」の列を探す ---- */
  function buildMap(rows) {
    var h, idCol = -1, codeCol = -1, r, c, map = {};
    for (h = 0; h < rows.length; h++) {
      for (c = 0; c < rows[h].length; c++) {
        if (rows[h][c].indexOf('枠ID') !== -1) { idCol = c; }
        if (rows[h][c].indexOf('広告コード') !== -1) { codeCol = c; }
      }
      if (idCol !== -1 && codeCol !== -1) { break; }
    }
    if (idCol === -1 || codeCol === -1) { return map; }
    for (r = h + 1; r < rows.length; r++) {
      var id = (rows[r][idCol] || '').trim();
      var code = (rows[r][codeCol] || '').trim();
      if (id && code) { map[id] = code; }
    }
    return map;
  }

  /* ---- script型の広告：枠の中の小窓で動かす ---- */
  function showScriptAd(slot, code) {
    var frame = document.createElement('iframe');
    frame.title = '広告';
    frame.setAttribute('scrolling', 'no');
    frame.style.cssText = 'display:block;border:0;width:300px;height:300px;margin:0 auto;background:transparent;';
    frame.srcdoc =
      '<!DOCTYPE html><html><head><meta charset="utf-8">' +
      '<meta name="viewport" content="width=device-width,initial-scale=1">' +
      '<base target="_blank">' +
      '<style>html,body{margin:0;padding:0;background:transparent;overflow:hidden}' +
      'body{display:flex;justify-content:center;align-items:flex-start}</style>' +
      '</head><body><div id="ad">' + code + '</div></body></html>';
    slot.innerHTML = '';
    slot.appendChild(frame);

    /* 中身の大きさに合わせて小窓の高さを調整し、はみ出す場合は縮小して全体を表示（切らない） */
    function fit() {
      try {
        var doc = frame.contentDocument;
        if (!doc || !doc.body) { return; }
        var box = doc.getElementById('ad') || doc.body;
        var w = Math.max(box.scrollWidth, box.offsetWidth);
        var hgt = Math.max(box.scrollHeight, box.offsetHeight);
        if (!w || !hgt) { return; }
        frame.style.width = w + 'px';      /* 広告の大きさのまま（縮小しない） */
        frame.style.height = hgt + 'px';
      } catch (e) { /* 何もしない */ }
    }
    frame.addEventListener('load', function () {
      fit();
      var n = 0, t = setInterval(function () { fit(); if (++n > 20) { clearInterval(t); } }, 500);
    });
  }

  /* ---- 画像リンク型の広告：そのまま表示 ---- */
  function showHtmlAd(slot, code) {
    slot.innerHTML = code;   /* 楽天のコードは一切書き換えずに表示します（属性の追加・変更は規約で禁止） */
  }

  fetch(url, { cache: 'no-store' })
    .then(function (res) { if (!res.ok) { throw new Error(res.status); } return res.text(); })
    .then(function (text) {
      var map = buildMap(parseCSV(text));
      for (var i = 0; i < slots.length; i++) {
        var slot = slots[i];
        var code = map[slot.getAttribute('data-ad-id')];
        if (!code) { continue; }               // シートが空欄の枠は、HTMLに直接貼った広告（あれば）を表示
        if (/<script[\s>]/i.test(code)) { showScriptAd(slot, code); }
        else { showHtmlAd(slot, code); }
      }
    })
    .catch(function () { /* 読み込めないときは、HTMLに直接貼った広告（あれば）のまま */ });
})();
