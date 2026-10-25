var THEMEMASCOT = {};
(function($) {
	"use strict";

	////////////////////////////////////////////////////
	// 01. Swiper Js
	var brandslider = new Swiper(".ks-brand-active", {
		loop: true,
		freemode: true,
		slidesPerView: 'auto',
		spaceBetween: 85,
		centeredSlides: true,
		allowTouchMove: false,
		speed: 2500,
		autoplay: {
			delay: 1,
			disableOnInteraction: true,
		},
	});

	////////////////////////////////////////////////////
	// 01.1. Swiper Js
	var brandslider2 = new Swiper(".ks-brand-two-active", {
		loop: true,
		freemode: true,
		slidesPerView: 5,
		spaceBetween: 25,
		centeredSlides: true,
		allowTouchMove: false,
		speed: 2500,
		autoplay: {
			delay: 1,
			disableOnInteraction: true,
		},
	});

	////////////////////////////////////////////////////
	// 02. Swiper Js
	var textslide = new Swiper(".ks-text-slide-active", {
		loop: true,
		freemode: true,
		slidesPerView: 'auto',
		spaceBetween: 30,
		centeredSlides: true,
		allowTouchMove: false,
		speed: 10000,
		autoplay: {
		  delay: 1,
		  disableOnInteraction: true,
		},
	  });


	var testi_author = new Swiper(".ks-testi-author-active", {
		loop: true,
		speed: 1200,
		spaceBetween: 0,
		slidesPerView: 1,
		freeMode: true,
		watchSlidesProgress: true,
    });

    var testi_content = new Swiper(".ks-testimonial-active", {
      loop: true,
			speed: 1200,
			spaceBetween: 0,
			slidesPerView: 1,
			centeredSlides: true,
			autoplay: {
			  delay: 2000,
			  disableOnInteraction: true,
			},
			navigation: {
				prevEl: '.arrow-prev',
				nextEl: '.arrow-next',
			},
			pagination: {
				el: ".testi-swiper-pagination",
				type: "progressbar"
			},
				
			thumbs: {
				swiper: testi_author,
			},
    });
	
	////////////////////////////////////////////////////
	//03  Swiper Js
	var projectswiper = new Swiper('.ks-project-2-active', {
		speed: 1500,
		loop: true,
		slidesPerView: 4,
		spaceBetween: 30,
		autoplay: false,
		breakpoints: {
			'1400': {
				slidesPerView: 4,
			},
			'1200': {
				slidesPerView: 3,
			},
			'992': {
				slidesPerView: 3,
			},
			'768': {
				slidesPerView: 2,
			},
			'576': {
				slidesPerView: 1,
			},
			'0': {
				slidesPerView: 1,
			},
		},	

	});
	
	////////////////////////////////////////////////////
	//03  Swiper Js
	var projectswiper = new Swiper('.two-grid-slider', {
		speed: 1500,
		loop: true,
		slidesPerView: 2,
		spaceBetween: 30,
		autoplay: false,
		breakpoints: {
			'1400': {
				slidesPerView: 2,
			},
			'1200': {
				slidesPerView: 2,
			},
			'992': {
				slidesPerView: 2,
			},
			'768': {
				slidesPerView: 1,
			},
			'576': {
				slidesPerView: 1,
			},
			'0': {
				slidesPerView: 1,
			},
		},	

	});

	////////////////////////////////////////////////////
	//03  Swiper Js
	var slider_1 = new Swiper('.ks-slider-active', {
		speed: 1000,
		loop: true,
		slidesPerView: 1,
		spaceBetween: 30,
		autoplay: {
		  delay: 2000,
		  disableOnInteraction: true,
		},
		navigation: {
			prevEl: '.arrow-prev',
			nextEl: '.arrow-next',
		},
		pagination: {
			el: ".swiper-pagination",
			type: "progressbar"
		},

	});

	// Testimonial
	var testiOne_thumbs = new Swiper(".testimonial-slider-thumbs", {
    loop: true,
		speed: 1200,
    spaceBetween: 0,
    slidesPerView: 1,
    freeMode: true,
		effect: "fade",
    watchSlidesProgress: true,
  });

  var team_slider = new Swiper(".testimonial-slider-content", {
    loop: true,
		speed: 1200,
    spaceBetween: 0,
		centeredSlides: true,
		navigation: {
      nextEl: ".swiper-button-next",
      prevEl: ".swiper-button-prev",
    },
		
    thumbs: {
      swiper: testiOne_thumbs,
    },
  });

  //testimonial-carousel One
	var swiper = new Swiper(".testimonial-swiper-two", {
		slidesPerView: 1.275,
		spaceBetween: 30,
		loop: true,
		speed: 1000,
		freeMode: true,
		navigation: {
			nextEl: ".testimonial-arry-next",
			prevEl: ".testimonial-arry-prev",
		},
		breakpoints: {
			'1200': {
				slidesPerView: 1.275,
			},
			'0': {
				slidesPerView: 1,
			},
		},
	});


})(window.jQuery);


