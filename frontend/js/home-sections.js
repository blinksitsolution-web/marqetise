(function () {
  function esc(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (char) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char];
    });
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

  function safeMedia(value) {
    if (typeof value !== 'string') return '';
    var path = value.trim();
    if (!path || /^(javascript:|data:)/i.test(path) || path.indexOf('..') !== -1 || /[\s\\]/.test(path)) return '';
    if (path.indexOf('images/') === 0) return path;
    if (path.charAt(0) === '/' && path.charAt(1) !== '/') return path;
    try {
      var url = new URL(path);
      if (url.origin === window.location.origin && (url.pathname.indexOf('/media/') === 0 || url.pathname.indexOf('/storage/') === 0)) {
        return path;
      }
    } catch {
      return '';
    }
    return '';
  }

  function applyImage(img, src) {
    if (!img || !src) return;
    if (!img.hasAttribute('data-template-src')) {
      img.setAttribute('data-template-src', img.getAttribute('src') || '');
    }
    img.onerror = function () {
      var fallback = img.getAttribute('data-template-src') || '';
      if (fallback && img.getAttribute('src') !== fallback) {
        img.onerror = null;
        img.setAttribute('src', fallback);
        return;
      }
      img.hidden = true;
    };
    img.setAttribute('src', src);
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

  function setRich(node, value) {
    if (!node || !text(value)) return;
    node.innerHTML = esc(value).replace(/\n/g, '<br>');
  }

  function setLabel(node, value) {
    if (!node || !text(value)) return;
    var faces = node.querySelectorAll('.text-1, .text-2');
    if (faces.length) {
      Array.prototype.forEach.call(faces, function (face) { face.textContent = text(value); });
      return;
    }
    node.textContent = text(value);
  }

  function listLabel(li, value) {
    if (!li || !text(value)) return;
    Array.prototype.slice.call(li.childNodes).forEach(function (node) {
      if (node.nodeType === 3) li.removeChild(node);
    });
    li.appendChild(document.createTextNode(' ' + text(value)));
  }

  function pair(nodes, rows, fill) {
    var list = Array.prototype.slice.call(nodes || []);
    if (!list.length || !rows.length) return;
    var templates = list.slice();
    var parent = list[0].parentElement;
    rows.forEach(function (row, index) {
      var node = list[index];
      if (!node && parent) {
        node = templates[index % templates.length].cloneNode(true);
        parent.appendChild(node);
        list.push(node);
      }
      if (node) fill(node, row, index);
    });
    list.slice(rows.length).forEach(function (node) { node.hidden = true; });
  }

  function paint(nodes, rows, fill) {
    var list = Array.prototype.slice.call(nodes || []);
    rows.forEach(function (row, index) {
      if (list[index]) fill(list[index], row, index);
    });
  }

  function fillPanel(blocks) {
    var panel = document.querySelector('[data-chrome="panel"]');
    if (!panel) return;
    var about = payloadOf(blocks, 'about.identity');
    var title = about ? text(about.title) : '';
    var body = about ? text(about.body) : '';
    var titleNode = panel.querySelector('[data-chrome="panel-title"]');
    var bodyNode = panel.querySelector('[data-chrome="panel-body"]');
    if (title && titleNode) titleNode.textContent = title;
    if (body && bodyNode) bodyNode.textContent = body;
  }

  function applyHero(hero) {
    if (!hero) return;
    if (text(hero.headline)) {
      Array.prototype.forEach.call(document.querySelectorAll('.ks-slider-title'), function (node) {
        setRich(node, hero.headline);
      });
    }
    if (text(hero.eyebrow)) {
      Array.prototype.forEach.call(document.querySelectorAll('.ks-slider-subtitle span'), function (node) {
        node.textContent = text(hero.eyebrow);
      });
    }
    if (text(hero.subcopy)) {
      Array.prototype.forEach.call(document.querySelectorAll('[data-home="subcopy"], .ks-slider-desc > p'), function (node) {
        node.textContent = text(hero.subcopy);
      });
    }
    if (text(hero.proof)) {
      Array.prototype.forEach.call(document.querySelectorAll('.ks-slider-desc > span span'), function (node) {
        node.textContent = text(hero.proof);
      });
    }
    var href = safePath(hero.primary_href);
    var label = text(hero.primary_label);
    Array.prototype.forEach.call(document.querySelectorAll('.ks-slider-link a'), function (link) {
      if (href) link.setAttribute('href', href);
      if (label) setLabel(link.querySelector('span') || link, label);
    });
    var image = safeMedia(hero.image);
    if (image) {
      Array.prototype.forEach.call(document.querySelectorAll('.ks-slider-thumb > img'), function (img) {
        applyImage(img, image);
        if (text(hero.image_alt)) img.setAttribute('alt', text(hero.image_alt));
      });
    }
  }

  function applyServices(intro, services) {
    var rows = listOf(services).filter(function (service) { return service && text(service.name); });
    if (intro && text(intro.intro)) {
      var copy = document.querySelector('.ks-service-top-text p');
      if (copy) copy.textContent = text(intro.intro);
    }
    pair(document.querySelectorAll('.ks-service-area .row.gx-30 > [class*="col-"]'), rows, function (column, service, index) {
      var card = column.querySelector('.ks-service-item') || column;
      var number = card.querySelector('.ks-service-number');
      if (number) number.textContent = String(index + 1).padStart(2, '0');
      var href = 'page-service-details.html?slug=' + encodeURIComponent(service.slug || '');
      var title = card.querySelector('.ks-service-title a');
      if (title) {
        title.textContent = service.name;
        title.setAttribute('href', href);
      }
      var more = card.querySelector('a.ks-service-more');
      if (more) more.setAttribute('href', href);
      var list = card.querySelector('.ks-service-list-box ul');
      var summary = text(service.summary);
      if (list && summary) {
        var first = list.querySelector('li');
        if (first) first.textContent = summary;
        Array.prototype.slice.call(list.querySelectorAll('li'), 1).forEach(function (item) { item.remove(); });
      }
    });
  }

  window.renderHomeSections = function (payload) {
    var data = payload || {};
    var blocks = data.blocks || {};
    if (!document.querySelector('.ks-slider-area') && !document.getElementById('home-sections')) return;

    fillPanel(blocks);
    applyHero(payloadOf(blocks, 'home.hero'));

    var focus = payloadOf(blocks, 'home.focus');
    if (focus) {
      setRich(document.querySelector('.ks-about-area .ks-section-title'), focus.title);
      pair(document.querySelectorAll('.ks-about-list-box li'), items(focus), function (item, row) {
        listLabel(item, row.title);
      });
    }

    applyServices(payloadOf(blocks, 'home.services'), data.services);

    var why = payloadOf(blocks, 'home.why');
    if (why) {
      setRich(document.querySelector('.ks-choose-area .ks-section-title'), why.title);
      pair(document.querySelectorAll('.ks-choose-list-box li'), items(why), function (item, row) {
        listLabel(item, row.title);
      });
    }

    var process = payloadOf(blocks, 'home.process');
    if (process) {
      paint(document.querySelectorAll('.ks-choose-title'), items(process), function (node, row) {
        if (text(row.title)) node.textContent = text(row.title);
      });
    }

    var projects = payloadOf(blocks, 'home.projects');
    if (projects) {
      setRich(document.querySelector('.ks-project-area .ks-section-title'), projects.title);
      pair(document.querySelectorAll('.ks-project-area .ks-project-item'), items(projects), function (card, row) {
        var href = safePath(row.href) || 'page-project-details.html';
        var title = card.querySelector('.ks-project-title a');
        if (title) {
          setRich(title, row.title);
          title.setAttribute('href', href);
        }
        var arrow = card.querySelector('.ks-project-arrow a');
        if (arrow) arrow.setAttribute('href', href);
        var category = card.querySelector('.ks-project-content > span');
        if (category && text(row.category)) category.textContent = text(row.category);
        var summary = card.querySelector('.ks-project-content p');
        if (summary && text(row.summary)) summary.textContent = text(row.summary);
        var image = safeMedia(row.image);
        if (image) {
          card.setAttribute('data-background', image);
          card.style.backgroundImage = 'url("' + image.replace(/"/g, '') + '")';
        }
      });
    }

    var team = payloadOf(blocks, 'home.team');
    if (team) {
      setRich(document.querySelector('.ks-team-area .ks-section-title'), team.title);
      pair(Array.prototype.map.call(document.querySelectorAll('.ks-team-area .ks-team-item'), function (card) {
        return card.parentElement;
      }), items(team), function (column, row) {
        var card = column.querySelector('.ks-team-item') || column;
        var name = text(row.name);
        var link = card.querySelector('.ks-team-title a');
        var href = safePath(row.href) || (name ? 'page-team-details.html?slug=' + encodeURIComponent(text(row.slug) || name.toLowerCase().replace(/[^a-z0-9]+/g, '-')) : '');
        if (link && name) {
          link.textContent = name;
          if (href) link.setAttribute('href', href);
        }
        var role = card.querySelector('.ks-team-content > span');
        if (role && text(row.role)) role.textContent = text(row.role);
        var image = safeMedia(row.image);
        var photo = card.querySelector('.ks-team-thumb > img');
        if (photo && image) {
          applyImage(photo, image);
          if (text(row.image_alt) || name) photo.setAttribute('alt', text(row.image_alt) || name);
        }
      });
    }

    var stats = payloadOf(blocks, 'home.stats');
    if (stats) {
      setRich(document.querySelector('.ks-funfact-area .ks-section-title'), stats.title);
      pair(document.querySelectorAll('.ks-funfact-wrap > .ks_fade_anim'), items(stats), function (wrap, row) {
        var number = wrap.querySelector('.ks-funfact-number');
        if (number && text(row.value)) number.textContent = text(row.value);
        var label = wrap.querySelector('.ks-funfact-item > span');
        if (label && text(row.label)) label.textContent = text(row.label);
      });
    }

    var quotes = payloadOf(blocks, 'home.testimonials');
    if (quotes) {
      setRich(document.querySelector('.ks-testimonial-area .ks-section-title'), quotes.title);
      paint(document.querySelectorAll('.ks-testimonial-content p'), items(quotes), function (node, row) {
        if (text(row.quote || row.body)) node.textContent = text(row.quote || row.body);
      });
      paint(document.querySelectorAll('.ks-testimonial-user-info .title'), items(quotes), function (node, row) {
        if (text(row.name)) node.textContent = text(row.name);
      });
      paint(document.querySelectorAll('.ks-testimonial-user-info span'), items(quotes), function (node, row) {
        if (text(row.role)) node.textContent = text(row.role);
      });
      paint(document.querySelectorAll('.ks-testimonial-user-wrap .thumb img'), items(quotes), function (img, row) {
        var image = safeMedia(row.image);
        if (!image) return;
        applyImage(img, image);
        if (text(row.image_alt) || text(row.name)) img.setAttribute('alt', text(row.image_alt) || text(row.name));
      });
    }

    var partners = payloadOf(blocks, 'home.partners');
    if (partners && text(partners.title)) {
      var brand = document.querySelector('.ks-brand-text a');
      if (brand) setRich(brand, partners.title);
    }
    paint(document.querySelectorAll('.ks-brand-item img'), items(partners), function (img, row) {
      var image = safeMedia(row.image);
      if (!image) return;
      applyImage(img, image);
      if (text(row.image_alt) || text(row.name)) img.setAttribute('alt', text(row.image_alt) || text(row.name));
    });

    var news = payloadOf(blocks, 'home.news');
    if (news) {
      setRich(document.querySelector('.ks-blog-area .ks-section-title'), news.title);
      pair(Array.prototype.map.call(document.querySelectorAll('.ks-blog-item'), function (card) {
        return card.parentElement;
      }), items(news), function (column, row) {
        var card = column.querySelector('.ks-blog-item') || column;
        var href = safePath(row.href) || 'news-details.html';
        var title = card.querySelector('.ks-blog-title a');
        if (title) {
          title.textContent = text(row.title);
          title.setAttribute('href', href);
        }
        var thumb = card.querySelector('.ks-blog-thumb a');
        if (thumb) thumb.setAttribute('href', href);
        var date = card.querySelector('.ks-blog-date span');
        if (date && text(row.date)) date.textContent = text(row.date);
        var image = safeMedia(row.image);
        var photo = card.querySelector('.ks-blog-thumb img');
        if (photo && image) {
          applyImage(photo, image);
          if (text(row.image_alt)) photo.setAttribute('alt', text(row.image_alt));
        }
      });
    }

    var cta = payloadOf(blocks, 'home.cta');
    if (cta) {
      setRich(document.querySelector('.ks-cta-title'), cta.title);
      setRich(document.querySelector('.ks-contact-area .ks-section-title'), cta.form_title);
      var contactCopy = document.querySelector('.ks-contact-left .ks_fade_anim p');
      if (contactCopy && text(cta.body)) contactCopy.textContent = text(cta.body);
      var button = document.querySelector('.ks-cta-area .ks-btn-black');
      var buttonHref = safePath(cta.primary_href);
      if (button && buttonHref) button.setAttribute('href', buttonHref);
      if (button && text(cta.primary_label)) setLabel(button, cta.primary_label);
    }
  };
})();
