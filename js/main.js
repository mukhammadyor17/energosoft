// Лендинг EnergoSoft. Без зависимостей: страница статичная, и тянуть фреймворк
// ради вкладок и меню — лишний вес на мобильном интернете.

document.documentElement.classList.add('js');

// ---------- Шапка: тень после прокрутки ----------

const header = document.querySelector('.header');
const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 8);
onScroll();
window.addEventListener('scroll', onScroll, { passive: true });

// ---------- Мобильное меню ----------

const burger = document.querySelector('.burger');
const nav = document.getElementById('nav');

const setMenu = (open) => {
  burger.setAttribute('aria-expanded', String(open));
  burger.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
  nav.classList.toggle('is-open', open);
};

burger.addEventListener('click', () => setMenu(burger.getAttribute('aria-expanded') !== 'true'));
// Переход по якорю закрывает меню, иначе оно висит поверх раздела, куда человек пришёл
nav.addEventListener('click', (e) => { if (e.target.closest('a')) setMenu(false); });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setMenu(false); });
window.matchMedia('(min-width: 901px)').addEventListener('change', (e) => { if (e.matches) setMenu(false); });

// ---------- Вкладки модулей ----------

const tabs = [...document.querySelectorAll('[role="tab"]')];

const selectTab = (tab, focus = false) => {
  tabs.forEach((t) => {
    const selected = t === tab;
    t.setAttribute('aria-selected', String(selected));
    t.tabIndex = selected ? 0 : -1;
    document.getElementById(t.getAttribute('aria-controls')).hidden = !selected;
  });
  if (focus) tab.focus();
  // На узком экране вкладки прокручиваются вбок — выбранная не должна оставаться за краем
  tab.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' });
};

tabs.forEach((tab, i) => {
  tab.addEventListener('click', () => selectTab(tab));
  tab.addEventListener('keydown', (e) => {
    const step = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
    if (step) {
      e.preventDefault();
      selectTab(tabs[(i + step + tabs.length) % tabs.length], true);
    }
    if (e.key === 'Home') { e.preventDefault(); selectTab(tabs[0], true); }
    if (e.key === 'End') { e.preventDefault(); selectTab(tabs[tabs.length - 1], true); }
  });
});

// ---------- Тарифы: месяц / год ----------
// Тексты обоих периодов лежат в data-атрибутах разметки: цены правятся в одном месте, в HTML

const periodButtons = document.querySelectorAll('.period__btn');

const setPeriod = (period) => {
  periodButtons.forEach((btn) => btn.setAttribute('aria-pressed', String(btn.dataset.period === period)));
  document.querySelectorAll('.plan__price').forEach((el) => {
    el.querySelector('.plan__amount').textContent = el.dataset[period];
    const per = el.querySelector('.plan__per');
    per.textContent = per.dataset[period];
  });
  document.querySelectorAll('.plan__note').forEach((el) => { el.textContent = el.dataset[period]; });
};

periodButtons.forEach((btn) => btn.addEventListener('click', () => setPeriod(btn.dataset.period)));

// ---------- Появление блоков при прокрутке ----------

const revealItems = document.querySelectorAll('.reveal');

if ('IntersectionObserver' in window) {
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      io.unobserve(entry.target);
    });
  }, { rootMargin: '0px 0px -8% 0px' });
  revealItems.forEach((el) => io.observe(el));
} else {
  revealItems.forEach((el) => el.classList.add('is-visible'));
}

// ---------- Клиенты: бесконечная лента ----------
// Лента едет на ширину одного набора логотипов и прыгает в начало — шов не виден, потому что
// за первым набором стоит его точная копия. Копий нужно столько, чтобы во время сдвига экран
// всегда был заполнен: на широком мониторе шести логотипов на это не хватает.

const marquee = document.querySelector('.marquee');
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

if (marquee) {
  const track = marquee.querySelector('.marquee__track');
  const originals = [...track.children];
  const SPEED = 40; // px в секунду: медленно, чтобы логотип успевали прочитать

  const build = () => {
    track.querySelectorAll('[data-clone]').forEach((el) => el.remove());
    if (reduceMotion.matches) {
      marquee.classList.remove('is-running');
      return;
    }
    marquee.classList.add('is-running');

    const gap = parseFloat(getComputedStyle(track).columnGap) || 0;
    // Шаг цикла — набор целиком вместе с промежутком после последнего логотипа
    const setWidth = originals.reduce((sum, el) => sum + el.offsetWidth + gap, 0);

    let total = setWidth;
    while (total < setWidth + marquee.clientWidth) {
      originals.forEach((el) => {
        const clone = el.cloneNode(true);
        clone.dataset.clone = '';
        clone.setAttribute('aria-hidden', 'true');
        clone.querySelector('img').alt = '';
        track.append(clone);
      });
      total += setWidth;
    }

    track.style.setProperty('--marquee-shift', `${setWidth}px`);
    track.style.setProperty('--marquee-duration', `${setWidth / SPEED}s`);
  };

  build();
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(build, 200);
  });
  reduceMotion.addEventListener('change', build);
}

// ---------- Плавающая кнопка WhatsApp ----------
// Прячем, пока на экране финальный призыв: там уже две большие кнопки, третья только мешает

const fab = document.querySelector('.fab');
const cta = document.querySelector('.cta');

if (fab && cta && 'IntersectionObserver' in window) {
  new IntersectionObserver(([entry]) => {
    fab.classList.toggle('is-hidden', entry.isIntersecting);
  }).observe(cta);
}

// ---------- Увеличение скриншотов ----------
// На телефоне интерфейс в скриншоте мелкий — по тапу показываем его в полную ширину

const lightbox = document.getElementById('lightbox');

if (lightbox && typeof lightbox.showModal === 'function') {
  const lightboxImg = lightbox.querySelector('img');

  document.querySelectorAll('.shot img').forEach((img) => {
    img.tabIndex = 0;
    img.setAttribute('role', 'button');
    const open = () => {
      lightboxImg.src = img.currentSrc || img.src;
      lightboxImg.alt = img.alt;
      lightbox.showModal();
    };
    img.addEventListener('click', open);
    img.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); }
    });
  });

  lightbox.querySelector('.lightbox__close').addEventListener('click', () => lightbox.close());
  // Клик по затемнению вокруг картинки закрывает окно
  lightbox.addEventListener('click', (e) => { if (e.target === lightbox) lightbox.close(); });
} else {
  document.querySelectorAll('.shot img').forEach((img) => { img.style.cursor = 'default'; });
}
