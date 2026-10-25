(function () {
  var TYPE_ALIASES = {
    contact: 'other',
    corporate: 'corporate_training',
  };

  var COURSE_IMAGES = [
    'images/resource/service4-1.jpg',
    'images/resource/service4-2.jpg',
    'images/resource/service4-3.jpg',
    'images/resource/service4-4.jpg',
    'images/resource/service3-1.jpg',
    'images/resource/service3-2.jpg',
  ];

  function esc(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (char) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char];
    });
  }

  function priceLabel(course) {
    if (course.price_label) return course.price_label;
    if (course.price === null || course.price === undefined || course.price === '') return 'Contact for price';
    var amount = Number(course.price);
    if (!Number.isFinite(amount)) return 'Contact for price';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount);
  }

  function csrfToken() {
    var match = document.cookie.match(/(?:^|; )XSRF-TOKEN=([^;]*)/);
    return match ? decodeURIComponent(match[1]) : '';
  }

  function ensureCsrf() {
    return fetch('/sanctum/csrf-cookie', { credentials: 'include' }).then(function () {
      return csrfToken();
    });
  }

  function readJson(response) {
    return response.json().catch(function () {
      return {};
    }).then(function (body) {
      return { ok: response.ok, status: response.status, body: body };
    });
  }

  function errorText(result) {
    var body = result.body || {};
    if (result.status === 419) return 'The page needs a refresh before the enquiry can be sent.';
    if (result.status === 429) return 'Too many enquiries were sent from this connection. Wait a minute and try again.';
    if (body.errors) {
      return Object.keys(body.errors).map(function (key) {
        var value = body.errors[key];
        return Array.isArray(value) ? value.join(' ') : String(value);
      }).join(' ');
    }
    if (body.message) return body.message;
    return 'The enquiry could not be sent. Please try again.';
  }

  function fieldValue(form, names) {
    for (var i = 0; i < names.length; i += 1) {
      var field = form.elements[names[i]];
      if (field && typeof field.value === 'string') return field.value.trim();
    }
    return '';
  }

  function setStatus(form, message) {
    var status = form.querySelector('[data-enquiry-status]');
    if (!status) {
      status = document.createElement('p');
      status.setAttribute('data-enquiry-status', '');
      status.setAttribute('role', 'status');
      form.appendChild(status);
    }
    status.textContent = message;
  }

  function postInquiry(payload) {
    return ensureCsrf().then(function (token) {
      return fetch('/api/v1/inquiries', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
          'X-XSRF-TOKEN': token,
        },
        body: JSON.stringify(payload),
      }).then(readJson);
    });
  }

  function bindEnquiryForm(form) {
    var params = new URLSearchParams(window.location.search);
    var requestedType = TYPE_ALIASES[params.get('enquiry')] || params.get('enquiry') || '';
    var typeField = form.elements.type || form.querySelector('[name="type"]');
    var courseWrap = form.querySelector('[data-course-field]');
    var courseField = form.elements.course;

    if (typeField && requestedType) typeField.value = requestedType;
    if (form.elements.subject && params.get('subject')) form.elements.subject.value = params.get('subject');

    function syncCourseField() {
      if (!courseWrap || !typeField) return;
      var show = typeField.value === 'course';
      courseWrap.hidden = !show;
      if (courseField) courseField.required = show;
    }

    if (typeField) typeField.addEventListener('change', syncCourseField);

    if (courseField && courseField.tagName === 'SELECT') {
      fetch('/api/v1/courses?per_page=24', { headers: { Accept: 'application/json' }, credentials: 'include' })
        .then(function (response) { return response.ok ? response.json() : { data: [] }; })
        .then(function (body) {
          var courses = body.data || [];
          var wanted = (params.get('course') || '').toLowerCase();
          var options = '<option value="">Select a published course</option>';
          var found = false;
          courses.forEach(function (course) {
            if (course.slug === wanted) found = true;
            options += '<option value="' + esc(course.slug) + '">' + esc(course.title) + '</option>';
          });
          if (wanted && !found) {
            options += '<option value="' + esc(wanted) + '">' + esc(wanted) + '</option>';
          }
          courseField.innerHTML = options;
          if (wanted) courseField.value = wanted;
          if (window.jQuery && jQuery.fn.niceSelect) jQuery(courseField).niceSelect('update');
          syncCourseField();
        })
        .catch(function () {
          syncCourseField();
        });
    }

    syncCourseField();

    form.addEventListener('submit', function (event) {
      event.preventDefault();
      event.stopPropagation();

      var consent = form.elements.consent;
      if (consent && !consent.checked) {
        setStatus(form, 'Please confirm that we may contact you about this inquiry.');
        return;
      }

      var payload = {
        type: fieldValue(form, ['type']) || 'other',
        name: fieldValue(form, ['name', 'form_name']),
        email: fieldValue(form, ['email', 'form_email']),
        phone: fieldValue(form, ['phone', 'form_phone']) || null,
        subject: fieldValue(form, ['subject', 'form_subject']),
        message: fieldValue(form, ['message', 'form_message']),
        consent: true,
        hp_field: fieldValue(form, ['hp_field']),
      };

      if (payload.type === 'course') payload.course = fieldValue(form, ['course']);

      var button = form.querySelector('[type="submit"]');
      if (button) button.disabled = true;
      setStatus(form, 'Sending your enquiry…');

      postInquiry(payload).then(function (result) {
        if (button) button.disabled = false;
        if (!result.ok) {
          setStatus(form, errorText(result));
          return;
        }
        setStatus(form, (result.body && result.body.message) || 'Your inquiry has been saved.');
        form.reset();
        if (typeField) typeField.value = payload.type;
        syncCourseField();
      }).catch(function () {
        if (button) button.disabled = false;
        setStatus(form, 'The enquiry could not be sent. Please try again.');
      });
    }, true);
  }

  function metaLine(course) {
    return [course.category, course.level, course.format, course.duration_label, priceLabel(course)]
      .filter(Boolean)
      .map(esc)
      .join(' · ');
  }

  function courseCard(course, index) {
    var image = COURSE_IMAGES[index % COURSE_IMAGES.length];
    var href = 'page-course-details.html?slug=' + encodeURIComponent(course.slug);
    return ''
      + '<article class="mq-course-card col-lg-4 col-md-6">'
      + '<a class="mq-course-link" href="' + href + '">'
      + '<div class="mq-course-media"><img src="' + image + '" alt=""></div>'
      + '<div class="mq-course-body">'
      + '<p class="mq-kicker">' + esc(course.category || course.level || 'Course') + '</p>'
      + '<h3>' + esc(course.title) + '</h3>'
      + '<p>' + esc(course.summary || '') + '</p>'
      + '<div class="mq-course-meta"><span>' + esc(priceLabel(course)) + '</span>'
      + (course.duration_label ? '<span>' + esc(course.duration_label) + '</span>' : '')
      + '</div>'
      + '<span class="mq-course-more">View course</span>'
      + '</div></a></article>';
  }

  function loadCourses(page, collected) {
    return fetch('/api/v1/courses?per_page=24&page=' + page, {
      headers: { Accept: 'application/json' },
      credentials: 'include',
    }).then(function (response) {
      if (!response.ok) throw new Error('courses');
      return response.json();
    }).then(function (body) {
      var rows = collected.concat(body.data || []);
      var lastPage = body.meta && body.meta.last_page ? body.meta.last_page : 1;
      if (page < lastPage) return loadCourses(page + 1, rows);
      return rows;
    });
  }

  var grid = document.getElementById('course-grid');
  if (grid) {
    loadCourses(1, []).then(function (courses) {
        if (!courses.length) {
        grid.innerHTML = '<div class="col-12"><div class="mq-state"><h3>No courses are published yet.</h3><p>When a course is published, it will appear here. An enquiry does not reserve a place.</p></div></div>';
        return;
      }
      grid.innerHTML = courses.map(courseCard).join('');
    }).catch(function () {
      grid.innerHTML = '<div class="col-12"><div class="mq-state"><h3>The course list could not be loaded.</h3><p>Refresh the page to try again.</p></div></div>';
    });
  }

  function listBlock(title, items) {
    if (!items || !items.length) return '';
    return '<h3>' + esc(title) + '</h3><ul>' + items.map(function (item) {
      return '<li>' + esc(item) + '</li>';
    }).join('') + '</ul>';
  }

  var detail = document.getElementById('course-detail');
  if (detail) {
    var slug = new URLSearchParams(window.location.search).get('slug');
    if (!slug) {
      detail.innerHTML = '<p>This course is not published.</p>';
    } else {
      fetch('/api/v1/courses/' + encodeURIComponent(slug), {
        headers: { Accept: 'application/json' },
        credentials: 'include',
      }).then(function (response) {
        if (response.status === 404) {
          detail.innerHTML = '<p>This course is not published.</p>';
          return null;
        }
        if (!response.ok) throw new Error('course');
        return response.json();
      }).then(function (body) {
        if (!body) return;
        var course = body.data || {};
        document.title = course.title ? course.title + ' | Marqetise' : document.title;
        var heading = document.querySelector('h1.title');
        if (heading && course.title) heading.textContent = course.title;
        var crumbs = document.querySelector('.page-breadcrumb li:last-child');
        if (crumbs) crumbs.textContent = course.title || 'Course';
        var heading = document.querySelector('.page-title .title');
        if (heading) heading.textContent = course.title || 'Course';

        var facts = [course.category, course.level, course.format, course.duration_label, priceLabel(course)]
          .filter(Boolean)
          .map(esc);
        if (course.next_start_date) facts.push('Next start ' + esc(course.next_start_date));
        if (course.certificate_included) facts.push('Certificate included');

        var modules = (course.modules || []).map(function (module) {
          var lessons = (module.lessons || []).map(function (lesson) {
            return '<li>' + esc(lesson) + '</li>';
          }).join('');
          return '<li><strong>' + esc(module.title) + '</strong>'
            + (module.summary ? '<div>' + esc(module.summary) + '</div>' : '')
            + (lessons ? '<ul>' + lessons + '</ul>' : '')
            + '</li>';
        }).join('');

        var enquire = 'page-contact.html?enquiry=course&course=' + encodeURIComponent(course.slug)
          + '&subject=' + encodeURIComponent('Course enquiry: ' + (course.title || course.slug));

        var related = ((body.related && body.related.data) || []).map(function (item) {
          return '<li><a href="page-course-details.html?slug=' + encodeURIComponent(item.slug) + '">' + esc(item.title) + '</a></li>';
        }).join('');

        detail.innerHTML = ''
          + '<div class="mq-detail">'
          + '<div class="mq-detail-main">'
          + '<p class="mq-facts">' + facts.join(' · ') + '</p>'
          + (course.summary ? '<p class="mq-lead">' + esc(course.summary) + '</p>' : '')
          + (course.description ? '<p>' + esc(course.description) + '</p>' : '')
          + listBlock('Outcomes', course.outcomes || [])
          + (modules ? '<h3>Modules</h3><ol class="mq-modules">' + modules + '</ol>' : '')
          + (course.instructor_name ? '<h3>Instructor</h3><p class="mq-instructor">' + esc(course.instructor_name)
            + (course.instructor_title ? '<span>' + esc(course.instructor_title) + '</span>' : '') + '</p>'
            + (course.instructor_bio ? '<p>' + esc(course.instructor_bio) + '</p>' : '') : '')
          + '</div>'
          + '<aside class="mq-detail-side">'
          + '<p class="mq-kicker">Enquiry</p>'
          + '<h3>' + esc(course.title || 'This course') + '</h3>'
          + '<p>An enquiry does not take payment or reserve a place.</p>'
          + '<a class="ks-btn-black blue-bg" href="' + enquire + '"><span><span class="text-1">Enquire about this course</span><span class="text-2">Enquire about this course</span></span></a>'
          + (related ? '<h3>Other courses</h3><ul>' + related + '</ul>' : '')
          + '</aside></div>';
      }).catch(function () {
        detail.innerHTML = '<p>The course could not be loaded. Refresh the page to try again.</p>';
      });
    }
  }

  Array.prototype.forEach.call(document.querySelectorAll('#contact_form, #home_contact_form'), bindEnquiryForm);

  function listOf(value) {
    if (!value) return [];
    if (Array.isArray(value)) return value;
    if (Array.isArray(value.data)) return value.data;
    return [];
  }

  function inPage(root, selector) {
    return Array.prototype.filter.call(root.querySelectorAll(selector), function (node) {
      return node.closest('[data-cms-page]') === root;
    });
  }

  function applyPage(root, page) {
    if (!page) return;
    var skipTitle = root.getAttribute('data-cms-page') === 'course-details'
      && new URLSearchParams(window.location.search).get('slug');
    if (!skipTitle && page.title) {
      inPage(root, '[data-cms="title"]').forEach(function (node) {
        node.textContent = page.title;
      });
      inPage(root, '.page-breadcrumb li:last-child').forEach(function (node) {
        if (!node.querySelector('a')) node.textContent = page.title;
      });
    }
    inPage(root, '[data-cms="excerpt"]').forEach(function (node) {
      node.textContent = page.excerpt || '';
    });
    inPage(root, '[data-cms="body"]').forEach(function (node) {
      node.textContent = page.body || '';
    });
    if (root === document.body && page.meta_title) document.title = page.meta_title;
  }

  function fillServices(services) {
    var row = document.querySelector('[data-cms-services]');
    if (!row || !services.length) return;
    var cards = Array.prototype.slice.call(row.querySelectorAll('.service-block-four'));
    if (!cards.length) return;
    var template = cards[0];
    services.forEach(function (service, index) {
      var card = cards[index];
      if (!card) {
        card = template.cloneNode(true);
        row.appendChild(card);
      }
      var link = 'page-service-details.html?slug=' + encodeURIComponent(service.slug);
      var titleLink = card.querySelector('h4.title a');
      if (titleLink) {
        titleLink.textContent = service.name;
        titleLink.href = link;
      }
      var summary = card.querySelector('.content-box .text');
      if (summary) summary.textContent = service.summary || '';
      var arrow = card.querySelector('.image-box a');
      if (arrow) arrow.href = link;
      var number = card.querySelector('.number');
      if (number) number.textContent = String(index + 1).padStart(2, '0');
      card.hidden = false;
    });
    cards.slice(services.length).forEach(function (card) {
      card.hidden = true;
    });
  }

  function fillFaqs(groups) {
    var items = [];
    Object.keys(groups || {}).forEach(function (key) {
      listOf(groups[key]).forEach(function (faq) {
        if (faq && faq.question) items.push(faq);
      });
    });
    if (!items.length) return;
    Array.prototype.forEach.call(document.querySelectorAll('[data-cms-faqs]'), function (list) {
      var template = list.querySelector('li');
      if (!template) return;
      var icon = template.querySelector('.acc-btn .icon');
      var iconHtml = icon ? icon.outerHTML : '';
      list.innerHTML = items.map(function (faq, index) {
        return '<li class="accordion block' + (index === 0 ? ' active-block' : '') + '">'
          + '<div class="acc-btn border-bottom-0' + (index === 0 ? ' active' : '') + '">' + esc(faq.question) + iconHtml + '</div>'
          + '<div class="acc-content' + (index === 0 ? ' current' : '') + '"><div class="content"><div class="text">' + esc(faq.answer) + '</div></div></div>'
          + '</li>';
      }).join('');
      var column = list.parentElement;
      var row = column && column.parentElement;
      if (!row) return;
      Array.prototype.forEach.call(row.querySelectorAll('.accordion-box'), function (other) {
        if (other === list) return;
        var extra = other.closest('.faq-column') || other;
        extra.hidden = true;
      });
    });
  }

  function fillServiceDetail(services) {
    if (!document.body.hasAttribute('data-cms-service')) return;
    var slug = new URLSearchParams(window.location.search).get('slug');
    if (!slug) return;
    var service = services.filter(function (item) { return item.slug === slug; })[0];
    if (!service) return;
    var heading = document.querySelector('h1.title');
    if (heading) heading.textContent = service.name;
    var crumb = document.querySelector('.page-breadcrumb li:last-child');
    if (crumb && !crumb.querySelector('a')) crumb.textContent = service.name;
    var body = document.querySelector('[data-cms-service-body]');
    if (body) body.textContent = service.description || service.summary || '';
    if (service.name) document.title = service.name + ' | Marqetise';
  }

  fetch('/api/v1/site', { headers: { Accept: 'application/json' }, credentials: 'include' })
    .then(function (response) { return response.ok ? response.json() : null; })
    .then(function (site) {
      if (!site) return;
      var payload = site.data || site;
      var settings = payload.settings || {};
      if (settings.logo_url) {
        Array.prototype.forEach.call(document.querySelectorAll('.logo img, .nav-logo img'), function (img) {
          img.src = settings.logo_url;
          img.alt = settings.company_name || 'Marqetise';
        });
      }
      if (settings.phone) {
        Array.prototype.forEach.call(document.querySelectorAll('a[href^="tel:"]'), function (link) {
          link.href = 'tel:' + settings.phone;
          link.textContent = settings.phone;
        });
      }
      if (settings.email) {
        Array.prototype.forEach.call(document.querySelectorAll('a[href^="mailto:"], [data-site="email"]'), function (link) {
          if (link.tagName === 'A') link.href = 'mailto:' + settings.email;
          link.textContent = settings.email;
        });
      }
      if (settings.address) {
        Array.prototype.forEach.call(document.querySelectorAll('[data-site="address"]'), function (node) {
          node.textContent = settings.address;
        });
      }
      if (settings.company_name) {
        var copyright = document.querySelector('.ks-copyright-text p');
        if (copyright) copyright.textContent = '© ' + new Date().getFullYear() + ' ' + settings.company_name + '. All rights reserved.';
      }
      var pages = {};
      listOf(payload.pages).forEach(function (page) {
        if (page && page.slug) pages[page.slug] = page;
      });
      Array.prototype.forEach.call(document.querySelectorAll('[data-cms-page]'), function (root) {
        applyPage(root, pages[root.getAttribute('data-cms-page')]);
      });
      var services = listOf(payload.services);
      fillServices(services);
      fillServiceDetail(services);
      fillFaqs(payload.faqs || {});
    })
    .catch(function () {});
})();
