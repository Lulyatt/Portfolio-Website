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
		'#one .section-kicker',
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
		initTextRotators(true);
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
			var kicker = section.querySelector(':scope > .section-kicker');
			var h2 = section.querySelector(':scope > h2');
			var intro = section.querySelector(':scope > p:not(.section-kicker)');
			var formCol = section.querySelector('.col-8');
			var infoCol = section.querySelector('.col-4');

			[kicker, h2, intro, formCol, infoCol].forEach(function(el) {
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

		var kicker = section.querySelector(':scope > .section-kicker');
		var heading = section.querySelector(':scope > h2');
		var projects = Array.prototype.slice.call(section.querySelectorAll('.work-item'));

		observeScrollReveal(kicker);
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
		var sections = document.querySelectorAll('#main > section:not(#one):not(#two):not(#stack)');

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
		initTextRotators(false);
	}

	function initTextRotators(reducedMotion) {
		document.querySelectorAll('.text-rotator').forEach(function(root) {
			createTextRotator(root, reducedMotion);
		});
	}

	function createTextRotator(root, reducedMotion) {
		var windowEl = root.querySelector('.text-rotator__window');
		var raw = root.getAttribute('data-phrases') || '';
		var phrases = raw.split('|').map(function(phrase) {
			return phrase.trim();
		}).filter(Boolean);

		if (!windowEl || phrases.length === 0) {
			return;
		}

		var index = 0;
		var timerId = 0;
		var holdMs = 3200;
		var rotating = false;

		function currentPhrase() {
			return windowEl.querySelector('.text-rotator__phrase.is-active') || windowEl.querySelector('.text-rotator__phrase');
		}

		function showOnly(text) {
			rotating = false;
			windowEl.textContent = '';

			var phrase = document.createElement('span');
			phrase.className = 'text-rotator__phrase is-active';
			phrase.textContent = text;
			windowEl.appendChild(phrase);
		}

		function fit() {
			var phrase = currentPhrase();

			if (!phrase) {
				return;
			}

			var activeText = phrases[index];
			var main = document.querySelector('#main');
			var mainStyle = main ? window.getComputedStyle(main) : null;
			var available = main
				? main.clientWidth - parseFloat(mainStyle.paddingLeft) - parseFloat(mainStyle.paddingRight)
				: root.parentElement.clientWidth;
			var widest = 0;
			var maxHeight = 0;

			root.classList.remove('is-wrapped');
			phrase.style.whiteSpace = 'nowrap';
			phrases.forEach(function(text) {
				phrase.textContent = text;
				widest = Math.max(widest, phrase.scrollWidth);
			});

			if (widest > available) {
				root.classList.add('is-wrapped');
				phrase.style.whiteSpace = '';
				windowEl.style.width = '100%';
			} else {
				phrase.style.whiteSpace = '';
				windowEl.style.width = widest + 'px';
			}

			phrases.forEach(function(text) {
				phrase.textContent = text;
				maxHeight = Math.max(maxHeight, phrase.offsetHeight);
			});

			phrase.textContent = activeText;
			windowEl.style.height = maxHeight + 'px';
		}

		function advance() {
			if (document.hidden || rotating) {
				return;
			}

			var current = currentPhrase();

			if (!current) {
				return;
			}

			rotating = true;
			index = (index + 1) % phrases.length;

			var next = document.createElement('span');
			next.className = 'text-rotator__phrase';
			next.textContent = phrases[index];
			windowEl.appendChild(next);

			window.requestAnimationFrame(function() {
				window.requestAnimationFrame(function() {
					if (!current.parentNode) {
						return;
					}

					current.classList.remove('is-active');
					current.classList.add('is-leaving');
					next.classList.add('is-active');
				});
			});

			var finished = false;

			function cleanup() {
				if (finished) {
					return;
				}

				finished = true;
				rotating = false;

				if (current.parentNode) {
					current.parentNode.removeChild(current);
				}
			}

			current.addEventListener('transitionend', function onDone(event) {
				if (event.propertyName !== 'transform') {
					return;
				}

				current.removeEventListener('transitionend', onDone);
				cleanup();
			});

			window.setTimeout(cleanup, 900);
		}

		function start() {
			if (timerId || reducedMotion || phrases.length < 2) {
				return;
			}

			timerId = window.setInterval(advance, holdMs);
		}

		function stop() {
			window.clearInterval(timerId);
			timerId = 0;
			showOnly(phrases[index]);
		}

		fit();
		window.addEventListener('resize', fit);

		if (document.fonts && document.fonts.ready) {
			document.fonts.ready.then(fit);
		}

		if (reducedMotion || phrases.length < 2) {
			return;
		}

		document.addEventListener('visibilitychange', function() {
			if (document.hidden) {
				stop();
				return;
			}

			fit();
			start();
		});

		start();
	}

	window.addEventListener('load', function() {
		window.setTimeout(function() {
			document.documentElement.classList.remove('js-animations-pending');
			init();
		}, 130);
	});
})();
