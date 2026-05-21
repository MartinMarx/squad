import {
  CODE_BLOCK_LANGUAGES,
  codeBlockLanguageLabel,
  filterCodeBlockLanguages,
  type CodeBlockLanguage,
} from './code-block-languages';

export type CodeBlockLanguagePicker = {
  toolbar: HTMLDivElement;
  setLanguage: (language: string) => void;
  destroy: () => void;
};

export function createCodeBlockLanguagePicker({
  language,
  onChange,
}: {
  language: string;
  onChange: (language: string) => void;
}): CodeBlockLanguagePicker {
  const toolbar = document.createElement('div');
  toolbar.className = 'notebook-code-block-toolbar';
  toolbar.contentEditable = 'false';

  const trigger = document.createElement('button');
  trigger.type = 'button';
  trigger.className = 'notebook-code-block-language-trigger';
  trigger.setAttribute('aria-haspopup', 'listbox');
  trigger.setAttribute('aria-expanded', 'false');

  const label = document.createElement('span');
  label.className = 'notebook-code-block-language-label';
  label.textContent = codeBlockLanguageLabel(language);

  const chevron = document.createElement('span');
  chevron.className = 'notebook-code-block-language-chevron';
  chevron.setAttribute('aria-hidden', 'true');
  chevron.textContent = '▾';

  trigger.append(label, chevron);
  toolbar.append(trigger);

  const menuHost = document.createElement('div');
  menuHost.className = 'notebook-code-language-menu-host';
  menuHost.hidden = true;

  const menu = document.createElement('div');
  menu.className = 'notebook-code-language-menu';

  const search = document.createElement('input');
  search.type = 'search';
  search.className = 'notebook-code-language-search';
  search.placeholder = 'Search language…';
  search.setAttribute('aria-label', 'Search code block language');

  const list = document.createElement('div');
  list.className = 'notebook-code-language-list';
  list.setAttribute('role', 'listbox');

  const emptyState = document.createElement('div');
  emptyState.className = 'notebook-code-language-empty';
  emptyState.textContent = 'No languages found';
  emptyState.hidden = true;

  menu.append(search, list, emptyState);
  menuHost.append(menu);
  document.body.appendChild(menuHost);

  let selectedIndex = 0;
  const optionButtons: HTMLButtonElement[] = [];

  for (const option of CODE_BLOCK_LANGUAGES) {
    const item = document.createElement('button');
    item.type = 'button';
    item.className = 'notebook-code-language-option';
    item.dataset.language = option.id;
    item.textContent = option.label;
    item.setAttribute('role', 'option');
    item.hidden = false;
    item.addEventListener('mousedown', (event) => {
      event.preventDefault();
      event.stopPropagation();
    });
    item.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      selectLanguage(option.id);
    });
    optionButtons.push(item);
    list.append(item);
  }

  function renderOptions(options: CodeBlockLanguage[]) {
    selectedIndex = 0;
    const visibleIds = new Set(options.map((option) => option.id));

    for (const button of optionButtons) {
      const isVisible = visibleIds.has(button.dataset.language ?? '');
      button.hidden = !isVisible;
      button.classList.toggle('notebook-code-language-option-active', false);
    }

    emptyState.hidden = options.length > 0;
    highlightSelected();
  }

  function highlightSelected() {
    let visibleCount = 0;
    for (const button of optionButtons) {
      if (button.hidden) continue;
      button.classList.toggle(
        'notebook-code-language-option-active',
        visibleCount === selectedIndex
      );
      visibleCount += 1;
    }
  }

  function getVisibleButtons() {
    return optionButtons.filter((button) => !button.hidden);
  }

  function selectLanguage(nextLanguage: string) {
    closeMenu();
    onChange(nextLanguage);
  }

  function positionMenu() {
    const rect = trigger.getBoundingClientRect();
    menuHost.style.left = `${rect.left + window.scrollX}px`;
    menuHost.style.top = `${rect.bottom + window.scrollY + 6}px`;
    menuHost.style.minWidth = `${Math.max(rect.width, 220)}px`;
  }

  function closeMenu() {
    menuHost.hidden = true;
    toolbar.classList.remove('is-open');
    trigger.setAttribute('aria-expanded', 'false');
    search.value = '';
    renderOptions(CODE_BLOCK_LANGUAGES);
  }

  function openMenu() {
    positionMenu();
    menuHost.hidden = false;
    toolbar.classList.add('is-open');
    trigger.setAttribute('aria-expanded', 'true');
    renderOptions(CODE_BLOCK_LANGUAGES);
    search.focus();
    search.select();
  }

  search.addEventListener('input', () => {
    renderOptions(filterCodeBlockLanguages(search.value));
  });

  search.addEventListener('keydown', (event) => {
    const buttons = getVisibleButtons();
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      if (buttons.length === 0) return;
      selectedIndex = (selectedIndex + 1) % buttons.length;
      highlightSelected();
      buttons[selectedIndex]?.scrollIntoView({ block: 'nearest' });
      return;
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      if (buttons.length === 0) return;
      selectedIndex = (selectedIndex + buttons.length - 1) % buttons.length;
      highlightSelected();
      buttons[selectedIndex]?.scrollIntoView({ block: 'nearest' });
      return;
    }
    if (event.key === 'Enter') {
      event.preventDefault();
      const active = buttons[selectedIndex];
      if (!active?.dataset.language) return;
      selectLanguage(active.dataset.language);
      return;
    }
    if (event.key === 'Escape') {
      event.preventDefault();
      closeMenu();
    }
  });

  trigger.addEventListener('mousedown', (event) => {
    event.preventDefault();
    event.stopPropagation();
  });
  trigger.addEventListener('click', (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (menuHost.hidden) openMenu();
    else closeMenu();
  });

  const onDocumentMouseDown = (event: MouseEvent) => {
    const target = event.target as Node;
    if (toolbar.contains(target) || menuHost.contains(target)) return;
    closeMenu();
  };

  const onRepositionOrClose = () => {
    if (menuHost.hidden) return;
    positionMenu();
  };

  document.addEventListener('mousedown', onDocumentMouseDown);
  window.addEventListener('resize', onRepositionOrClose);
  window.addEventListener('scroll', onRepositionOrClose, true);

  return {
    toolbar,
    setLanguage(nextLanguage: string) {
      label.textContent = codeBlockLanguageLabel(nextLanguage);
    },
    destroy() {
      document.removeEventListener('mousedown', onDocumentMouseDown);
      window.removeEventListener('resize', onRepositionOrClose);
      window.removeEventListener('scroll', onRepositionOrClose, true);
      closeMenu();
      menuHost.remove();
    },
  };
}
