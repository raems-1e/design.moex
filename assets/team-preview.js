(() => {
  const copy = [
    ['Визуальное направление', 'Креативная роль — связывать идеи команды с характером бренда: находить выразительный образ, задавать визуальный курс и сохранять целостность коммуникаций.', 'Концепция · Айдентика'],
    ['От задачи к решению', 'Роль руководителя — помогать команде двигаться согласованно: уточнять задачи, выстраивать приоритеты и объединять отдельные решения в понятный результат.', 'Команда · Процесс'],
    ['Ясность в деталях', 'Дизайн начинается с понятной идеи. Композиция, типографика и визуальная иерархия помогают выделить главное и превратить сложное сообщение в доступное.', 'Композиция · Типографика'],
    ['Целостность системы', 'Старший дизайнер соединяет общую концепцию с деталями: проверяет логику решений, помогает развивать визуальный язык и доводит макеты до цельного результата.', 'Система · Качество'],
    ['От идеи к форме', 'Дизайнер исследует разные способы рассказать об одном: через графику, ритм и цвет. Поиск вариантов помогает найти форму, которая поддерживает смысл.', 'Графика · Визуальный поиск'],
    ['Характер коммуникации', 'Узнаваемость складывается из небольших решений. Работа с изображением, акцентами и пространством помогает сохранять характер бренда в разных форматах.', 'Образ · Композиция'],
    ['Точность исполнения', 'Роль старшего дизайнера — удерживать баланс выразительности и последовательности: продумывать детали, проверять решения в разных форматах и сохранять общий стандарт.', 'Детали · Масштабирование']
  ];
  const cards = [...document.querySelectorAll('.team .person')];
  const eyeIcon = '<svg class="team-eye" viewBox="0 0 24 24" aria-hidden="true"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/></svg>';
  const closeIcon = '<svg class="team-cross" viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg>';
  const setOpen = (card, open) => {
    card.classList.toggle('is-expanded', open);
    card.querySelector('.person-preview__toggle').setAttribute('aria-expanded', String(open));
    card.querySelector('.person-preview__toggle-label').textContent = open ? 'Свернуть' : 'Подробнее';
    const name = card.querySelector('h3').textContent;
    card.querySelectorAll('.person-preview__toggle,.person-preview__photo-toggle').forEach(button => {
      button.setAttribute('aria-expanded', String(open));
      button.setAttribute('aria-label', `${open ? 'Свернуть' : 'Подробнее'}: ${name}`);
    });
    card.querySelector('.person-preview__detail').inert = !open;
    card.querySelector('.person-preview__detail').setAttribute('aria-hidden', String(!open));
  };
  cards.forEach((card, index) => {
    if (!copy[index]) return;
    const [title, text, tags] = copy[index];
    card.classList.add('person-preview');
    const detail = document.createElement('div');
    detail.className = 'person-preview__detail';
    detail.id = `team-detail-${index}`;
    detail.innerHTML = '<div class="person-preview__detail-clip"><div class="person-preview__detail-body"><h4></h4><span class="person-preview__tags"></span><p></p></div></div>';
    detail.querySelector('h4').textContent = title;
    detail.querySelector('.person-preview__tags').textContent = tags;
    detail.querySelector('p').textContent = text.replace(/\.$/, '').replace(
      /(^|[\s«(])(в|во|на|к|ко|с|со|у|о|об|от|до|из|за|по|под|над|при|для|без|через|между|перед|про|и|а|но|не) +(?=\S)/giu,
      '$1$2\u00a0'
    );
    const button = document.createElement('button');
    button.className = 'person-preview__toggle';
    button.type = 'button';
    button.setAttribute('aria-controls', detail.id);
    button.setAttribute('aria-label', `Подробнее: ${card.querySelector('h3').textContent}`);
    button.innerHTML = '<span class="person-preview__toggle-label">Подробнее</span>';
    const photo = card.querySelector('.person__photo');
    const photoButton = document.createElement('button');
    photoButton.type = 'button';
    photoButton.className = 'person-preview__photo-toggle';
    photoButton.setAttribute('aria-controls', detail.id);
    photo.removeAttribute('role');
    photo.removeAttribute('aria-label');
    photo.append(photoButton);
    card.append(detail, button);
    button.insertAdjacentHTML('beforeend', eyeIcon + closeIcon);
    const cursor = document.createElement('span');
    cursor.className = 'person-preview__cursor';
    cursor.setAttribute('aria-hidden', 'true');
    cursor.innerHTML = eyeIcon + closeIcon;
    card.append(cursor);
    card.addEventListener('pointermove', event => {
      if (event.pointerType !== 'mouse') return;
      const rect = card.getBoundingClientRect();
      cursor.style.left = `${event.clientX - rect.left}px`;
      cursor.style.top = `${event.clientY - rect.top}px`;
      card.classList.add('has-eye-cursor');
    });
    card.addEventListener('pointerleave', () => card.classList.remove('has-eye-cursor'));
    detail.addEventListener('click', () => {
      if (!window.getSelection()?.toString()) button.click();
    });
    setOpen(card, false);
    button.addEventListener('click', () => {
      const open = !card.classList.contains('is-expanded');
      cards.forEach(other => { if (other !== card && other.classList.contains('person-preview')) setOpen(other, false); });
      setOpen(card, open);
      button.setAttribute('aria-label', `${open ? 'Свернуть' : 'Подробнее'}: ${card.querySelector('h3').textContent}`);
    });
    photoButton.addEventListener('click', () => button.click());
    card.addEventListener('keydown', event => {
      if (event.key === 'Escape') { setOpen(card, false); button.focus({ preventScroll:true }); }
    });
  });
})();
