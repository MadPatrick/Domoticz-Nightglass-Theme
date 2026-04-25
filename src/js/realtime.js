(function () {
    'use strict';

    /* Reuse the locale-aware timestamp formatter exposed by card-features.js */
    function fmtLastUpdate(raw) {
        if (window._dzFmtLastUpdate) return window._dzFmtLastUpdate(raw) || String(raw || '');
        /* Fallback (card-features not loaded yet): plain 24h format */
        var m = String(raw || '').match(/(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2})/);
        if (!m) return String(raw || '');
        return ('0' + m[4]).slice(-2) + ':' + ('0' + m[5]).slice(-2);
    }

    function findCard(idx) {
        var tbl = document.getElementById('itemtable' + idx);
        if (!tbl) return null;
        var el = tbl.parentElement;
        while (el && el !== document.body) {
            if (el.classList.contains('itemBlock')) return el;
            if (el.classList.contains('item') && el.parentElement &&
                el.parentElement.classList.contains('itemBlock')) return el;
            el = el.parentElement;
        }
        return null;
    }

    function onDeviceUpdate(device) {
        var idx = String(device.idx || device.ID || '');
        if (!idx) return;

        var card = findCard(idx);
        if (!card) return;

        // Instantly update the card-footer timestamp (.dz-time is injected by
        // us, so Angular's data-binding will not overwrite it).
        var luSpan = card.querySelector('.dz-card-footer .dz-time');
        if (luSpan) {
            var formatted = fmtLastUpdate(device.LastUpdate);
            if (luSpan.textContent !== formatted) luSpan.textContent = formatted;
            var tsMatch = String(device.LastUpdate || '').match(/(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2})/);
            if (tsMatch) luSpan.setAttribute('data-ts', tsMatch[1]);
        }

        // Schedule an icon-replacement burst so on/off state changes rendered
        // by Angular in the same digest cycle are caught immediately.
        if (window._dzScheduleBurst) window._dzScheduleBurst();
    }

    function attachHooks() {
        if (!window.angular) { setTimeout(attachHooks, 600); return; }
        var bodyEl = angular.element(document.body);
        if (!bodyEl || !bodyEl.injector || !bodyEl.injector()) { setTimeout(attachHooks, 400); return; }
        try {
            var $rootScope = bodyEl.injector().get('$rootScope');
            $rootScope.$on('device_update', function (evt, device) { onDeviceUpdate(device); });
        } catch (e) {
            setTimeout(attachHooks, 600);
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', attachHooks);
    } else {
        attachHooks();
    }
})();
