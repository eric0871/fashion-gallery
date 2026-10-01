/* 潮流单品画廊 — 数据驱动渲染 + 删除持久化 */
(function () {
  'use strict';

  var DELETED_KEY = 'trend-gallery-deleted-v1';

  function getDeleted() {
    try {
      var raw = localStorage.getItem(DELETED_KEY);
      var arr = raw ? JSON.parse(raw) : [];
      return new Set(Array.isArray(arr) ? arr : []);
    } catch (e) { return new Set(); }
  }

  function markDeleted(id) {
    try {
      var s = getDeleted();
      s.add(id);
      localStorage.setItem(DELETED_KEY, JSON.stringify(Array.from(s)));
    } catch (e) {}
  }

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function attachDelete(btn, id) {
    btn.addEventListener('click', function (ev) {
      ev.preventDefault();
      ev.stopPropagation();
      if (!window.confirm('确定从画廊移除这件单品吗？')) return;
      markDeleted(id);
      var card = btn.closest('.card') || btn.closest('.pdp');
      if (card) {
        card.classList.add('removing');
        setTimeout(function () {
          if (card.classList.contains('card')) card.remove();
          else window.location.href = 'index.html';
        }, 480);
      }
    });
  }

  function loadItems() {
    return fetch('data/items.json', { cache: 'no-store' })
      .then(function (r) {
        if (!r.ok) throw new Error('items.json HTTP ' + r.status);
        return r.json();
      })
      .then(function (d) { return d.items || []; });
  }

  /* ---- 首页网格 ---- */
  function renderGrid() {
    var grid = document.getElementById('grid');
    if (!grid) return;
    var deleted = getDeleted();
    loadItems().then(function (items) {
      items.filter(function (it) { return !deleted.has(it.id); }).forEach(function (it) {
        var a = document.createElement('a');
        a.className = 'card';
        a.href = 'item.html?id=' + encodeURIComponent(it.id);
        var imgs = it.images || [];
        var main = imgs[0] ? imgs[0].url : '';
        var alt = imgs[1] ? imgs[1].url : main;
        a.innerHTML =
          '<img class="main" src="' + esc(main) + '" alt="' + esc(it.name) + '" loading="lazy">' +
          '<img class="alt" src="' + esc(alt) + '" alt="" loading="lazy" aria-hidden="true">' +
          '<span class="meta"><span class="name">' + esc(it.name) + '</span>' +
          '<span class="row"><span class="price">' + esc(it.price) + '</span>' +
          '<span class="tag">' + esc(it.category) + '</span></span></span>' +
          '<button class="del" aria-label="移除">×</button>';
        attachDelete(a.querySelector('.del'), it.id);
        grid.appendChild(a);
      });
    }).catch(function (e) {
      grid.innerHTML = '<p style="color:#999;font-size:13px">加载失败，请稍后刷新。</p>';
    });
  }

  /* ---- PDP ---- */
  function renderItem() {
    var root = document.getElementById('pdp');
    if (!root) return;
    var id = new URLSearchParams(window.location.search).get('id');
    var deleted = getDeleted();
    loadItems().then(function (items) {
      var it = items.find(function (x) { return x.id === id; });
      if (!it || deleted.has(it.id)) {
        root.innerHTML = '<p style="color:#999;font-size:13px">这件单品已不在画廊中。</p>';
        return;
      }
      var imgs = it.images || [];
      var stage = imgs.length
        ? '<img id="stageImg" src="' + esc(imgs[0].url) + '" alt="' + esc(it.name) + '">'
        : '';
      var thumbs = imgs.map(function (im, i) {
        return '<img src="' + esc(im.url) + '" alt="" data-i="' + i + '"' +
          (i === 0 ? ' class="active"' : '') + '>';
      }).join('');
      root.innerHTML =
        '<a class="back" href="index.html" aria-label="返回">←</a>' +
        '<div class="stage">' + stage + '<div class="thumbs">' + thumbs + '</div></div>' +
        '<div class="info"><span class="tag">' + esc(it.category) + '</span>' +
        '<h1>' + esc(it.name) + '</h1>' +
        '<div class="price">' + esc(it.price) + '</div>' +
        (it.note ? '<div class="soldout">' + esc(it.note) + '</div>' : '') +
        (it.link ? '<a class="buy" href="' + esc(it.link) + '" target="_blank" rel="noopener">购买 →</a>' : '') +
        '</div>' +
        '<button class="del" aria-label="移除" style="position:fixed">×</button>';
      var stageImg = document.getElementById('stageImg');
      root.querySelectorAll('.thumbs img').forEach(function (th) {
        th.addEventListener('click', function () {
          root.querySelectorAll('.thumbs img').forEach(function (x) { x.classList.remove('active'); });
          th.classList.add('active');
          if (stageImg) stageImg.src = imgs[Number(th.dataset.i)].url;
        });
      });
      attachDelete(root.querySelector('.del'), it.id);
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    renderGrid();
    renderItem();
  });
})();
