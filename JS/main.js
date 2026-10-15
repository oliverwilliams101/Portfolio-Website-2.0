'use strict';

// The page remains readable and all projects remain expandable without JavaScript.
const root = document.documentElement;
const themeButton = document.querySelector('#changeThemeBut');
const themeIcon = themeButton.querySelector('use');
const favicon = document.querySelector('#myicon');
const themeColor = document.querySelector('meta[name="theme-color"]');

function syncTheme() {
  const light = root.dataset.theme === 'light';
  themeButton.setAttribute('aria-label', `Switch to ${light ? 'dark' : 'light'} theme`);
  themeIcon.setAttribute('href', light ? '#moon' : '#sun');
  favicon.href = light ? '../icons/light_favicon.ico' : '../icons/dark_favicon.ico';
  themeColor.content = light ? '#f6f5ee' : '#141814';
}

syncTheme();
themeButton.hidden = false;
themeButton.addEventListener('click', () => {
  root.dataset.theme = root.dataset.theme === 'light' ? 'dark' : 'light';
  syncTheme();

  try {
    localStorage.setItem('ow-theme', root.dataset.theme);
  } catch {
    // Theme still works when storage is unavailable.
  }
});

const menuButton = document.querySelector('.menu-toggle');
const menu = document.querySelector('#navigation-links');
const navigation = document.querySelector('.navigation');
navigation.classList.add('js-menu');
menuButton.hidden = false;

function closeMenu() {
  menu.classList.remove('is-open');
  menuButton.setAttribute('aria-expanded', 'false');
  menuButton.setAttribute('aria-label', 'Open navigation');
}

menuButton.addEventListener('click', () => {
  const open = menuButton.getAttribute('aria-expanded') !== 'true';
  menu.classList.toggle('is-open', open);
  menuButton.setAttribute('aria-expanded', String(open));
  menuButton.setAttribute('aria-label', `${open ? 'Close' : 'Open'} navigation`);
});

menu.querySelectorAll('a').forEach((link) => {
  link.addEventListener('click', closeMenu);
});

document.addEventListener('click', (event) => {
  if (!navigation.contains(event.target)) {
    closeMenu();
  }
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && menuButton.getAttribute('aria-expanded') === 'true') {
    closeMenu();
    menuButton.focus();
  }
});

const mobileBreakpoint = window.matchMedia('(max-width: 600px)');
mobileBreakpoint.addEventListener('change', closeMenu);

const filters = document.querySelector('.filters');
const cards = [...document.querySelectorAll('.project-card')];
const count = document.querySelector('.project-count');
filters.hidden = false;

function filterProjects(category) {
  let visible = 0;

  cards.forEach((card) => {
    card.hidden = category !== 'all' && card.dataset.category !== category;

    if (!card.hidden) {
      visible += 1;
    }
  });

  filters.querySelectorAll('button').forEach((button) => {
    const active = button.dataset.filter === category;
    button.classList.toggle('active', active);
    button.setAttribute('aria-pressed', String(active));
  });

  count.textContent = category === 'all'
    ? `${visible} projects`
    : `${visible} ${visible === 1 ? 'project' : 'projects'} in this collection`;
}

filters.addEventListener('click', (event) => {
  const button = event.target.closest('button[data-filter]');

  if (button) {
    filterProjects(button.dataset.filter);
  }
});

// Preserve the native details interaction as a fallback on older browsers.
const dialog = document.querySelector('#project-dialog');
const dialogContent = document.querySelector('#dialog-content');

if (typeof dialog.showModal === 'function') {
  cards.forEach((card) => {
    const summary = card.querySelector('summary');
    summary.setAttribute('aria-haspopup', 'dialog');
    summary.setAttribute('aria-controls', 'project-dialog');
    summary.addEventListener('click', (event) => {
      event.preventDefault();

      const title = document.createElement('h2');
      title.id = 'dialog-title';
      title.textContent = card.querySelector('h3').textContent;

      const visual = card.querySelector('.project-visual').cloneNode(true);
      const screenshot = visual.querySelector('img');

      if (screenshot) {
        screenshot.loading = 'eager';
      }

      const description = card.querySelector('.project-detail-content').cloneNode(true);
      dialogContent.replaceChildren(title, visual, description);
      dialog.showModal();
      dialog.scrollTop = 0;
    });
  });

  document.querySelector('.dialog-close').addEventListener('click', () => {
    dialog.close();
  });

  // Close only on a complete backdrop click, avoiding accidental closure on a drag.
  let startedOnBackdrop = false;

  const outsideDialog = (event) => {
    const rect = dialog.getBoundingClientRect();

    return event.clientX < rect.left
      || event.clientX > rect.right
      || event.clientY < rect.top
      || event.clientY > rect.bottom;
  };

  dialog.addEventListener('pointerdown', (event) => {
    startedOnBackdrop = outsideDialog(event);
  });

  dialog.addEventListener('click', (event) => {
    if (startedOnBackdrop && outsideDialog(event)) {
      dialog.close();
    }

    startedOnBackdrop = false;
  });
}

// Hero links reveal their project even when another category is selected.
function revealLinkedProject() {
  const target = document.getElementById(window.location.hash.slice(1));

  if (target?.classList.contains('project-card') && target.hidden) {
    filterProjects('all');
    target.scrollIntoView({ block: 'start' });
  }
}

window.addEventListener('hashchange', revealLinkedProject);
revealLinkedProject();

if ('IntersectionObserver' in window) {
  const links = [...document.querySelectorAll('.navlink')];
  const sections = ['portfolio', 'aboutme', 'contact']
    .map((id) => document.getElementById(id));
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        links.forEach((link) => {
          if (link.hash === `#${entry.target.id}`) {
            link.setAttribute('aria-current', 'location');
          } else {
            link.removeAttribute('aria-current');
          }
        });
      }
    });
  }, { rootMargin: '-15% 0px -55% 0px', threshold: 0 });

  sections.forEach((section) => observer.observe(section));
}
