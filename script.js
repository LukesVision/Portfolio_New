'use strict';

const $ = (selector, scope = document) => scope.querySelector(selector);
const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function setupLoadingScreen() {
    const screen = $('#loadingScreen');
    const fill = $('.progress-fill');
    const percent = $('#progressPercent');
    if (!screen || !fill || !percent) return;
    let value = 0;
    const finish = () => { screen.classList.add('is-complete'); document.body.classList.remove('is-loading'); };
    const step = () => {
        value = Math.min(value + (value < 80 ? 4 : 2), 100);
        fill.style.width = `${value}%`;
        percent.textContent = String(value).padStart(2, '0');
        if (value < 100) window.setTimeout(step, reduceMotion ? 10 : 35);
        else window.setTimeout(finish, reduceMotion ? 0 : 650);
    };
    window.setTimeout(finish, reduceMotion ? 900 : 2600);
    window.setTimeout(step, reduceMotion ? 0 : 160);
}

function setupGallery() {
    const grid = $('#masonryGrid');
    const lightbox = $('#lightbox');
    const image = $('#lightboxImage');
    const current = $('#lightboxCurrent');
    const total = $('#lightboxTotal');
    if (!grid || !lightbox || !image) return;
    const folder = grid.dataset.folder || 'photos';
    const label = grid.dataset.title || 'Gallery';
    let files = [];
    try { files = JSON.parse(grid.dataset.images || '[]'); } catch (error) { files = []; }
    const validImages = [...new Set(files)].filter((file) => !file.toLowerCase().endsWith('.heic')).map((file, index) => ({ file, index }));
    total.textContent = validImages.length;
    validImages.forEach(({ file, index }) => {
        const button = document.createElement('button');
        button.className = 'gallery-item reveal is-visible';
        button.type = 'button';
        button.dataset.index = index;
        button.setAttribute('aria-label', `View photo ${index + 1}`);
        const photo = document.createElement('img');
        photo.src = `${folder}/${file}`;
        photo.alt = `${label} photo ${index + 1}`;
        photo.loading = 'eager';
        photo.decoding = 'async';
        if (index < 8) photo.fetchPriority = 'high';
        button.append(photo);
        grid.append(button);
    });
    let activeIndex = 0;
    let lastTrigger = null;
    const show = (index) => {
        activeIndex = (index + validImages.length) % validImages.length;
        image.src = `${folder}/${validImages[activeIndex].file}`;
        image.alt = `${label} photo ${activeIndex + 1}`;
        current.textContent = activeIndex + 1;
    };
    const open = (index, trigger) => {
        lastTrigger = trigger;
        show(index);
        lightbox.classList.add('is-open');
        lightbox.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
        $('#lightboxClose')?.focus();
    };
    const close = () => {
        lightbox.classList.remove('is-open');
        lightbox.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
        lastTrigger?.focus();
    };
    grid.addEventListener('click', (event) => {
        const trigger = event.target.closest('.gallery-item');
        if (trigger) open(Number(trigger.dataset.index), trigger);
    });
    $('#lightboxClose')?.addEventListener('click', close);
    $('#lightboxPrev')?.addEventListener('click', () => show(activeIndex - 1));
    $('#lightboxNext')?.addEventListener('click', () => show(activeIndex + 1));
    lightbox.addEventListener('click', (event) => { if (event.target === lightbox) close(); });
    document.addEventListener('keydown', (event) => {
        if (!lightbox.classList.contains('is-open')) return;
        if (event.key === 'Escape') close();
        if (event.key === 'ArrowLeft') show(activeIndex - 1);
        if (event.key === 'ArrowRight') show(activeIndex + 1);
    });
}

function setupMenu() {
    const hamburger = $('#hamburger') || $('.hamburger');
    const links = $('#navLinks') || $('.nav-links');
    if (!hamburger || !links) return;
    hamburger.setAttribute('aria-expanded', 'false');
    hamburger.setAttribute('aria-label', 'Open navigation');
    hamburger.addEventListener('click', () => {
        const open = links.classList.toggle('is-open');
        hamburger.setAttribute('aria-expanded', String(open));
        hamburger.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
        document.body.style.overflow = open ? 'hidden' : '';
    });
    $$('.nav-link', links).forEach((link) => link.addEventListener('click', () => {
        links.classList.remove('is-open');
        hamburger.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
    }));
}

function setupReveals() {
    const elements = $$('.section-title, .intro-content, .work-card, .section-header, .showreel-card, .dev-card, .about-content, .skill-category');
    elements.forEach((element) => element.classList.add('reveal'));
    if (reduceMotion || !('IntersectionObserver' in window)) {
        elements.forEach((element) => element.classList.add('is-visible'));
        return;
    }
    const observer = new IntersectionObserver((entries, instance) => entries.forEach((entry) => {
        if (entry.isIntersecting) { entry.target.classList.add('is-visible'); instance.unobserve(entry.target); }
    }), { threshold: .12 });
    elements.forEach((element) => observer.observe(element));
}

function setupTimeAndParallax() {
    const time = $('#heroTime');
    const background = $('.hero-background');
    const foreground = $('.hero-text');
    const viewfinder = $('.hero-viewfinder');
    const metadata = $('.hero-meta');
    let ticking = false;
    const update = () => {
        if (time) time.textContent = new Date().toLocaleTimeString('en-GB', { hour12: false });
        if (!reduceMotion) {
            const scroll = window.scrollY;
            if (background) background.style.transform = `translate3d(0, ${scroll * .12}px, 0) scale(1.04)`;
            if (foreground) foreground.style.transform = `translate3d(0, ${scroll * -.045}px, 0)`;
            if (viewfinder) viewfinder.style.transform = `translate3d(0, ${scroll * -.08}px, 0) rotate(${scroll * .008}deg)`;
            if (metadata) metadata.style.transform = `translate3d(0, ${scroll * -.025}px, 0)`;
        }
        ticking = false;
    };
    update();
    window.setInterval(update, 1000);
    window.addEventListener('scroll', () => {
        if (!ticking) { window.requestAnimationFrame(update); ticking = true; }
    }, { passive: true });
}

function setupCursor() {
    if (reduceMotion || !window.matchMedia('(pointer: fine)').matches) return;
    let cursor = $('.custom-cursor');
    let dot = $('.custom-cursor-dot');
    if (!cursor) { cursor = document.createElement('div'); cursor.className = 'custom-cursor'; document.body.append(cursor); }
    if (!dot) { dot = document.createElement('div'); dot.className = 'custom-cursor-dot'; document.body.append(dot); }
    let x = -100; let y = -100; let targetX = x; let targetY = y;
    const render = () => { x += (targetX - x) * .18; y += (targetY - y) * .18; cursor.style.setProperty('--cursor-x', `${x}px`); cursor.style.setProperty('--cursor-y', `${y}px`); cursor.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%)`; dot.style.transform = `translate3d(${targetX}px, ${targetY}px, 0) translate(-50%, -50%)`; requestAnimationFrame(render); };
    window.addEventListener('mousemove', (event) => { targetX = event.clientX; targetY = event.clientY; document.body.classList.add('cursor-ready'); }, { passive: true });
    $$('a, button, .work-card, .gallery-item').forEach((element) => {
        element.addEventListener('mouseenter', () => document.body.classList.add('cursor-hover'));
        element.addEventListener('mouseleave', () => document.body.classList.remove('cursor-hover'));
    });
    render();
}

function setupPlayButton() {
    $('#playButton')?.addEventListener('click', (event) => {
        const button = event.currentTarget;
        button.classList.toggle('is-playing');
        const icon = $('.play-icon', button);
        if (icon) icon.textContent = button.classList.contains('is-playing') ? '||' : '▶';
    });
}

function setupPageTransitions() {
    const links = $$('a[href$=".html"]');
    if (!links.length) return;
    const transition = document.createElement('div');
    transition.className = 'page-transition';
    transition.innerHTML = '<div class="transition-frame"><span class="transition-label">LOADING NEXT FRAME</span></div>';
    document.body.append(transition);
    links.forEach((link) => link.addEventListener('click', (event) => {
        if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        const target = new URL(link.href, window.location.href);
        if (target.origin !== window.location.origin) return;
        event.preventDefault();
        transition.classList.add('is-active');
        window.setTimeout(() => { window.location.href = target.href; }, reduceMotion ? 0 : 360);
    }));
}

function setupPrivacyModal() {
    const privacyLink = $$('a').find((link) => link.textContent.trim().toLowerCase() === 'privacy policy');
    if (!privacyLink) return;
    const modal = document.createElement('div');
    modal.className = 'privacy-modal';
    modal.setAttribute('aria-hidden', 'true');
    modal.innerHTML = `<div class="privacy-dialog" role="dialog" aria-modal="true" aria-labelledby="privacyTitle"><button class="privacy-close" type="button" aria-label="Close privacy policy">✕</button><h2 id="privacyTitle">PRIVACY POLICY</h2><p>Informativa sintetica ai sensi del Regolamento (UE) 2016/679 (GDPR). Questo portfolio non utilizza cookie di profilazione né strumenti di analisi.</p><h3>Titolare del trattamento</h3><p>Luca Andreolla. Per richieste relative alla privacy è possibile scrivere a <a href="mailto:imlukas64@gmail.com">imlukas64@gmail.com</a>.</p><h3>Dati inviati volontariamente</h3><p>I dati inseriti nel form vengono inviati tramite Web3Forms e utilizzati esclusivamente per rispondere alla richiesta di contatto. Web3Forms può trattare i dati necessari alla consegna del messaggio secondo la propria informativa.</p><h3>Diritti dell'interessato</h3><p>Puoi chiedere accesso, rettifica, cancellazione o limitazione del trattamento scrivendo all'indirizzo email indicato sopra.</p><p>Ultimo aggiornamento: 27 agosto 2026.</p></div>`;
    document.body.append(modal);
    const closeButton = $('.privacy-close', modal);
    const open = (event) => { event.preventDefault(); modal.classList.add('is-open'); modal.setAttribute('aria-hidden', 'false'); document.body.style.overflow = 'hidden'; closeButton.focus(); };
    const close = () => { modal.classList.remove('is-open'); modal.setAttribute('aria-hidden', 'true'); document.body.style.overflow = ''; privacyLink.focus(); };
    privacyLink.addEventListener('click', open);
    closeButton.addEventListener('click', close);
    modal.addEventListener('click', (event) => { if (event.target === modal) close(); });
    document.addEventListener('keydown', (event) => { if (event.key === 'Escape' && modal.classList.contains('is-open')) close(); });
}

function setupYouTubeModal() {
    const modal = document.createElement('div');
    modal.className = 'privacy-modal'; // riutilizzi lo stesso stile
    modal.setAttribute('aria-hidden', 'true');

    modal.innerHTML = `
        <div class="privacy-dialog" role="dialog" aria-modal="true" aria-labelledby="ytTitle">
            <button class="privacy-close" type="button" aria-label="Close">✕</button>
            <h2 id="ytTitle">YOUTUBE</h2>
            <p>Il canale YouTube è attualmente in arrivo.</p>
            <p>Torna presto per nuovi contenuti video.</p>
        </div>
    `;

    document.body.append(modal);

    const closeBtn = modal.querySelector('.privacy-close');

    const open = (trigger) => {
        modal.classList.add('is-open');
        modal.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
        closeBtn.focus();
        modal._trigger = trigger;
    };

    const close = () => {
        modal.classList.remove('is-open');
        modal.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
        modal._trigger?.focus();
    };

    closeBtn.addEventListener('click', close);
    modal.addEventListener('click', (e) => {
        if (e.target === modal) close();
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.classList.contains('is-open')) {
            close();
        }
    });

    // funzione globale richiamata dal click
    window.openYouTubeModal = open;
}

function setupContactForm() {
    const forms = $$('.contact-form');
    forms.forEach((form) => {
        form.action = 'https://api.web3forms.com/submit';
        form.method = 'POST';
        const accessKey = document.createElement('input');
        accessKey.type = 'hidden';
        accessKey.name = 'access_key';
        accessKey.value = '96296a2b-8306-47b9-8362-8067f2c5b7c4';
        form.append(accessKey);
        const subject = document.createElement('input');
        subject.type = 'hidden';
        subject.name = 'subject';
        subject.value = 'New contact request - Luke\'s Vision';
        form.append(subject);
        const status = document.createElement('p');
        status.className = 'form-status';
        status.setAttribute('role', 'status');
        form.append(status);
        form.addEventListener('submit', async (event) => {
            event.preventDefault();
            const button = $('button[type="submit"]', form);
            const originalLabel = button.textContent;
            button.disabled = true;
            button.textContent = 'SENDING...';
            status.textContent = '';
            try {
                const response = await fetch(form.action, { method: 'POST', body: new FormData(form), headers: { Accept: 'application/json' } });
                if (!response.ok) throw new Error('Request failed');
                form.reset();
                status.textContent = 'Message sent. Thank you.';
                status.classList.add('is-success');
            } catch (error) {
                status.textContent = 'Unable to send. Please email imlukas64@gmail.com.';
                status.classList.add('is-error');
            } finally {
                button.disabled = false;
                button.textContent = originalLabel;
            }
        });
    });
}

function setupSocialLinks() {
    const socialLink = (name) => $$('a').filter((link) => link.getAttribute('aria-label') === name || link.textContent.trim().toLowerCase() === name.toLowerCase());
    socialLink('Instagram').forEach((link) => { link.href = 'https://www.instagram.com/luksvsn/'; link.target = '_blank'; link.rel = 'noreferrer'; });
    socialLink('YouTube').forEach((link) => { link.removeAttribute('href'); link.style.cursor = 'pointer'; link.addEventListener('click', (e) => {e.preventDefault(); openYouTubeModal(link); }); });
    socialLink('iStock').forEach((link) => { link.href = 'https://www.istockphoto.com/en/portfolio/LukesVision'; link.target = '_blank'; link.rel = 'noreferrer'; });
}

function setupBrandLogo() {
    const logoSource = 'Imgs/Logo.png';
    $$('a.logo-link').forEach((link) => {
        if (link.querySelector('img')) return;
        const originalText = link.textContent;
        const image = document.createElement('img');
        image.className = 'logo-mark';
        image.src = logoSource;
        image.alt = "Luke's Vision home";
        image.width = 42;
        image.height = 42;
        image.addEventListener('error', () => { image.remove(); link.textContent = originalText; }, { once: true });
        link.textContent = '';
        link.append(image);
    });
    if (!document.querySelector('link[rel="icon"]')) {
        const favicon = document.createElement('link');
        favicon.rel = 'icon';
        favicon.type = 'image/png';
        favicon.href = logoSource;
        favicon.addEventListener('error', () => favicon.remove(), { once: true });
        document.head.append(favicon);
    }
}

function setupPortfolioContent() {
    $$('.about-image-secondary').forEach((element) => element.remove());
    $$('article.work-card').forEach((card) => {
        const title = $('.work-title', card)?.textContent.trim();
        if (['LEGACY ARCHIVE', 'OMBRE DI FERRO', 'SCINTILLA PERDUTA'].includes(title)) { card.remove(); return; }
        if (title !== 'ZARAGOZA OPS') return;
        const image = $('.work-image', card);
        if (!image) return;
        const video = document.createElement('video');
        video.className = 'work-video';
        video.src = 'Vids/EnergyFitness.mp4';
        video.autoplay = true;
        video.muted = true;
        video.loop = true;
        video.playsInline = true;
        video.preload = 'metadata';
        image.replaceWith(video);
    });
    const copy = new Map([
        ['Visual stories shaped through photography, motion and cinematic experimentation.', 'Voglio creare immagini autentiche, che rispecchino il mio modo di vedere la realtà. È da questa idea che nasce il nome Luke\'s Vision.'],
        ['I combine photography, video production and digital post-production to create visual work with a strong cinematic identity.', 'Mi sono diplomato in grafica all\'Istituto Silvio D\'Arzo e continuo a lavorare tra immagini, video e programmazione. Mi interessa capire come nasce un progetto, dall\'idea iniziale fino agli ultimi dettagli del montaggio.'],
        ['Photography is the starting point: a way to observe light, movement, texture and human presence.', 'La fotografia è il mio punto di partenza: mi serve per fermarmi, guardare meglio la luce e capire cosa rende interessante una scena.'],
        ['Airsoft Team Captain', 'Airsoft Team Sergeant'],
        ["I'm a student at Istituto Silvio D'Arzo, focused on integrating visual aesthetics, audiovisual production, and ICT programming.", 'Mi sono diplomato in grafica all\'Istituto Silvio D\'Arzo. Oggi continuo a unire grafica, fotografia, video e programmazione nei progetti che seguo.']
    ]);
    $$('body *').forEach((element) => {
        if (element.children.length) return;
        const text = element.textContent.trim();
        if (copy.has(text)) element.textContent = copy.get(text);
    });
    $$('.hero-tagline').forEach((element) => { element.textContent = 'Voglio creare immagini autentiche, che rispecchino il mio modo di vedere la realtà. È da questa idea che nasce il nome Luke\'s Vision.'; });
    $$('.intro-text').forEach((element) => { element.textContent = 'Mi sono diplomato in grafica all\'Istituto Silvio D\'Arzo e continuo a lavorare tra immagini, video e programmazione. Mi interessa capire come nasce un progetto, dall\'idea iniziale fino agli ultimi dettagli del montaggio.'; });
    $$('.section-description').forEach((element) => { element.textContent = 'La fotografia è il mio punto di partenza: mi serve per fermarmi, guardare meglio la luce e capire cosa rende interessante una scena.'; });
    $$('.about-text > p').forEach((element) => { element.textContent = 'Mi sono diplomato in grafica all\'Istituto Silvio D\'Arzo e oggi mi presento come visual creator freelance. Fotografia e video sono i linguaggi con cui lavoro di più: mi aiutano a osservare la realtà e a restituirla in un modo che sento mio. Voglio creare immagini autentiche, senza costruire un\'estetica distante da quello che vedo davvero. È da questa ricerca personale che nasce il nome Luke\'s Vision. Cola Ad e Monster Commercial sono nati a scuola, mentre Zaragoza Ops è stato il mio primo progetto durante un Erasmus. Sono esperienze diverse, ma mi hanno dato tutte la stessa voglia di continuare: imparare, sperimentare e seguire un\'idea fino alla sua forma finale. Anche l\'airsoft mi ha insegnato molto sul lavoro di squadra e sulla responsabilità: oggi sono sergente del team.'; });
    $$('.about-text > h2, .about-text > h3').forEach((element) => { element.textContent = 'MY STORY'; });
}

function setupProjectLinks() {
    const projects = { 'ZARAGOZA OPS': 'zaragoza.html', 'MONSTER COMMERCIAL': 'monster.html', 'COLA AD': 'cola.html' };
    $$('article.work-card').forEach((card) => {
        const title = $('.work-title', card)?.textContent.trim();
        if (!projects[title]) return;
        card.setAttribute('role', 'link');
        card.setAttribute('tabindex', '0');
        card.setAttribute('aria-label', `Open ${title} project`);
        const openProject = () => { window.location.href = projects[title]; };
        card.addEventListener('click', openProject);
        card.addEventListener('keydown', (event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); openProject(); } });
    });
}

function setupVideoShowcase() {
    const showcase = $('.showreel-card');
    if (!showcase) return;
    const wrapper = document.createElement('div');
    wrapper.className = 'video-showcase';
    wrapper.innerHTML = `<a class="video-card" href="zaragoza.html"><video src="Vids/EnergyFitness.mp4" autoplay muted loop playsinline preload="auto"></video><span class="video-card-overlay"></span><span class="video-card-copy"><strong>ZARAGOZA OPS</strong><small>ENERGIE FITNESS / ERASMUS PROJECT</small></span></a><a class="video-card" href="cola.html"><video src="Vids/Cola_Ad.mp4" muted loop playsinline preload="auto"></video><span class="video-card-overlay"></span><span class="video-card-copy"><strong>COLA AD</strong><small>SCHOOL PROJECT / DIRECTING & EDITING</small></span></a>`;
    showcase.replaceWith(wrapper);
}

if ($('#loadingScreen')) {
    document.body.classList.add('is-loading');
    setupLoadingScreen();
} else {
    document.body.classList.remove('is-loading');
}
setupGallery();
setupMenu();
setupReveals();
setupTimeAndParallax();
setupCursor();
setupPlayButton();
setupPageTransitions();
setupPrivacyModal();
setupYouTubeModal();
setupContactForm();
setupSocialLinks();
setupPortfolioContent();
setupProjectLinks();
setupVideoShowcase();
setupBrandLogo();
