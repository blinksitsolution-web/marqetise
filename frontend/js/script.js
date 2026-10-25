var THEMEMASCOT = {};
(function ($) {

	"use strict";


	/* ---------------------------------------------------------------------- */
	/* --------------------------- Start Demo Switcher  --------------------- */
	/* ---------------------------------------------------------------------- */
	var showSwitcher = true;
	var $body = $('body');
	var $style_switcher = $('#style-switcher');
	if (!$style_switcher.length && showSwitcher) {
		$.ajax({
			url: "color-switcher/style-switcher.html",
			success: function (data) { $body.append(data); },
			dataType: 'html'
		});
	}

	/* ---------------------------------------------------------------------- */
	/* ----------------------------- En Demo Switcher  ---------------------- */
	/* ---------------------------------------------------------------------- */

	THEMEMASCOT.isRTL = {
		check: function () {
			if ($("html").attr("dir") === "rtl") {
				return true;
			} else {
				return false;
			}
		}
	};

	THEMEMASCOT.isLTR = {
		check: function () {
			if ($("html").attr("dir") !== "rtl") {
				return true;
			} else {
				return false;
			}
		}
	};

	/* ---------------------------------------------------------------------- */
	/* ----------------------------- En Demo Switcher  ---------------------- */
	/* ---------------------------------------------------------------------- */


	var windowOn = $(window);
	function hidePreloader() {
		$('.preloader').fadeOut(400);
	}
	windowOn.on('load', hidePreloader);
	if (document.readyState === 'complete') hidePreloader();
	setTimeout(hidePreloader, 1200);

	//Update Header Style and Scroll to Top
	function headerStyle() {
		if ($(".main-header").length) {
			var windowpos = $(window).scrollTop();
			var siteHeader = $(".header-style-one");
			var scrollLink = $(".scroll-to-top");
			var sticky_header = $(".main-header .sticky-header");
			if (windowpos > 100) {
				sticky_header.addClass("fixed-header animated slideInDown");
				scrollLink.fadeIn(300);
			} else {
				sticky_header.removeClass("fixed-header animated slideInDown");
				scrollLink.fadeOut(300);
			}
			if (windowpos > 1) {
				siteHeader.addClass("fixed-header");
			} else {
				siteHeader.removeClass("fixed-header");
			}
		}
	}
	headerStyle();

	//Submenu Dropdown Toggle
	if ($(".main-header li.dropdown ul").length) {
		$(".main-header .navigation li.dropdown").append(
			'<div class="dropdown-btn"><i class="far fa-angle-down"></i></div>'
		);
		//Megamenu Toggle
	}

	//Hidder bar
	if ($(".hidden-bar").length) {
		//Menu Toggle Btn
		$(".toggle-hidden-bar").on("click", function () {
			$("body").addClass("active-hidden-bar");
		});

		//Menu Toggle Btn
		$(".hidden-bar-back-drop, .hidden-bar .close-btn").on(
			"click",
			function () {
				$("body").removeClass("active-hidden-bar");
			}
		);
	}

	//Mobile Nav Hide Show
	if ($(".mobile-menu").length) {
		var mobileMenuContent = $(".main-header .main-menu .navigation").html();

		$(".mobile-menu .navigation").append(mobileMenuContent);
		$(".sticky-header .navigation").append(mobileMenuContent);
		$(".mobile-menu .close-btn").on("click", function () {
			$("body").removeClass("mobile-menu-visible");
		});

		//Dropdown Button
		$(".mobile-menu li.dropdown .dropdown-btn").on("click", function () {
			$(this).prev("ul").slideToggle(500);
			$(this).toggleClass("active");
			$(this).prev(".mega-menu").slideToggle(500);
		});

		//Menu Toggle Btn
		$(".mobile-nav-toggler").on("click", function () {
			$("body").addClass("mobile-menu-visible");
		});

		//Menu Toggle Btn
		$(".mobile-menu .menu-backdrop, .mobile-menu .close-btn").on(
			"click",
			function () {
				$("body").removeClass("mobile-menu-visible");
			}
		);
	}

	//Header Search
	if ($(".search-btn").length) {
		$(".search-btn").on("click", function () {
			$(".main-header").addClass("moblie-search-active");
		});
		$(".close-search, .search-back-drop").on("click", function () {
			$(".main-header").removeClass("moblie-search-active");
		});
	}

	///////////////////////////////////////////////////
	//  scroll-to-target 
	windowOn.on('scroll', function () {
		var scroll = windowOn.scrollTop();
		if (scroll < 500) {
			$('.scroll-to-target').removeClass('open');

		} else {
			$('.scroll-to-target').addClass('open');
		}
	});

	///////////////////////////////////////////////////
	//  Scroll Up Js
	if ($('.scroll-to-target').length) {
		$(".scroll-to-target").on('click', function () {
			var target = $(this).attr('data-target');
			// animate
			$('html, body').animate({
				scrollTop: $(target).offset().top
			}, 1000);

		});
	}


	///////////////////////////////////////////////////
	//  Content Sticky Area
	// (function($) {
	// 	var scroll_childs = $('.scroll-to-fixed-child');

	// 	for (var i = 0, length = scroll_childs.length; i < length; i++) {
	// 		var scroll_child = $(scroll_childs[i]);

	// 		scroll_child.scrollToFixed({
	// 			marginTop: $('header').outerHeight(true) + 10,
	// 			zIndex: 2,
	// 			spacerClass: 'd-none',
	// 			removeOffsets: true,
	// 			limit: function() {
	// 				var parent = this.parents('.scroll-to-fixed-parent');
	// 				return parent.offset().top + parent.outerHeight(true) - this.outerHeight(true) - 20;

	// 			}
	// 		});
	// 	}
	// })(window.jQuery);


	// Data CSS Js
	$("[data-background").each(function () {
		$(this).css("background-image", "url( " + $(this).attr("data-background") + "  )");
	});

	$("[data-width]").each(function () {
		$(this).css("width", $(this).attr("data-width"));
	});

	$("[data-bg-color]").each(function () {
		$(this).css("background-color", $(this).attr("data-bg-color"));
	});

	////////////////////////////////////////////////////
	//  magnificPopup Js
	$('.popup-image').magnificPopup({
		type: 'image',
		gallery: {
			enabled: true
		}
	});

	////////////////////////////////////////////////////
	//  MagnificPopup video view Js
	$(".popup-video").magnificPopup({
		type: "iframe",
	});

	// header sticky Js
	// windowOn.on('scroll', function () {
	// 	var scroll = windowOn.scrollTop();
	// 	if (scroll < 400) {
	// 		$("#header-sticky").removeClass("header-sticky");
	// 	} else {
	// 		$("#header-sticky").addClass("header-sticky");
	// 	}
	// });

	// if ($('.it-header-height').length > 0) {
	// 	var headerHeight = document.querySelector(".it-header-height");
	// 	var setHeaderHeight = headerHeight.offsetHeight;
	// 	$(".it-header-height").each(function () {
	// 		$(this).css({
	// 			'height': setHeaderHeight + 'px'
	// 		});
	// 	});

	// 	$(".it-header-height .header-sticky").each(function () {
	// 		$(this).css({
	// 			'height': inherit,
	// 		});
	// 	});
	// }

	$('.project-section-four .project-block-four').hover(function() {
		$(this).siblings('.project-block-four').removeClass('active'), $(this).addClass('active')
	})

	var $swiper_container = $('.testimonial-slider-four');
	if( $swiper_container.length > 0 ) {
		$swiper_container.each(function () {
			var this_item = $(this);
			var swiper = new Swiper( this_item.find('.swiper-container-inner')[0], {
				slidesPerView:  3,
				spaceBetween:   30,
				loop: true,
				speed: ((this_item.attr('data-speed')) ? this_item.data('speed') : 300),
				freeMode: ((this_item.attr('data-freemod')) ? this_item.data('freemod') : false),
				autoplay: {
					delay: ((this_item.attr('data-delay')) ? this_item.data('delay') : 3000),
					reverseDirection: ((this_item.attr('data-reversedir')) ? this_item.data('reversedir') : false),
				},
				navigation: {
					nextEl: '.testimonial-arry-next',
					prevEl: '.testimonial-arry-prev',
				},
				breakpoints: {
					320: {
						slidesPerView: 1,
					},
					576: {
						slidesPerView: 1,
					},
					768: {
						slidesPerView: 2,
					},
					992: {
						slidesPerView: 3,
					},
					1200: {
						slidesPerView: 3,
					},
				},
			});
		});
	}

	
	////////////////////////////////////////////////////
	//  Counter Js
	if ($(".purecounter").length) {
		new PureCounter({
			filesizing: true,
			selector: ".filesizecount",
			pulse: 2,
		});
		new PureCounter();
	}

	//  Nice Select Js
	$('select').niceSelect();

	// data-mask Js
	if ($('[data-mask-src]').length > 0) {
		$('[data-mask-src]').each(function () {
			var mask = $(this).attr('data-mask-src');
			$(this).css({
				'mask-image': 'url(' + mask + ')',
				'-webkit-mask-image': 'url(' + mask + ')'
			});
			$(this).removeAttr('data-mask-src');
		});
	};

	if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
	// smooth scroll Js
	gsap.registerPlugin(ScrollTrigger, ScrollSmoother, ScrollToPlugin);
	if ($('#smooth-wrapper').length && $('#smooth-content').length) {
		gsap.config({
			nullTargetWarn: false,
		});
		let smoother = ScrollSmoother.create({
			smooth: 1,
			effects: true,
			smoothTouch: 0.1,
			normalizeScroll: false,
			ignoreMobileResize: true,
		});
	}

	// project panel
	let tls = gsap.timeline();
	const project_panel = gsap.matchMedia();
	project_panel.add("(min-width: 767px)", () => {
		let otherSections = document.querySelectorAll('.ks-project-panel')
		otherSections.forEach((section, index) => {
			gsap.set(otherSections, {
				scale: 1,
			});
			tls.to(section, {
				scale: 1,
				scrollTrigger: {
					trigger: section,
					pin: section,
					scrub: 1,
					start: 'top auto',
					end: "bottom 855px",
					endTrigger: '.ks-project-area',
					pinSpacing: false,
					markers: false,
				},
			})
		})
	});

	// project panel 2
	let t2 = gsap.timeline();
	const project_panel2 = gsap.matchMedia();
	project_panel2.add("(min-width: 767px)", () => {
		let otherSections = document.querySelectorAll('.ks-project-panel2')
		otherSections.forEach((section, index) => {
			gsap.set(otherSections, {
				scale: 1,
			});
			t2.to(section, {
				scale: 1,
				scrollTrigger: {
					trigger: section,
					pin: section,
					scrub: 1,
					start: 'top 100px',
					end: "bottom 780px",
					endTrigger: '.project-section-two',
					pinSpacing: false,
					markers: false,
				},
			})
		})
	});

	// project panel 2
	let ts = gsap.timeline();
	const project_panel2s = gsap.matchMedia();
	project_panel2s.add("(min-width: 991px)", () => {
		let otherSections = document.querySelectorAll('.ks-project-title-hm3')
		otherSections.forEach((section, index) => {
			gsap.set(otherSections, {
				scale: 1,
			});
			ts.to(section, {
				scale: 1,
				scrollTrigger: {
					trigger: section,
					pin: section,
					scrub: 1,
					start: 'top 100px',
					end: "bottom 780px",
					endTrigger: '.project-section-two',
					pinSpacing: false,
					markers: false,
				},
			})
		})
	});

	// Pricing panel 2
	let ts1 = gsap.timeline();
	const pricing_panels = gsap.matchMedia();
	pricing_panels.add("(min-width: 991px)", () => {
		let otherSections = document.querySelectorAll('.ks-pricing-panel')
		otherSections.forEach((section, index) => {
			gsap.set(otherSections, {
				scale: 1,
			});
			ts1.to(section, {
				scale: 1,
				scrollTrigger: {
					trigger: section,
					pin: section,
					scrub: 1,
					start: 'top auto',
					end: "bottom 85%",
					endTrigger: '.pricing-section-two',
					pinSpacing: false,
					markers: false,
				},
			})
		})
	});

	// project panel
	let testi_panel = gsap.matchMedia();
	testi_panel.add("(min-width: 992px)", () => {
		let tl = gsap.timeline();
		let testi_panel = document.querySelectorAll('.ks-testi-panel');
		let baseOffset = 0;
		let offsetIncrement = 80;

		testi_panel.forEach((section, index) => {
			let topOffset = baseOffset + (index * offsetIncrement);
			tl.to(section, {
				scrollTrigger: {
					trigger: section,
					pin: section,
					scrub: 1,
					start: `top ${topOffset}px`,
					end: "bottom 90%",
					endTrigger: '.ks-testimonial-2-area',
					pinSpacing: false,
					markers: false,
				},
			});
		});
	});

	// project panel
	let srvc_panel = gsap.matchMedia();
	srvc_panel.add("(min-width: 992px)", () => {
		let tl = gsap.timeline();
		let srvc_panel = document.querySelectorAll('.ks-srvc-panel');
		let baseOffset = 0;
		let offsetIncrement = 80;

		srvc_panel.forEach((section, index) => {
			let topOffset = baseOffset + (index * offsetIncrement);
			tl.to(section, {
				scrollTrigger: {
					trigger: section,
					pin: section,
					scrub: 1,
					start: `top ${topOffset}px`,
					end: "bottom 97%",
					endTrigger: '.services-section-seven',
					pinSpacing: false,
					markers: false,
				},
			});
		});
	});

	////fade-class-active
	if ($(".ks_fade_anim").length > 0) {
		gsap.utils.toArray(".ks_fade_anim").forEach((item) => {
			let ks_fade_offset = item.getAttribute("data-fade-offset") || 40,
			ks_duration_value = item.getAttribute("data-duration") || 0.75,
			ks_fade_direction = item.getAttribute("data-fade-from") || "bottom",
			ks_onscroll_value = item.getAttribute("data-on-scroll") || 1,
			ks_delay_value = item.getAttribute("data-delay") || 0.15,
			ks_ease_value = item.getAttribute("data-ease") || "power2.out",
			ks_anim_setting = {
				opacity: 0,
				ease: ks_ease_value,
				duration: ks_duration_value,
				delay: ks_delay_value,
				x: (ks_fade_direction == "left" ? -ks_fade_offset : (ks_fade_direction == "right" ? ks_fade_offset : 0)),
				y: (ks_fade_direction == "top" ? -ks_fade_offset : (ks_fade_direction == "bottom" ? ks_fade_offset : 0)),
			};
			if (ks_onscroll_value == 1) {
				ks_anim_setting.scrollTrigger = {
					trigger: item,
					start: 'top 85%',
				};
			}
			gsap.from(item, ks_anim_setting);
		});
	}

	// split text animation
	if ($('.split-text').length > 0) {
		var st = $(".split-text");
		if(st.length == 0) return;
		gsap.registerPlugin(SplitText);
		st.each(function(index, el) {
			el.split = new SplitText(el, {
				type: "lines,words,chars",
				linesClass: "split-line"
			});
			gsap.set(el, { perspective: 400 });

			if( $(el).hasClass('split-in-right') ){
				gsap.set(el.split.chars, {
					opacity: 0,
					x: "50",
					ease: "Back.easeOut",
				});
			}
			if( $(el).hasClass('split-in-left') ){
				gsap.set(el.split.chars, {
					opacity: 0,
					x: "-50",
					ease: "circ.out",
				});
			}
			el.anim = gsap.to(el.split.chars, {
				scrollTrigger: {
					trigger: el,
					start: "top 90%",
				},
				x: "0",
				y: "0",
				rotateX: "0",
				scale: 1,
				opacity: 1,
				duration: 0.4,
				stagger: 0.02,
			});
		});	
	}

	// Project Content Active
	if($('.service-block-five .inner-box').length) {
		$('.service-block-five .inner-box').on('click', function() {
			$('.inner-box').removeClass('active');
			$('.service-block-five .content-box').slideUp().removeClass('active');
			$(this).addClass('active');
			$(this).find('.content-box').slideDown().addClass('active');
		});
	}

	//Accordion Box
	if ($('.accordion-box').length) {
		$(".accordion-box").on('click', '.acc-btn', function () {

			var outerBox = $(this).parents('.accordion-box');
			var target = $(this).parents('.accordion');

			if ($(this).hasClass('active') !== true) {
				$(outerBox).find('.accordion .acc-btn').removeClass('active ');
			}

			if ($(this).next('.acc-content').is(':visible')) {
				return false;
			} else {
				$(this).addClass('active');
				$(outerBox).children('.accordion').removeClass('active-block');
				$(outerBox).find('.accordion').children('.acc-content').slideUp(300);
				target.addClass('active-block');
				$(this).next('.acc-content').slideDown(300);
			}
		});
	}

  $(".quantity-box .add").on("click", function () {
    if ($(this).prev().val() < 999) {
      $(this)
        .prev()
        .val(+$(this).prev().val() + 1);
    }
  });
  $(".quantity-box .sub").on("click", function () {
    if ($(this).next().val() > 1) {
      if ($(this).next().val() > 1)
        $(this)
        .next()
        .val(+$(this).next().val() - 1);
    }
  });

	//Price Range Slider
	if($('.price-range-slider').length){
		$( ".price-range-slider" ).slider({
			range: true,
			min: 10,
			max: 99,
			values: [ 10, 60 ],
			slide: function( event, ui ) {
			$( "input.property-amount" ).val( ui.values[ 0 ] + " - " + ui.values[ 1 ] );
			}
		});
		
		$( "input.property-amount" ).val( $( ".price-range-slider" ).slider( "values", 0 ) + " - $" + $( ".price-range-slider" ).slider( "values", 1 ) );	
	}

	//Gallery Filters
	if($('.filter-list').length){
		$('.filter-list').mixItUp({});
	}

	if ($('.product-details .bxslider').length) {
		$('.product-details .bxslider').bxSlider({
			nextSelector: '.product-details #slider-next',
			prevSelector: '.product-details #slider-prev',
			nextText: '<i class="fa fa-angle-right"></i>',
			prevText: '<i class="fa fa-angle-left"></i>',
			mode: 'fade',
			auto: 'true',
			speed: '700',
			pagerCustom: '.product-details .slider-pager .thumb-box'
		});
	};

	//Tabs Box
	if ($('.tabs-box').length) {
		$('.tabs-box .tab-buttons .tab-btn').on('click', function (e) {
			e.preventDefault();
			var target = $($(this).attr('data-tab'));

			if ($(target).is(':visible')) {
				return false;
			} else {
				target.parents('.tabs-box').find('.tab-buttons').find('.tab-btn').removeClass('active-btn');
				$(this).addClass('active-btn');
				target.parents('.tabs-box').find('.tabs-content').find('.tab').fadeOut(0);
				target.parents('.tabs-box').find('.tabs-content').find('.tab').removeClass('active-tab animated fadeIn');
				$(target).fadeIn(300);
				$(target).addClass('active-tab animated fadeIn');
			}
		});
	}

	// count Bar
	if ($(".count-bar").length) {
		$(".count-bar").appear(
			function () {
					var el = $(this);
					var percent = el.data("percent");
					$(el).css("width", percent).addClass("counted");
				}, {
					accY: -50
			}
		);
	}


	
	//Progress Bar
	if ($('.progress-line').length) {
		$('.progress-line').appear(function () {
			var el = $(this);
			var percent = el.data('width');
			$(el).css('width', percent + '%');
		}, { accY: 0 });
	}

	/* ---------------------------------------------------------------------- */
	/* ----------- Activate Menu Item on Reaching Different Sections ---------- */
	/* ---------------------------------------------------------------------- */
	// Make sure GSAP and ScrollToPlugin are loaded before this script
	gsap.registerPlugin(ScrollToPlugin);

	var $onepage_nav = $(".onepage-nav");
	var $sections = $("section");
	var $window = $(window);

	// Smooth scrolling on menu click
	$onepage_nav.find("a").on("click", function (e) {
	    e.preventDefault(); // stop instant anchor jump

	    var target = $(this).attr("href"); // e.g. "#about"
	    var navHeight = $onepage_nav.outerHeight();

	    // GSAP smooth scroll
	    gsap.to(window, {
	        duration: 1,
	        scrollTo: {
	            y: target,
	            offsetY: navHeight + 80
	        },
	        ease: "power2.out"
	    });
	});

	// Menu active state on scroll
	function TM_activateMenuItemOnReach() {
    if ($onepage_nav.length > 0) {
        var cur_pos = $window.scrollTop() + 2;
        var nav_height = $onepage_nav.outerHeight();

        $sections.each(function () {
            var $this = $(this);
            var top = $this.offset().top - nav_height - 80;
            var bottom = top + $this.outerHeight();

            if (cur_pos >= top && cur_pos <= bottom) {
                $onepage_nav.find("a").parent().removeClass("current active");
                $sections.removeClass("current active");

                $onepage_nav
                    .find('a[href="#' + $this.attr("id") + '"]')
                    .parent()
                    .addClass("current active");
            }

            if (cur_pos <= nav_height && cur_pos >= 0) {
                $onepage_nav.find("a").parent().removeClass("current active");
                $onepage_nav
                    .find('a[href="#header"]')
                    .parent()
                    .addClass("current active");
            }
        });
    }
	}

	}

	/* ==========================================================================
   When document is Scrollig, do
   ========================================================================== */

	$(window).on("scroll", function () {
		headerStyle();
		if (typeof TM_activateMenuItemOnReach === "function") {
			TM_activateMenuItemOnReach();
		}
	});

})(window.jQuery);


