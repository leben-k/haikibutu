/* 不法投棄罰  共通スクリプト */
(function () {
  'use strict';

  /* ---- フッターの著作権表示（年を自動で更新） ----
     2026年は「© 2026」、2027年からは「© 2026-2027」のように自動で変わります。 */
  var START_YEAR = 2026;
  var now = new Date().getFullYear();
  var yearText = now > START_YEAR ? START_YEAR + '-' + now : String(START_YEAR);
  var els = document.querySelectorAll('.js-year');
  for (var i = 0; i < els.length; i++) { els[i].textContent = yearText; }

  /* ---- 「目次へ戻る」ボタンの表示切り替え ---- */
  var toTop = document.querySelector('.to-toc');
  if (toTop) {
    var onScroll = function () {
      if (window.scrollY > 600) { toTop.classList.add('show'); }
      else { toTop.classList.remove('show'); }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ---- 連絡先フォーム（Formspree） ----
     JavaScriptが使えない環境では、通常の送信（Formspreeの完了画面）になります。 */
  var form = document.getElementById('contact-form');
  if (form && window.fetch && window.FormData) {
    var status = document.getElementById('form-status');
    var button = form.querySelector('button[type="submit"]');
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!form.checkValidity()) { form.reportValidity(); return; }
      button.disabled = true;
      status.className = 'form-status';
      status.textContent = '送信しています…';
      fetch(form.action, {
        method: 'POST',
        body: new FormData(form),
        headers: { 'Accept': 'application/json' }
      }).then(function (res) {
        if (res.ok) {
          form.reset();
          status.className = 'form-status ok';
          status.textContent = 'ご連絡ありがとうございました。送信が完了しました。';
        } else {
          throw new Error('send failed');
        }
      }).catch(function () {
        status.className = 'form-status ng';
        status.textContent = '送信できませんでした。時間をおいて、もう一度お試しください。';
      }).then(function () {
        button.disabled = false;
      });
    });
  }
})();
