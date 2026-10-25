(function () {
  function esc(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (char) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char];
    });
  }

  function text(value) {
    return String(value == null ? '' : value).trim();
  }

  function lines(value) {
    return esc(value).replace(/\n/g, '<br>');
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

  function slugify(value) {
    return text(value).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  }

  function findItem(rows, slug) {
    return rows.filter(function (item) {
      var key = text(item.slug) || slugify(item.name || item.title);
      return key && key === slug;
    })[0];
  }

  function setText(selector, value) {
    var next = text(value);
    Array.prototype.forEach.call(document.querySelectorAll(selector), function (node) {
      if (!next) return;
      node.textContent = next;
    });
  }

  function imageTag(src, alt) {
    var path = safePath(src);
    if (!path) return '';
    return '<img src="' + esc(path) + '" alt="' + esc(text(alt)) + '">';
  }

  function card(title, body, href, image) {
    var inner = image + '<h3>' + esc(title) + '</h3>' + (body ? '<p>' + lines(body) + '</p>' : '');
    if (href) return '<a class="mq-home-card" href="' + esc(href) + '">' + inner + '</a>';
    return '<article class="mq-home-card">' + inner + '</article>';
  }

  function section(title, intro, body) {
    if (!text(title) && !text(intro) && !body) return '';
    return '<section class="mq-home mq-page-block"><div class="container">'
      + (text(title) ? '<h2 class="ks-section-title">' + esc(title) + '</h2>' : '')
      + (text(intro) ? '<p>' + lines(intro) + '</p>' : '')
      + body
      + '</div></section>';
  }

  function grid(cards) {
    if (!cards) return '';
    return '<div class="mq-home-grid">' + cards + '</div>';
  }

  function linkItems(rows, className) {
    return rows.map(function (item) {
      var href = safePath(item && item.href);
      var label = text(item && item.label);
      if (!href || !label) return '';
      var classAttr = className ? ' class="' + className + '"' : '';
      return '<li><a' + classAttr + ' href="' + esc(href) + '">' + esc(label) + '</a></li>';
    }).join('');
  }

  function replaceList(selector, html) {
    if (!html) return;
    Array.prototype.forEach.call(document.querySelectorAll(selector), function (node) {
      node.innerHTML = html;
    });
  }

  function applyChrome(blocks) {
    var chrome = payloadOf(blocks, 'site.chrome');
    if (!chrome) return;
    var nav = linkItems(Array.isArray(chrome.nav) ? chrome.nav : []);
    if (nav) replaceList('ul.navigation', nav);
    var footer = linkItems(Array.isArray(chrome.footer_links) ? chrome.footer_links : [], 'border-line-yellow');
    if (footer) replaceList('[data-chrome="footer-links"]', footer);
    var legal = linkItems(Array.isArray(chrome.legal_links) ? chrome.legal_links : [], 'border-line');
    if (legal) replaceList('[data-chrome="legal-links"]', legal);
    var ctaHref = safePath(chrome.cta_href);
    var ctaLabel = text(chrome.cta_label);
    Array.prototype.forEach.call(document.querySelectorAll('[data-chrome="cta"]'), function (node) {
      if (ctaHref) node.setAttribute('href', ctaHref);
      if (!ctaLabel) return;
      var labels = node.querySelectorAll('.text-1, .text-2');
      if (labels.length) {
        Array.prototype.forEach.call(labels, function (label) { label.textContent = ctaLabel; });
      } else {
        node.textContent = ctaLabel;
      }
    });
    setText('[data-chrome="footer-explore-title"]', chrome.footer_explore_title);
    setText('[data-chrome="footer-contact-title"]', chrome.footer_contact_title);
    var placeholder = text(chrome.search_placeholder);
    if (placeholder) {
      Array.prototype.forEach.call(document.querySelectorAll('[data-chrome="search"]'), function (input) {
        input.setAttribute('placeholder', placeholder);
      });
    }
    var banner = safePath(chrome.banner_image);
    if (banner) {
      Array.prototype.forEach.call(document.querySelectorAll('.page-title'), function (node) {
        node.style.backgroundImage = 'url("' + banner.replace(/"/g, '') + '")';
      });
    }
  }

  function applyFormCopy(blocks) {
    var copy = payloadOf(blocks, 'contact.form');
    if (!copy) return;
    var fields = {
      name: copy.name_label,
      email: copy.email_label,
      subject: copy.subject_label,
      message: copy.message_label,
      phone: copy.phone_label,
    };
    var form = document.getElementById('contact_form');
    if (form) {
      Object.keys(fields).forEach(function (name) {
        var label = text(fields[name]);
        var input = form.elements[name === 'name' ? 'form_name' : name === 'email' ? 'form_email' : name === 'message' ? 'form_message' : name];
        if (input && label) {
          input.setAttribute('placeholder', label);
          input.setAttribute('aria-label', label);
        }
      });
      var button = text(copy.button_label);
      if (button) setText('#contact_form [data-chrome="submit"] .text-1, #contact_form [data-chrome="submit"] .text-2', button);
    }
    var home = document.getElementById('home_contact_form');
    if (!home) return;
    var homeFields = {
      name: copy.home_name_label,
      email: copy.home_email_label,
      subject: copy.home_subject_label,
      message: copy.home_message_label,
    };
    Object.keys(homeFields).forEach(function (name) {
      var label = text(homeFields[name]);
      if (!label) return;
      var slot = home.querySelector('[data-form-label="' + name + '"]');
      if (slot) slot.textContent = label;
    });
    var homeButton = text(copy.home_button_label);
    if (homeButton) {
      var submit = home.querySelector('[type="submit"]');
      if (submit) submit.textContent = homeButton;
    }
    setText('#home_contact_form [data-form-label="consent"]', copy.home_consent);
  }

  function applyBook(blocks) {
    var book = payloadOf(blocks, 'book.hero');
    if (!book) return;
    setText('[data-book="title"]', book.title);
    setText('[data-book="eyebrow"]', book.eyebrow);
    setText('[data-book="headline"]', book.headline);
    setText('[data-book="subcopy"]', book.subcopy);
  }

  function applyCourses(blocks) {
    var hero = payloadOf(blocks, 'courses.hero');
    if (!hero) return;
    setText('#courses-heading', hero.headline);
    var intro = document.getElementById('courses-intro');
    if (intro) {
      intro.textContent = text(hero.subcopy);
      intro.hidden = !text(hero.subcopy);
    }
  }

  function applyContact(blocks) {
    var hero = payloadOf(blocks, 'contact.hero');
    if (!hero) return;
    setText('[data-contact="headline"]', hero.headline);
    setText('[data-contact="subcopy"]', hero.subcopy);
    var box = document.getElementById('contact-intro');
    if (box) box.hidden = !text(hero.headline) && !text(hero.subcopy);
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
    panel.hidden = !title && !body;
  }

  function aboutHtml(blocks) {
    var identity = payloadOf(blocks, 'about.identity');
    var approach = payloadOf(blocks, 'about.approach');
    var html = '';
    if (identity) {
      var values = Array.isArray(identity.values) ? identity.values : [];
      var valueCards = values.map(function (item) {
        if (!text(item.title) && !text(item.body)) return '';
        return card(item.title || '', item.body || '', '', '');
      }).join('');
      var prose = (text(identity.body) ? '<p>' + lines(identity.body) + '</p>' : '')
        + (text(identity.mission) ? '<h3>Mission</h3><p>' + lines(identity.mission) + '</p>' : '')
        + (text(identity.vision) ? '<h3>Vision</h3><p>' + lines(identity.vision) + '</p>' : '')
        + (valueCards ? grid(valueCards) : '');
      html += section(identity.title, '', prose);
    }
    if (approach) {
      var steps = items(approach).map(function (item) {
        if (!text(item.title) && !text(item.body)) return '';
        return card(item.title || '', item.body || '', '', '');
      }).join('');
      html += section(text(approach.title), text(approach.intro), grid(steps));
    }
    return html;
  }

  function servicesHtml(blocks, services) {
    var hero = payloadOf(blocks, 'services.hero') || {};
    var cards = listOf(services).map(function (service) {
      if (!service || !text(service.name)) return '';
      var href = '/service-details?slug=' + encodeURIComponent(service.slug || '');
      return card(service.name, service.summary || '', href, imageTag(service.image_path, service.name));
    }).join('');
    return section(hero.title, hero.intro, grid(cards));
  }

  function collectionHtml(blocks, blockKey, hrefFor) {
    var payload = payloadOf(blocks, blockKey);
    if (!payload) return '';
    var cards = items(payload).map(function (item) {
      var title = text(item.title || item.name);
      if (!title && !text(item.summary || item.body || item.quote)) return '';
      var href = safePath(item.href) || (hrefFor ? hrefFor(item) : '');
      var image = imageTag(item.image, item.image_alt || title);
      var body = item.summary || item.body || item.quote || '';
      if (blockKey === 'home.team') body = item.role || item.bio || '';
      if (blockKey === 'home.testimonials') {
        return card(text(item.name || item.title), item.quote || item.body || '', '', '');
      }
      return card(title, body, href, image);
    }).join('');
    return section(payload.title, payload.intro, grid(cards));
  }

  function detailHtml(blocks, blockKey, label) {
    var payload = payloadOf(blocks, blockKey);
    var slug = new URLSearchParams(window.location.search).get('slug') || '';
    var rows = payload ? items(payload) : [];
    var item = findItem(rows, slug);
    if (!item) {
      return section('', '', '<h2>That ' + esc(label) + ' is not on this site.</h2>');
    }
    var title = text(item.title || item.name);
    var heading = document.querySelector('h1.title');
    if (heading && title) heading.textContent = title;
    var image = imageTag(item.image, item.image_alt || title);
    var body = item.summary || item.bio || item.body || '';
    var role = text(item.role);
    return section('', role, image + (body ? '<p>' + lines(body) + '</p>' : ''));
  }

  function serviceDetail(services) {
    var slug = new URLSearchParams(window.location.search).get('slug') || '';
    var service = listOf(services).filter(function (item) { return item && item.slug === slug; })[0];
    if (!service) return section('', '', '<h2>That service is not on this site.</h2>');
    var heading = document.querySelector('h1.title');
    if (heading && service.name) heading.textContent = service.name;
    if (service.name) document.title = service.name + ' | Marqetise';
    return section('', service.summary || '', imageTag(service.image_path, service.name) + (service.description ? '<p>' + lines(service.description) + '</p>' : ''));
  }

  function packagesHtml(blocks) {
    var payload = payloadOf(blocks, 'packages.plans');
    if (!payload) return '';
    var cards = items(payload).map(function (item) {
      if (!text(item.name) && !text(item.price) && !text(item.summary)) return '';
      var href = safePath(item.href);
      var body = [text(item.price), text(item.summary)].filter(Boolean).join('\n');
      return card(item.name || '', body, href, '');
    }).join('');
    return section(payload.title, payload.intro, grid(cards));
  }

  function faqIntro(blocks) {
    var hero = payloadOf(blocks, 'faq.hero') || {};
    return section(hero.title, hero.intro, '');
  }

  function renderMount(mount, blocks, data) {
    var page = mount.getAttribute('data-page');
    var html = '';
    if (page === 'about') html = aboutHtml(blocks);
    if (page === 'services') html = servicesHtml(blocks, data.services);
    if (page === 'faq') html = faqIntro(blocks);
    if (page === 'projects') {
      html = collectionHtml(blocks, 'home.projects', function (item) {
        var slug = text(item.slug) || slugify(item.title);
        return slug ? '/project-details?slug=' + encodeURIComponent(slug) : '';
      });
    }
    if (page === 'team') {
      html = collectionHtml(blocks, 'home.team', function (item) {
        var slug = text(item.slug) || slugify(item.name);
        return slug ? '/team-details?slug=' + encodeURIComponent(slug) : '';
      });
    }
    if (page === 'news') {
      html = collectionHtml(blocks, 'home.news', function (item) {
        var slug = text(item.slug) || slugify(item.title);
        return slug ? '/news-details?slug=' + encodeURIComponent(slug) : '';
      });
    }
    if (page === 'testimonials') html = collectionHtml(blocks, 'home.testimonials');
    if (page === 'packages') html = packagesHtml(blocks);
    if (page === 'project') html = detailHtml(blocks, 'home.projects', 'project');
    if (page === 'team-member') html = detailHtml(blocks, 'home.team', 'team member');
    if (page === 'news-item') html = detailHtml(blocks, 'home.news', 'article');
    if (page === 'service') html = serviceDetail(data.services);
    mount.innerHTML = html;
    mount.hidden = !text(mount.textContent);
  }

  window.renderPageSections = function (data) {
    data = data || {};
    var blocks = data.blocks || {};
    applyChrome(blocks);
    applyFormCopy(blocks);
    applyBook(blocks);
    applyCourses(blocks);
    applyContact(blocks);
    fillPanel(blocks);
    Array.prototype.forEach.call(document.querySelectorAll('#page-sections'), function (mount) {
      renderMount(mount, blocks, data);
    });
  };
})();
