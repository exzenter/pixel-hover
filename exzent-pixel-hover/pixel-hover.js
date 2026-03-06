/**
 * EXZENT Pixel Hover – Frontend Engine
 * Liest alle .exzent-pixel-hover-config Elemente aus und initialisiert den Effekt.
 * Kein jQuery, kein Framework – vanilla JS, läuft im Footer.
 */
(function () {
    'use strict';

    /* ─── Initialisierung nach DOM-Ready ─────────────────────────────────── */
    function ready(fn) {
        if (document.readyState !== 'loading') { fn(); }
        else { document.addEventListener('DOMContentLoaded', fn); }
    }

    ready(function () {
        var configs = document.querySelectorAll('.exzent-pixel-hover-config[data-config]');
        configs.forEach(function (el) {
            try {
                var cfg = JSON.parse(el.getAttribute('data-config'));
                applyEffect(cfg);
            } catch (e) {
                console.warn('[EXZENT Pixel Hover] Ungültige Config:', e);
            }
        });
    });


    /* ─── Link-Selektion ─────────────────────────────────────────────────── */
    function getLinks(cfg) {
        if (cfg.targetMode === 'class' && cfg.targetClass) {
            return document.querySelectorAll('a.' + cfg.targetClass);
        }
        if (cfg.targetMode === 'selector' && cfg.targetSelector) {
            var parents = document.querySelectorAll(cfg.targetSelector);
            var links   = [];
            parents.forEach(function (p) {
                p.querySelectorAll('a').forEach(function (a) { links.push(a); });
            });
            return links;
        }
        return [];
    }


    /* ─── Effekt anwenden ────────────────────────────────────────────────── */
    function applyEffect(cfg) {
        var links = getLinks(cfg);
        if (!links.length) {
            console.warn('[EXZENT Pixel Hover] Keine Links gefunden für:', cfg.targetSelector || cfg.targetClass);
            return;
        }
        links.forEach(function (link) { initPixelHover(link, cfg); });
    }


    /* ─── Pixel Hover pro Link ───────────────────────────────────────────── */
    function initPixelHover(link, cfg) {

        /* Link braucht position:relative für den Canvas */
        var pos = window.getComputedStyle(link).position;
        if (pos === 'static') { link.style.position = 'relative'; }
        link.style.overflow = 'hidden';

        var canvas = document.createElement('canvas');
        canvas.className = 'exzent-pixel-layer';
        canvas.style.cssText = 'position:absolute;inset:0;pointer-events:none;display:block;z-index:0;';
        link.insertBefore(canvas, link.firstChild);

        var ctx   = canvas.getContext('2d');
        var span  = link.querySelector('span') || link; // Textträger für Color-Fade
        var useSpan = link.querySelector('span') !== null;

        var cells = [], cols = 0, rows = 0, raf = null;
        var cellW = 0, cellH = 0;
        var gridRef = [];

        /* ── Grid bauen ─────────────────────────────────────────────────── */
        function build() {
            var rect  = link.getBoundingClientRect();
            canvas.width  = rect.width;
            canvas.height = rect.height;
            rows  = cfg.rows;
            cellH = canvas.height / rows;
            cellW = cellH;
            cols  = Math.ceil(canvas.width / cellW);

            cells   = [];
            gridRef = [];

            for (var r = 0; r < rows; r++) {
                gridRef[r] = [];
                for (var c = 0; c < cols; c++) {
                    var cell = { x: c * cellW, y: r * cellH, col: c, row: r, visible: false, hideAt: 0 };
                    gridRef[r][c] = cell;
                    cells.push(cell);
                }
            }
        }

        /* ── Render Loop ────────────────────────────────────────────────── */
        function render(now) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = cfg.pixelColor;
            var anyVisible = false;
            for (var i = 0; i < cells.length; i++) {
                var cell = cells[i];
                if (!cell.visible) { continue; }
                if (now >= cell.hideAt) { cell.visible = false; continue; }
                ctx.fillRect(cell.x, cell.y, cellW, cellH);
                anyVisible = true;
            }
            if (anyVisible) { raf = requestAnimationFrame(render); }
        }

        /* ── Mouse Enter ────────────────────────────────────────────────── */
        link.addEventListener('mouseenter', function () {
            cancelAnimationFrame(raf);
            build();

            ctx.fillStyle = cfg.pixelColor;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            for (var i = 0; i < cells.length; i++) {
                cells[i].visible = true;
                cells[i].hideAt  = Infinity;
            }

            /* Text sofort weiß – kein Fade beim Enter */
            if (useSpan) {
                span.style.transition = 'color 0s';
                span.style.color      = '#fff';
            } else {
                link.style.transition = 'color 0s';
                link.style.color      = '#fff';
            }
        });

        /* ── Mouse Leave ────────────────────────────────────────────────── */
        link.addEventListener('mouseleave', function (e) {

            /* Auto-Winkel aus Austrittsposition */
            var angle = cfg.biasAngle;
            if (cfg.autoAngle) {
                var rect = link.getBoundingClientRect();
                var cx   = rect.left + rect.width  / 2;
                var cy   = rect.top  + rect.height / 2;
                var dx   = e.clientX - cx;
                var dy   = e.clientY - cy;
                var raw  = Math.atan2(-dy, dx) * (180 / Math.PI);
                angle    = ((raw % 360) + 360) % 360;
            }

            var now = performance.now();
            var dur = cfg.exitDuration;
            var rad = (angle * Math.PI) / 180;
            var vx  =  Math.cos(rad);
            var vy  = -Math.sin(rad);

            /* Projektion aller Zellen auf Richtungsvektor */
            var minP = Infinity, maxP = -Infinity;
            for (var i = 0; i < cells.length; i++) {
                var nx = (cells[i].col + 0.5) / cols;
                var ny = (cells[i].row + 0.5) / rows;
                var p  = nx * vx + ny * vy;
                cells[i]._proj = p;
                if (p < minP) { minP = p; }
                if (p > maxP) { maxP = p; }
            }
            var range = maxP - minP || 1;

            for (var j = 0; j < cells.length; j++) {
                var norm     = (cells[j]._proj - minP) / range;
                var dirDelay = norm                    * dur * cfg.staggerBase;
                var rndDelay = Math.random()           * dur * cfg.randomWeight;
                cells[j].hideAt = now + dirDelay + rndDelay;
            }

            /* 2×2 Cluster */
            if (cfg.doublePct > 0) {
                for (var k = 0; k < cells.length; k++) { cells[k]._clustered = false; }

                var positions = [];
                for (var pr = 0; pr <= rows - 2; pr++) {
                    for (var pc = 0; pc <= cols - 2; pc++) { positions.push([pr, pc]); }
                }
                /* Fisher-Yates shuffle */
                for (var s = positions.length - 1; s > 0; s--) {
                    var t = Math.floor(Math.random() * (s + 1));
                    var tmp = positions[s]; positions[s] = positions[t]; positions[t] = tmp;
                }

                for (var q = 0; q < positions.length; q++) {
                    if (Math.random() > cfg.doublePct) { continue; }
                    var pr2 = positions[q][0], pc2 = positions[q][1];
                    var c00 = gridRef[pr2]    && gridRef[pr2][pc2];
                    var c01 = gridRef[pr2]    && gridRef[pr2][pc2 + 1];
                    var c10 = gridRef[pr2 + 1] && gridRef[pr2 + 1][pc2];
                    var c11 = gridRef[pr2 + 1] && gridRef[pr2 + 1][pc2 + 1];
                    if (!c00 || !c01 || !c10 || !c11) { continue; }
                    if (c00._clustered || c01._clustered || c10._clustered || c11._clustered) { continue; }
                    var avg = (c00.hideAt + c01.hideAt + c10.hideAt + c11.hideAt) / 4;
                    c00.hideAt = c01.hideAt = c10.hideAt = c11.hideAt = avg;
                    c00._clustered = c01._clustered = c10._clustered = c11._clustered = true;
                }
            }

            /* Textfarbe sanft zurückfaden */
            var fadeDur = Math.round(dur * cfg.colorFade);
            if (useSpan) {
                span.style.transition = 'color ' + fadeDur + 'ms ease';
                span.style.color      = '';
            } else {
                link.style.transition = 'color ' + fadeDur + 'ms ease';
                link.style.color      = '';
            }

            cancelAnimationFrame(raf);
            raf = requestAnimationFrame(render);
        });
    }

})();
