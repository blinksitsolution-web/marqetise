(function () {
  function esc(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (char) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char];
    });
  }

  function lines(value) {
    return esc(value).replace(/\n/g, '<br>');
  }

  function text(value) {
    return String(value == null ? '' : value).trim();
  }

  function listOf(value) {
    if (!value) return [];
    if (Array.isArray(value)) return value;
    if (Array.isArray(value.data)) return value.data;
    return [];
  }

  function safePath(value) {
    if (typeof value !== 'string' || !/^\/(?!\/)[^:\s\\]*$/.test(value)) return '';
    return value;
  }

  function payloadOf(blocks, key) {
    var block = blocks && blocks[key];
    if (!block || !block.payload || typeof block.payload !== 'object') return null;
    return block.payload;
  }

  function items(payload) {
    if (!payload || !Array.isArray(payload.items)) return [];
    return payload.items.filter(function (item) { return item && typeof item === 'object'; });
  }

  function imageTag(src, alt) {
    var path = safePath(src);
    if (!path) return '';
    return '<img src="' + esc(path) + '" alt="' + esc(alt || '') + '">';
  }

  function button(label, href, className) {
    var path = safePath(href);
    var name = text(label);
    if (!path || !name) return '';
    return '<a class="' + className + '" href="' + esc(path) + '">' + esc(name) + '</a>';
  }

  function section(className, title, intro, body) {
    if (!body) return '';
    return '<section class="mq-home ' + className + '"><div class="container">'
      + (text(title) ? '<h2 class="ks-section-title">' + lines(title) + '</h2>' : '')
      + (text(intro) ? '<p class="mq-home-intro">' + esc(intro) + '</p>' : '')
      + body
      + '</div></section>';
  }

  function cards(rows, render) {
    var html = rows.map(render).filter(Boolean).join('');
    if (!html) return '';
    return '<div class="mq-home-grid">' + html + '</div>';
  }

  function heroHtml(blocks, settings) {
    var hero = payloadOf(blocks, 'home.hero');
    if (!hero || !text(hero.headline)) return '';
    var phone = text(settings && settings.phone);
    var phoneHref = phone.replace(/[^\d+]/g, '');
    var media = imageTag(hero.image, hero.image_alt || '');
    var actions = button(hero.primary_label, hero.primary_href, 'ks-btn-black')
      + button(hero.secondary_label, hero.secondary_href, 'mq-home-secondary');
    return '<section class="mq-home mq-home-hero"><div class="container">'
      + '<div>'
      + (text(hero.eyebrow) ? '<p class="mq-kicker">' + esc(hero.eyebrow) + '</p>' : '')
      + '<h1>' + lines(hero.headline) + '</h1>'
      + (text(hero.subcopy) ? '<p class="mq-home-lead">' + esc(hero.subcopy) + '</p>' : '')
      + (actions ? '<div class="mq-home-actions">' + actions + '</div>' : '')
      + (text(hero.proof) ? '<p class="mq-home-proof">' + esc(hero.proof) + '</p>' : '')
      + (phone ? '<p class="mq-home-phone"><a href="tel:' + esc(phoneHref) + '">' + esc(phone) + '</a></p>' : '')
      + '</div>'
      + (media ? '<div>' + media + '</div>' : '')
      + '</div></section>';
  }

  function itemCards(payload, render) {
    return cards(items(payload), render);
  }

  function fillPanel(blocks) {
    var panel = document.querySelector('[data-chrome="panel"]');
    if (!panel) return;
    var about = payloadOf(blocks, 'about.identity');
    var title = about ? text(about.title) : '';
    var body = about ? text(about.body) : '';
    var titleNode = panel.querySelector('[data-chrome="panel-title"]');
    var bodyNode = panel.querySelector('[data-chrome="panel-body"]');
    if (titleNode) titleNode.textContent = title;
    if (bodyNode) bodyNode.textContent = body;
    panel.hidden = !(title || body);
  }

  window.renderHomeSections = function (payload) {
    var data = payload || {};
    var blocks = data.blocks || {};
    var heroRoot = document.getElementById('home-hero');
    var sectionsRoot = document.getElementById('home-sections');
    fillPanel(blocks);
    if (!heroRoot && !sectionsRoot) return;

    if (heroRoot) heroRoot.innerHTML = heroHtml(blocks, data.settings || {});

    if (!sectionsRoot) return;

    var servicesIntro = payloadOf(blocks, 'home.services');
    var services = servicesIntro ? listOf(data.services) : [];
    var serviceHtml = cards(services, function (service) {
      if (!service || !text(service.name)) return '';
      var href = 'page-service-details.html?slug=' + encodeURIComponent(service.slug || '');
      return '<article class="mq-home-card">'
        + imageTag(service.image_path, service.name)
        + '<h3><a href="' + href + '">' + esc(service.name) + '</a></h3>'
        + (text(service.summary) ? '<p>' + esc(service.summary) + '</p>' : '')
        + '<a href="' + href + '">View service</a>'
        + '</article>';
    });

    var why = payloadOf(blocks, 'home.why');
    var focus = payloadOf(blocks, 'home.focus');
    var process = payloadOf(blocks, 'home.process');
    var coursesIntro = payloadOf(blocks, 'home.courses');
    var courses = coursesIntro ? listOf(data.featured_courses) : [];
    var stats = payloadOf(blocks, 'home.stats');
    var projects = payloadOf(blocks, 'home.projects');
    var team = payloadOf(blocks, 'home.team');
    var quotes = payloadOf(blocks, 'home.testimonials');
    var partners = payloadOf(blocks, 'home.partners');
    var news = payloadOf(blocks, 'home.news');
    var cta = payloadOf(blocks, 'home.cta');

    var html = '';

    html += section('mq-home-focus', focus && focus.title, '', itemCards(focus, function (item) {
      if (!text(item.title) && !text(item.body)) return '';
      return '<article class="mq-home-card"><h3>' + esc(item.title || '') + '</h3>'
        + (text(item.body) ? '<p>' + esc(item.body) + '</p>' : '') + '</article>';
    }));

    html += section('mq-home-services', servicesIntro && servicesIntro.title, servicesIntro && servicesIntro.intro, serviceHtml);

    html += section('mq-home-why', why && why.title, '', itemCards(why, function (item) {
      if (!text(item.title) && !text(item.body)) return '';
      return '<article class="mq-home-card"><h3>' + esc(item.title || '') + '</h3>'
        + (text(item.body) ? '<p>' + esc(item.body) + '</p>' : '') + '</article>';
    }));

    var steps = items(process).filter(function (item) { return text(item.title) || text(item.body); });
    html += section('mq-home-process', process && process.title, '', steps.length ? '<ol class="mq-home-grid">' + steps.map(function (item, index) {
      return '<li class="mq-home-card"><span>' + esc(String(index + 1).padStart(2, '0')) + '</span><h3>' + esc(item.title || '') + '</h3>'
        + (text(item.body) ? '<p>' + esc(item.body) + '</p>' : '') + '</li>';
    }).join('') + '</ol>' : '');

    html += section('mq-home-courses', coursesIntro && coursesIntro.title, coursesIntro && coursesIntro.intro, cards(courses, function (course) {
      if (!course || !text(course.title)) return '';
      var href = '/courses/' + encodeURIComponent(course.slug || '');
      return '<article class="mq-home-card">'
        + imageTag(course.image_path, course.title)
        + '<h3><a href="' + href + '">' + esc(course.title) + '</a></h3>'
        + (text(course.summary) ? '<p>' + esc(course.summary) + '</p>' : '')
        + '<a href="' + href + '">View course</a>'
        + '</article>';
    }));

    html += section('mq-home-stats', stats && stats.title, '', itemCards(stats, function (item) {
      if (!text(item.value)) return '';
      return '<article class="mq-home-card"><p class="mq-home-stat">' + esc(item.value) + '</p><h3>' + esc(item.label || '') + '</h3></article>';
    }));

    html += section('mq-home-projects', projects && projects.title, '', itemCards(projects, function (item) {
      if (!text(item.title)) return '';
      var href = safePath(item.href);
      var title = href ? '<a href="' + esc(href) + '">' + esc(item.title) + '</a>' : esc(item.title);
      return '<article class="mq-home-card">' + imageTag(item.image, item.image_alt || item.title)
        + '<h3>' + title + '</h3>' + (text(item.summary) ? '<p>' + esc(item.summary) + '</p>' : '') + '</article>';
    }));

    html += section('mq-home-team', team && team.title, '', itemCards(team, function (item) {
      var name = text(item.name);
      if (!name) return '';
      return '<article class="mq-home-card">' + imageTag(item.image, item.image_alt || name)
        + '<h3>' + esc(name) + '</h3>'
        + (text(item.role) ? '<p>' + esc(item.role) + '</p>' : '')
        + (text(item.bio) ? '<p>' + esc(item.bio) + '</p>' : '')
        + '</article>';
    }));

    html += section('mq-home-quotes', quotes && quotes.title, '', itemCards(quotes, function (item) {
      var quote = text(item.quote || item.body);
      if (!quote) return '';
      var name = text(item.name || item.title);
      return '<blockquote class="mq-home-card"><p>' + esc(quote) + '</p>'
        + (name ? '<footer>' + esc(name) + (text(item.role) ? ', ' + esc(item.role) : '') + '</footer>' : '')
        + '</blockquote>';
    }));

    var logos = items(partners).map(function (item) {
      var img = imageTag(item.image, item.image_alt || item.name || '');
      var name = text(item.name);
      if (!img && !name) return '';
      var href = safePath(item.href);
      var inner = img || esc(name);
      var nameText = img && !text(item.image_alt) && name ? '<span class="sr-only">' + esc(name) + '</span>' : '';
      return href ? '<a href="' + esc(href) + '">' + inner + nameText + '</a>' : '<span>' + inner + nameText + '</span>';
    }).filter(Boolean).join('');
    html += section('mq-home-partners', partners && partners.title, '', logos ? '<div class="mq-partner-row">' + logos + '</div>' : '');

    html += section('mq-home-news', news && news.title, '', itemCards(news, function (item) {
      if (!text(item.title)) return '';
      var href = safePath(item.href);
      var title = href ? '<a href="' + esc(href) + '">' + esc(item.title) + '</a>' : esc(item.title);
      return '<article class="mq-home-card">' + imageTag(item.image, item.image_alt || item.title)
        + (text(item.date) ? '<p>' + esc(item.date) + '</p>' : '')
        + '<h3>' + title + '</h3>'
        + (text(item.summary) ? '<p>' + esc(item.summary) + '</p>' : '')
        + '</article>';
    }));

    if (cta && (text(cta.title) || text(cta.primary_label))) {
      var ctaActions = button(cta.primary_label, cta.primary_href, 'ks-btn-black')
        + button(cta.secondary_label, cta.secondary_href, 'mq-home-secondary');
      html += '<section class="mq-home mq-home-cta"><div class="container">'
        + (text(cta.title) ? '<h2 class="ks-section-title">' + lines(cta.title) + '</h2>' : '')
        + (text(cta.body) ? '<p class="mq-home-intro">' + esc(cta.body) + '</p>' : '')
        + (ctaActions ? '<div class="mq-home-actions">' + ctaActions + '</div>' : '')
        + '</div></section>';
    }

    sectionsRoot.innerHTML = html;
    var formTitle = document.getElementById('home-enquiry-title');
    if (formTitle && cta && text(cta.form_title)) formTitle.textContent = text(cta.form_title);
  };
})();
