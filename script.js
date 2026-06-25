const root = document.documentElement;
const themeToggle = document.getElementById('themeToggle');
const menuToggle = document.getElementById('menuToggle');
const navLinks = document.getElementById('navLinks');

const storedTheme = localStorage.getItem('dompi-theme');
const preferredTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';

function applyTheme(theme) {
    const isDark = theme === 'dark';
    root.dataset.theme = theme;

    if (themeToggle) {
        themeToggle.setAttribute('aria-pressed', String(isDark));
        themeToggle.setAttribute('aria-label', isDark ? 'Activar modo claro' : 'Activar modo oscuro');
        const themeIcon = themeToggle.querySelector('.theme-icon');
        themeIcon.classList.toggle('fa-sun', isDark);
        themeIcon.classList.toggle('fa-moon', !isDark);
    }
}

applyTheme(storedTheme || preferredTheme);

themeToggle?.addEventListener('click', () => {
    const nextTheme = root.dataset.theme === 'dark' ? 'light' : 'dark';
    localStorage.setItem('dompi-theme', nextTheme);
    applyTheme(nextTheme);
});

menuToggle?.addEventListener('click', () => {
    const isOpen = navLinks.classList.toggle('active');
    menuToggle.classList.toggle('active', isOpen);
    menuToggle.setAttribute('aria-expanded', String(isOpen));
    menuToggle.setAttribute('aria-label', isOpen ? 'Cerrar menú' : 'Abrir menú');
});

navLinks?.addEventListener('click', (event) => {
    if (event.target.closest('a')) {
        navLinks.classList.remove('active');
        menuToggle.classList.remove('active');
        menuToggle.setAttribute('aria-expanded', 'false');
        menuToggle.setAttribute('aria-label', 'Abrir menú');
    }
});

const revealElements = document.querySelectorAll([
    '.hero-content > *',
    '.hero-image',
    '.section-title > *',
    '.card',
    '.calculator-container',
    '.calculator-controls',
    '.quote-card',
    '.video-container',
    '.process-flow',
    '.process-step',
    '.process-action',
    '.proof-media',
    '.proof-content > *',
    '.tracking-intro > *',
    '.tracking-panel',
    '.body-copy',
    '.contact-item',
    '.coverage-map-shell',
    '.zone-card',
    '.coverage-cta'
].join(','));

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

revealElements.forEach((element, index) => {
    element.classList.add('reveal');
    element.style.setProperty('--reveal-delay', `${(index % 4) * 70}ms`);

    if (element.matches('.hero-image, .video-container, .coverage-map-shell, .proof-media')) {
        element.classList.add('reveal--image');
    }
});

root.classList.add('motion-ready');

if (reduceMotion || !('IntersectionObserver' in window)) {
    revealElements.forEach(element => element.classList.add('is-visible'));
} else {
    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            entry.target.classList.toggle('is-visible', entry.isIntersecting);
        });
    }, {
        threshold: 0.12,
        rootMargin: '0px 0px -8% 0px'
    });

    revealElements.forEach(element => revealObserver.observe(element));
}

const coverageMapElement = document.getElementById('coverageMap');
const mapFallback = document.getElementById('mapFallback');

if (coverageMapElement) {
    if (window.L) {
        const zoneColors = {
            centro: '#6D28D9',
            oriente: '#0284C7',
            especial1: '#D97706',
            especial2: '#DB2777'
        };

        const coveragePoints = [
            { name: 'Centro', zone: 'centro', coordinates: [4.4419935, -75.2366416] },
            { name: 'Cádiz', zone: 'centro', coordinates: [4.4374289, -75.2184787] },
            { name: 'La Pola', zone: 'centro', coordinates: [4.4471598, -75.2449543] },
            { name: 'Jordán', zone: 'oriente', coordinates: [4.4412533, -75.1960645] },
            { name: 'Multicentro', zone: 'oriente', coordinates: [4.4363154, -75.2015730] },
            { name: 'Piedrapintada', zone: 'oriente', coordinates: [4.4413206, -75.2101570] },
            { name: 'El Salado', zone: 'especial1', coordinates: [4.4554500, -75.1228940] },
            { name: 'Picaleña', zone: 'especial1', coordinates: [4.4299555, -75.1929699] },
            { name: 'Mirolindo', zone: 'especial1', coordinates: [4.4280382, -75.2046434] },
            { name: 'Boquerón', zone: 'especial2', coordinates: [4.4076445, -75.2589495] },
            { name: 'Ricaurte', zone: 'especial2', coordinates: [4.4314989, -75.2439481] },
            { name: 'Sur de Ibagué', zone: 'especial2', coordinates: [4.4264563, -75.2386414] }
        ];

        const isTouchDevice = window.matchMedia('(pointer: coarse)').matches;
        const coverageMap = L.map(coverageMapElement, {
            scrollWheelZoom: false,
            dragging: !isTouchDevice,
            keyboard: true,
            zoomControl: true
        });

        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        }).addTo(coverageMap);

        const markersByZone = {};
        const allMarkers = [];

        coveragePoints.forEach((point) => {
            const marker = L.circleMarker(point.coordinates, {
                radius: 8,
                color: '#FFFFFF',
                weight: 2,
                fillColor: zoneColors[point.zone],
                fillOpacity: 0.95
            }).bindPopup(`<strong>${point.name}</strong><br>Sector con cobertura referencial`);

            marker.addTo(coverageMap);
            allMarkers.push(marker);
            markersByZone[point.zone] ??= [];
            markersByZone[point.zone].push(marker);
        });

        const getBounds = markers => L.latLngBounds(markers.map(marker => marker.getLatLng()));
        coverageMap.fitBounds(getBounds(allMarkers), { padding: [28, 28], maxZoom: 13 });

        document.querySelectorAll('.zone-card').forEach((button) => {
            button.addEventListener('click', () => {
                document.querySelectorAll('.zone-card').forEach(card => card.classList.remove('is-active'));
                button.classList.add('is-active');

                const zoneMarkers = markersByZone[button.dataset.zone];
                coverageMap.fitBounds(getBounds(zoneMarkers), { padding: [45, 45], maxZoom: 14 });
                zoneMarkers[0].openPopup();
            });
        });

        window.setTimeout(() => coverageMap.invalidateSize(), 150);
    } else {
        coverageMapElement.hidden = true;
        mapFallback.hidden = false;
    }
}

const trackingForm = document.getElementById('trackingForm');

if (trackingForm) {
    const trackingCodeInput = document.getElementById('trackingCode');
    const trackingError = document.getElementById('trackingError');
    const trackingResult = document.getElementById('trackingResult');
    const trackingResultCode = document.getElementById('trackingResultCode');
    const trackingStatusTitle = document.getElementById('trackingStatusTitle');
    const trackingStatusBadge = document.getElementById('trackingStatusBadge');
    const useDemoTracking = document.getElementById('useDemoTracking');
    const trackingSteps = document.querySelectorAll('[data-tracking-step]');

    const trackingRecords = {
        'DOMPI-1024': {
            status: 'En camino',
            currentStep: 2
        }
    };

    const showTrackingError = (message) => {
        trackingError.textContent = message;
        trackingError.hidden = false;
        trackingResult.hidden = true;
        trackingCodeInput.setAttribute('aria-invalid', 'true');
    };

    const renderTrackingResult = (code, record) => {
        trackingError.hidden = true;
        trackingCodeInput.setAttribute('aria-invalid', 'false');
        trackingResultCode.textContent = code;
        trackingStatusTitle.textContent = record.status;
        trackingStatusBadge.textContent = `Etapa ${record.currentStep + 1} de ${trackingSteps.length}`;

        trackingSteps.forEach((step, index) => {
            step.classList.toggle('is-complete', index < record.currentStep);
            step.classList.toggle('is-current', index === record.currentStep);
        });

        trackingResult.hidden = false;
    };

    trackingCodeInput.addEventListener('input', () => {
        trackingCodeInput.value = trackingCodeInput.value.toUpperCase().replace(/\s+/g, '');
        trackingCodeInput.removeAttribute('aria-invalid');
        trackingError.hidden = true;
    });

    trackingForm.addEventListener('submit', (event) => {
        event.preventDefault();
        const code = trackingCodeInput.value.trim().toUpperCase();

        if (!code) {
            showTrackingError('Ingresa un código de seguimiento.');
            trackingCodeInput.focus();
            return;
        }

        if (!/^DOMPI-\d{4,8}$/.test(code)) {
            showTrackingError('El código debe tener el formato DOMPI-1024.');
            trackingCodeInput.focus();
            return;
        }

        const record = trackingRecords[code];
        if (!record) {
            showTrackingError('No encontramos ese código. Verifica los datos o utiliza el código de demostración.');
            return;
        }

        renderTrackingResult(code, record);
    });

    useDemoTracking.addEventListener('click', () => {
        trackingCodeInput.value = 'DOMPI-1024';
        trackingForm.requestSubmit();
    });
}
