/*
	Portfolio motion enhancements
	Uses Intersection Observer + CSS (no extra dependencies)
*/

(function() {
	'use strict';

	var LOAD_STEP_MS = 130;
	var SCROLL_STEP_MS = 120;
	var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

	var scrollRevealObserverOptions = {
		threshold: 0.12,
		rootMargin: '0px 0px -6% 0px'
	};

	document.documentElement.classList.add('js-animations-pending');

	/* Above-the-fold order: headshot → hero heading → rest of page flow */
	var loadSequenceSelectors = [
		'#header .image.avatar',
		'#one header.major h2',
		'#header h1',
		'#header > .inner > p',
		'#one > p',
		'#one .actions',
		'.get-in-touch-btn',
		'#footer .icons',
		'#footer .copyright'
	];

	if (prefersReducedMotion) {
		document.documentElement.classList.add('reduce-motion');
		document.documentElement.classList.remove('js-animations-pending');
		revealAllImmediately();
		return;
	}

	function revealAllImmediately() {
		document.querySelectorAll('.section-reveal, .reveal-fade-up').forEach(function(el) {
			el.classList.add('is-revealed');
		});
	}

	function getSectionRevealItems(section) {
		var items = [];

		if (section.id === 'three') {
			var h2 = section.querySelector(':scope > h2');
			var intro = section.querySelector(':scope > p');
			var formCol = section.querySelector('.col-8');
			var infoCol = section.querySelector('.col-4');

			[h2, intro, formCol, infoCol].forEach(function(el) {
				if (el) {
					items.push(el);
				}
			});

			return items;
		}

		section.querySelectorAll(':scope > h2, :scope > p, :scope > .row').forEach(function(el) {
			items.push(el);
		});

		return items;
	}

	function revealItemsInOrder(items, stepMs) {
		items.forEach(function(el, index) {
			if (!el) {
				return;
			}

			el.classList.add('reveal-fade-up');

			window.setTimeout(function() {
				el.classList.add('is-revealed');
			}, index * stepMs);
		});
	}

	function observeScrollReveal(el) {
		if (!el) {
			return;
		}

		el.classList.add('reveal-fade-up');

		if (!('IntersectionObserver' in window)) {
			el.classList.add('is-revealed');
			return;
		}

		var observer = new IntersectionObserver(function(entries) {
			entries.forEach(function(entry) {
				if (!entry.isIntersecting || entry.target.dataset.revealed === 'true') {
					return;
				}

				entry.target.dataset.revealed = 'true';
				entry.target.classList.add('is-revealed');
				observer.unobserve(entry.target);
			});
		}, scrollRevealObserverOptions);

		observer.observe(el);
	}

	function initRecentWorkReveal() {
		var section = document.querySelector('#two');

		if (!section) {
			return;
		}

		var heading = section.querySelector(':scope > h2');
		var projects = Array.prototype.slice.call(section.querySelectorAll('.work-item'));

		observeScrollReveal(heading);

		projects.forEach(function(project) {
			observeScrollReveal(project);
		});
	}

	function initLoadSequence() {
		var items = loadSequenceSelectors
			.map(function(selector) {
				return document.querySelector(selector);
			})
			.filter(function(el) {
				return Boolean(el);
			});

		items.forEach(function(el, index) {
			el.classList.add('hero-enter');
			el.style.animationDelay = (index * (LOAD_STEP_MS / 1000)) + 's';
		});
	}

	function initScrollReveal() {
		var sections = document.querySelectorAll('#main > section:not(#one):not(#two)');

		sections.forEach(function(section) {
			section.classList.add('section-reveal');

			getSectionRevealItems(section).forEach(function(item) {
				item.classList.add('reveal-fade-up');
			});
		});

		if (!('IntersectionObserver' in window)) {
			revealAllImmediately();
			initRecentWorkReveal();
			return;
		}

		var observer = new IntersectionObserver(function(entries) {
			entries.forEach(function(entry) {
				if (!entry.isIntersecting || entry.target.dataset.revealed === 'true') {
					return;
				}

				var section = entry.target;
				section.dataset.revealed = 'true';
				section.classList.add('is-revealed');

				revealItemsInOrder(getSectionRevealItems(section), SCROLL_STEP_MS);
				observer.unobserve(section);
			});
		}, scrollRevealObserverOptions);

		sections.forEach(function(section) {
			observer.observe(section);
		});

		initRecentWorkReveal();
	}

	function initSmoothAnchorScroll() {
		document.querySelectorAll('a[href^="#"]').forEach(function(anchor) {
			anchor.addEventListener('click', function(event) {
				var hash = anchor.getAttribute('href');

				if (!hash || hash.length < 2) {
					return;
				}

				var target = document.querySelector(hash);

				if (!target) {
					return;
				}

				event.preventDefault();
				target.scrollIntoView({ behavior: 'smooth', block: 'start' });
			});
		});
	}

	function init() {
		initLoadSequence();
		initScrollReveal();
		initSmoothAnchorScroll();
	}

	window.addEventListener('load', function() {
		window.setTimeout(function() {
			document.documentElement.classList.remove('js-animations-pending');
			init();
		}, 130);
	});
})();
