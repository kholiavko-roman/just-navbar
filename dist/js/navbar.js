(function () {
	'use strict';

	// Global vars
	var win = window,
			doc = document,
			isTouch = 'ontouchstart' in win,
			scrn = {
				getWidth: function () {
					return Math.min(win.innerWidth || Infinity, screen.width);
				},
				getHeight: function () {
					return Math.min(win.innerHeight || Infinity, screen.height);
				}
			},
			operateWithClass = function (el, action, currentClass) {
				var i;

				for (i = 0; i < el.length; i++) {
					var item = el[i],
							j;

					// if node list contains more then one elements
					if (item.length > 1) {
						for (j = 0; j < item.length; j++) {
							changeClass(item[j]);
						}
					} else {
						// if single item
						changeClass(item);
					}

				}

				function changeClass(item) {
					if (action === 'toggle') {
						item.classList.toggle(currentClass);
					} else if (action === 'add') {
						item.classList.add(currentClass);
					} else {
						item.classList.remove(currentClass);
					}
				}
			},
			/**
			 * Siblings
			 * @desc get all siblings of element
			 * @return [Array] of siblings elements
			 **/
			siblings = function (node) {
				// convert NodeList to array
				return [].slice.call(node.parentNode.children)
						// filter current element
						.filter(function (elem) {
							return elem !== node
						});
			},
			/**
			 * Extend
			 * @desc extend all methods and prop form source object to target
			 **/
			extend = function (target, source) {
				for (var prop in source) {
					if (typeof source[prop] === 'object') {
						target[prop] = extend(target[prop], source[prop]);
					} else {
						target[prop] = source[prop];
					}
				}

				return target;
			},
			checkForIgnores = function (el) {
				while (el.parentNode) {
					if (el.dataset.navSwipeIgnore !== undefined) {
						return el;
					}
					el = el.parentNode;
				}
				return null;
			},
			body = doc.querySelector('body');

	/**
	 * Creates a JustNavbar.
	 * @class JustNavbar.
	 * @public
	 * @param {HTMLElement} element - Css selector of element.
	 * @param {Object} options - The options
	 * */
	var JustNavbar = function (el, options) {
		var ctx = this;
		ctx.toggleGroup = [];
		ctx.currentToggle = null;

		// Merge def opt and opt in parameters
		ctx.options = extend(ctx._Defaults, options);

		ctx.element = document.querySelector(el);
		ctx.currentLayout = ctx.options.layout;
		ctx.isStuck = false;
		ctx.mobileNavWrap = ctx.element.querySelector('.navbar-mobile-menu-wrap');
		ctx.hideBtnEl = ctx.element.querySelector('.navbar-close-mobile-menu');
		ctx.mobileNavWrapWidth = ctx.mobileNavWrap.offsetWidth;
		ctx.isMenuOpen = false;
		ctx.isMeuOpening = false;
		ctx.swipeMenuOrientation = ctx.options.swipeMenuDirection === 'left' ? -1 : 1;
		ctx.currentAnchorItem = null;

		ctx.closeMobileNav = ctx.closeMobileNav.bind(ctx);

		ctx._init(ctx);
	}

	/**
	 * Default plugin options
	 * @protected
	 **/
	JustNavbar.prototype._Defaults = {
		navClass: 'navbar-nav',
		stickUp: true,
		anchorNav: false,
		focusOnHoverTimeout: 700,
		startSwipeWidth: 10,
		swipeMenuDirection: 'left',
		swipeTransition: '100ms cubic-bezier(.23,.59,.86,.57)',
		swipeMenuToggle: doc.querySelector('[data-swipe-toggle]'),
		responsive: {
			xs: {
				alias: 'xs',
				size: 0,
				layout: 'navbar-device',
				deviceLayout: 'navbar-device',
				focusOnHover: false,
				swipeDeviceMenu: false,
				stickUp: false
			},
			sm: {
				alias: 'sm',
				size: 768,
				layout: 'navbar-sm',
				deviceLayout: 'navbar-device',
				focusOnHover: true,
				swipeDeviceMenu: false,
				stickUp: false
			},
			md: {
				alias: 'md',
				size: 992,
				layout: 'navbar-md',
				deviceLayout: 'navbar-device',
				focusOnHover: true,
				swipeDeviceMenu: false,
				stickUp: true
			},
			lg: {
				alias: 'lg',
				size: 1200,
				layout: 'navbar-lg',
				deviceLayout: 'navbar-lg',
				focusOnHover: true,
				swipeDeviceMenu: false,
				stickUp: true
			}
		},
	}

	/**
	 * Init
	 * @protected
	 **/
	JustNavbar.prototype._init = function (ctx) {
		var currentRespWidth = ctx._getRespSize(ctx);

		// Set data api for navbar, and set options if exist data attr
		ctx._setDataApi(ctx);

		// Init navigation
		ctx._initNav(ctx);

		// Apply handlers
		ctx._applyHandlers(ctx);

		// Set active layout
		// get current layout and pass it to switchNav layout
		ctx._switchNavLayout(ctx, ctx._getLayout(ctx, currentRespWidth['alias']));

		// Set active anchor nav if
		if (ctx.options.anchorNav) {
			ctx._activateAnchorNav(ctx);
		}
	}

	/**
	 * Get options by name
	 * @desc return options value by name
	 * @protected
	 **/
	JustNavbar.prototype._getOption = function (ctx, optName) {
		return ctx._getRespSize(ctx)[optName];
	}

	/**
	 * Get layout
	 * @desc Get needed layout
	 * @protected
	 **/
	JustNavbar.prototype._getLayout = function (ctx, alias) {
		return ctx.options.responsive[alias][isTouch ? 'deviceLayout' : 'layout'];
	}

	/**
	 * Data api
	 * @desc Set data api
	 * @protected
	 **/
	JustNavbar.prototype._setDataApi = function (ctx) {
		var apiOptName = [
					{
						attrName: 'layout',
						objName: 'layout'
					},
					{
						attrName: 'device-layout',
						objName: 'deviceLayout'
					},
					{
						attrName: 'focus-on-hover',
						objName: 'focusOnHover'
					},
					{
						attrName: 'stick-up',
						objName: 'stickUp'
					},
					{
						attrName: 'stick-up-offset',
						objName: 'stickUpOffset'
					},
					{
						attrName: 'menu-swipe',
						objName: 'swipeDeviceMenu'
					}
				],
				currAlias,
				i;

		for (currAlias in ctx.options.responsive) {
			for (i = 0; i < apiOptName.length; i++) {
				var currentRespObj = ctx.options.responsive[currAlias],
						tmpAttr = ctx.element.getAttribute('data-' + currentRespObj.alias + '-' + apiOptName[i].attrName);

				if (tmpAttr) {
					currentRespObj[apiOptName[i].objName] = tmpAttr === "true" ? true : tmpAttr === "false" ? false : tmpAttr;
				}
			}
		}

		ctx.options.anchorNav = ctx.element.getAttribute('data-anchor') || false;
	}

	/**
	 * initNav
	 * @desc add sub-menu class and sub-menu toggle
	 * @protected
	 **/
	JustNavbar.prototype._initNav = function (ctx) {
		var nav = ctx.element.querySelector('[data-nav]'),
				submenu = nav.querySelectorAll('[data-nav-submenu]'),
				i;

		// Add class to nav element which has sub-menu
		for (i = 0; i < submenu.length; i++) {
			var submenuItem = submenu[i],
					submenuParent = submenuItem.parentNode;

			// Insert submenu toggle into link menu element
			submenuParent.insertAdjacentHTML('afterbegin', '<span class="just-navbar-submenu-toggle"></span>');

			// Add class to parent el
			submenuParent.classList.add('navbar-has-submenu');
		}
	}

	/**
	 * ApplyHandlers
	 * @desc apply all handlers
	 * @protected
	 **/
	JustNavbar.prototype._applyHandlers = function (ctx) {
		var navWithSubmenu = doc.querySelectorAll('.navbar-has-submenu'),
				timer,
				i;

		doc.addEventListener('click', function (e) {
			var target = e.target;

			// Toggles for opening sub-menu
			// Bind this event via document, because target element was created dynamically
			if (target && target.classList.contains('just-navbar-submenu-toggle')) {
				console.log('Open submenu');
				target.parentNode.classList.toggle('focus');
			}

			// If toggle is opened now
			// Close it by clicking on the document, but not inside toggles target.
			if (ctx.currentToggle) {
				var currTarget = target;

				// Check all nodes form clicked element
				while (currTarget != null && currTarget.tagName.toLocaleLowerCase() != 'html') {

					// If contains active class, we inside open block
					if (currTarget.classList.contains('active')) {
						return;
					}

					// go to the top
					currTarget = currTarget.parentNode;
				}

				console.log('asfdas');

				ctx._closeToggles(ctx);
				ctx.currentToggle = null;
			}
		});

		// Add events to nav with submenu
		for (i = 0; i < navWithSubmenu.length; i++) {
			var item = navWithSubmenu[i];

			// Add class for open sub-menu
			item.onmouseenter = function (e) {
				var target = e.target,
						siblElements = siblings(target);

				// Add focus class to open submenu
				if (ctx._getOption(ctx, 'focusOnHover') && target) {

					// close all siblings submenu
					operateWithClass(siblElements, 'delete', 'focus');

					// clear timer
					clearTimeout(timer);

					//add focus to current el
					target.classList.add('focus');
				}
			};

			// Remove class focus
			item.onmouseleave = function onMouseOut(e) {
				var _this = this;

				timer = setTimeout(function () {
					_this.classList.remove('focus');
				}, ctx.options.focusOnHoverTimeout);
			};

		}


		// Add orientationchange and on resize events
		window.addEventListener("orientationchange", function () {
			ctx._resize(ctx, scrn.getWidth());
		});

		window.addEventListener("resize", function () {
			ctx._resize(ctx, scrn.getWidth());
		});

		// Close mobile menu
		if (ctx.hideBtnEl) {
			ctx.hideBtnEl.addEventListener('click', ctx.closeMobileNav);
		}

		// Add onscroll event to set sticky navbar
		window.addEventListener("scroll", function () {
			// Enable stick up
			if (ctx._getOption(ctx, 'stickUp')) {
				ctx._stickUp(ctx);
			}

			// Anchor nav
			if (ctx.options.anchorNav) {
				ctx._activateAnchorNav(ctx);
			}
		});

		ctx._enableToggles(ctx);

		if (isTouch) {
			ctx._enableSwipeMenu(ctx);
		}
	}

	/**
	 * Resize
	 * @desc Decide need switching layout or not
	 * @protected
	 **/
	JustNavbar.prototype._resize = function (ctx, currentWidth) {
		switch (true) {
			case (currentWidth < 768 && ctx.currentLayout != ctx._getLayout(ctx, 'xs') ):
				ctx._switchNavLayout(ctx, ctx._getLayout(ctx, 'xs'));
				break;
			case (currentWidth > 767 && currentWidth < 992 && ctx.currentLayout != ctx._getLayout(ctx, 'sm')):
				ctx._switchNavLayout(ctx, ctx._getLayout(ctx, 'sm'));
				break;
			case (currentWidth > 991 && currentWidth < 1200 && ctx.currentLayout != ctx._getLayout(ctx, 'md')):
				ctx._switchNavLayout(ctx, ctx._getLayout(ctx, 'md'));
				break;
			case (currentWidth > 1199 && ctx.currentLayout != ctx._getLayout(ctx, 'lg')):
				ctx._switchNavLayout(ctx, ctx._getLayout(ctx, 'lg'));
				break;
		}
	}

	/**
	 * Get current responsive size
	 * @desc Switch current window width and return current resp size
	 * @protected
	 **/
	JustNavbar.prototype._getRespSize = function (ctx) {
		var currentWidth = scrn.getWidth();

		switch (true) {
			case (currentWidth < 768):
				return ctx.options.responsive['xs'];
			case (currentWidth > 767 && currentWidth < 992):
				return ctx.options.responsive['sm'];
			case (currentWidth > 991 && currentWidth < 1200):
				return ctx.options.responsive['md'];
			case (currentWidth > 1199):
				return ctx.options.responsive['lg'];
		}
	}


	/**
	 * SwitchNavLayout
	 * @desc change class and props when navbar resize
	 * @protected
	 **/
	JustNavbar.prototype._switchNavLayout = function (ctx, targetLayout) {

		// Close opened submenu and toggle
		operateWithClass(ctx.element.querySelectorAll('.navbar-has-submenu'), 'remove', 'focus');

		if (ctx.currentToggle) {
			ctx._closeToggles(ctx);
		}

		ctx.element.classList.add('navbar-no-transition');
		ctx.element.classList.remove(ctx.currentLayout);
		ctx.element.classList.add(targetLayout);
		ctx.element.classList.remove('navbar-no-transition');
		body.classList.remove('has-' + ctx.currentLayout);
		body.classList.add('has-' + targetLayout);
		ctx.currentLayout = targetLayout;
	}

	/**
	 * Stick up navbar
	 * @desc set up stickup navbar on scroll, using scroll-offset top if exist
	 * @protected
	 **/
	JustNavbar.prototype._stickUp = function (ctx) {
		var currOffsetTop = win.pageYOffset || doc.documentElement.scrollTop,
				currStickUpOffset = ctx._getOption(ctx, 'stickUpOffset') || '1px',
				currStickUpOffsetUnit = 'px';

		if (currStickUpOffset && currStickUpOffset.indexOf('%') != -1) {
			currStickUpOffsetUnit = '%';
		}

		if (!ctx.isStuck && getScrollOffsetVal() >= parseFloat(currStickUpOffset)) {
			ctx.element.classList.add('just-navbar--sticky');
			ctx.isStuck = true;

			// Close opened submenu and toggle
			operateWithClass(ctx.element.querySelectorAll('.navbar-has-submenu'), 'remove', 'focus');

			ctx._closeToggles(ctx);
			console.log(getScrollOffsetVal());
			console.log('add sticky');
		} else if (ctx.isStuck && getScrollOffsetVal() < parseFloat(currStickUpOffset)) {
			ctx.element.classList.remove('just-navbar--sticky');
			ctx.isStuck = false;
			console.log('remove sticky');
		}


		/**
		 * getScrollOffsetVal
		 * @desc return scroll offset in percentage if stick-up set up in percentage
		 * @protected
		 **/
		function getScrollOffsetVal() {
			var currWidth;

			if (currStickUpOffsetUnit === '%') {
				currWidth = scrn.getHeight();
				console.log(currOffsetTop / currWidth * 100);
				return currOffsetTop / currWidth * 100;
			}

			return currOffsetTop;
		}
	}

	/**
	 * EnableToggles
	 * @desc set up stickup navbar on scroll, using scroll-offset top if exist
	 * @protected
	 **/
	JustNavbar.prototype._enableToggles = function (ctx) {
		var toggles = ctx.element.querySelectorAll('[data-target]'),
				i;

		// Write all target selectors to ctx.toggleGroup
		// and bind click event on each
		for (i = 0; i < toggles.length; i++) {
			var element = toggles[i],
					targetSelector = element.getAttribute('data-target'),
					target = doc.querySelectorAll(targetSelector);

			ctx.toggleGroup.push(target);

			element.addEventListener('click', (function (el) {
				return function () {
					if (ctx.currentToggle && !this.classList.contains('active')) {
						ctx._closeToggles(ctx);
					}

					console.log("ctx.mobileNavWrap.classList.contains('active') " + ctx.mobileNavWrap.classList.contains('active'));
					if (ctx.mobileNavWrap.classList.contains('active')) {
						console.log('close');
						ctx.closeMobileNav();
					}

					ctx.currentToggle = {
						toggle: this,
						togglesEl: el,
					};

					this.classList.toggle('active');
					operateWithClass(el, 'toggle', 'active');
				}
			})(target));


			// Button for opening mobile swipe menu
			ctx.options.swipeMenuToggle.addEventListener('click', function (e) {
				var _this = this;

				if (_this.classList.contains('active')) {
					ctx.closeMobileNav();
					_this.classList.remove('active');
				} else {
					if (ctx.currentToggle) {
						ctx._closeToggles(ctx);
					}

					ctx.openMobileNav(ctx);
					_this.classList.add('active');
				}

				ctx.currentToggle = {
					toggle: _this,
					togglesEl: ctx.mobileNavWrap,
					menuSwipe: true
				};
			});

		}
	}

	/**
	 * CloseToggles
	 * @desc set up stickup navbar on scroll, using scroll-offset top if exist
	 * @protected
	 **/
	JustNavbar.prototype._closeToggles = function (ctx) {
		var i;

		// Close all toggle elements (targets)
		for (i = 0; i < ctx.toggleGroup.length; i++) {
			var item = ctx.toggleGroup[i],
					j;

			for (j = 0; j < item.length; j++) {
				item[j].classList.remove('active');
			}
		}

		// Close active toggle button
		if (ctx.currentToggle && ctx.currentToggle.toggle) {
			ctx.currentToggle.toggle.classList.remove('active');
		}

		// if mobile menu opened by swipe - close it
		if (ctx.currentToggle && ctx.currentToggle.menuSwipe) {
			ctx.closeMobileNav();

			// if swipe menu toggle exist
			if (ctx.options.swipeMenuToggle) {
				ctx.options.swipeMenuToggle.classList.remove('active');
			}
		}
	}


	/**
	 * EnableSwipeMenu
	 * @desc Enable swipe for opening and closing submenu
	 * @protected
	 **/
	JustNavbar.prototype._enableSwipeMenu = function (ctx) {
		var oneWay = false,
				secWay = false,
				isMove = false,
				currentPos,
				startPos,
				diff;

		doc.addEventListener('touchstart', function (e) {

			// If swipe enabled on this screen resolution
			if (ctx._getOption(ctx, 'swipeDeviceMenu')) {
				if (!ctx.mobileNavWrapWidth) {
					ctx.mobileNavWrapWidth = ctx.mobileNavWrap.offsetWidth;
				}

				// If clicked inside ignored element and menu is not in opening state
				if (!ctx.isMenuOpen && checkForIgnores(e.target)) {
					return;
				}

				startPos = e.touches[0].clientX;
				console.log('startPos ' + startPos);
				console.log('ctx.options.startSwipeWidth ' + ctx.options.startSwipeWidth);
				console.log('startPos ' + startPos <= ctx.options.startSwipeWidth);

				ctx.mobileNavWrap.classList.add('no-transition');

				doc.addEventListener('touchmove', touchmoveListener);
			}
		});

		doc.addEventListener('touchend', function (e) {
			doc.removeEventListener('touchmove', touchmoveListener);

			// if not moved in correct way - return
			if (!secWay && !oneWay) {
				return;
			}

			oneWay = secWay = false;

			if (isMove) {
				isMove = false;

				if (ctx.isMeuOpening && (diff > ctx.mobileNavWrapWidth / 2)
						|| ctx.isMenuOpen && (diff < ctx.mobileNavWrapWidth / 2)) {
					ctx.openMobileNav(ctx, diff);
				} else {
					ctx.closeMobileNav(diff);
				}

				ctx.isMeuOpening = false;
			}
		});


		function touchmoveListener(e) {
			var offset;

			isMove = true;

			console.log('=================');

			currentPos = e.touches[0].clientX;
			diff = Math.abs(currentPos - startPos);
			offset = currentPos - startPos;

			ctx.mobileNavWrap.classList.remove('no-transition');

			// Menu in left direction
			if (ctx.options.swipeMenuDirection === 'left') {
				console.log('LEFT');

				// Open left side menu
				if (!ctx.isMenuOpen && !secWay && (diff > 20 || ctx.isMeuOpening)) {
					console.log('ONE way');
					oneWay = true;
					offset = (ctx.mobileNavWrapWidth - (currentPos - startPos)) * -1;
					ctx.isMeuOpening = true;
				} else if ((ctx.isMenuOpen || secWay) && startPos > currentPos) {
					// close left side menu
					console.log('SEC way');
					secWay = true;
				} else {
					console.log('return');
					return;
				}
				// open menu
				offset = offset > 0 ? 0 : offset;
			} else {
				console.log('RIGHT');
				// Menu in right direction
				if (!ctx.isMenuOpen && !secWay && (diff > 20 || ctx.isMeuOpening)) {
					console.log('ONE way');
					offset = ctx.mobileNavWrapWidth + offset;
					oneWay = true;
					ctx.isMeuOpening = true;
				} else if ((ctx.isMenuOpen || secWay) && startPos < currentPos) {
					console.log('SEC way');
					// Close right side menu
					secWay = true;
				} else {
					console.log('return');
					return;
				}
				// open menu
				offset = offset < 0 ? 0 : offset;
			}

			console.log('offset ' + offset);

			// if menu closed
			offset = Math.abs(offset) > ctx.mobileNavWrapWidth ? ctx.mobileNavWrapWidth * ctx.swipeMenuOrientation : offset;
			console.log('  ==offset ' + offset);

			ctx._addTranslate(ctx, offset);
		}

	}

	/**
	 * addTranslate
	 * @desc Translate mobile menu
	 * @protected
	 **/
	JustNavbar.prototype._addTranslate = function (ctx, offset) {
		ctx.mobileNavWrap.style.transform = 'translateX(' + offset + 'px) ';
	}

	/**
	 * addTransition
	 * @desc Add transition & transitionend event to mobile menu
	 * @protected
	 **/
	JustNavbar.prototype._addTransition = function (ctx) {
		ctx.mobileNavWrap.addEventListener("transitionend", transitionEndListener);
		ctx.mobileNavWrap.style.transition = ctx.options.swipeTransition;

		function transitionEndListener(e) {
			console.log('transitionEndListener');
			ctx.mobileNavWrap.removeEventListener("transitionend", transitionEndListener, false);
			ctx.mobileNavWrap.style.transition = '';
		}
	}

	/**
	 * CloseMobileNav
	 * @desc Close mobile menu
	 * @public
	 **/
	JustNavbar.prototype.closeMobileNav = function (diff) {
		var _this = this;
		console.log('closeMobileNav');
		diff = diff || 0;

		console.log(_this);

		if (diff < _this.mobileNavWrapWidth) {
			_this._addTransition(_this);
			_this._addTranslate(_this, _this.mobileNavWrapWidth * _this.swipeMenuOrientation);
		}

		_this.isMenuOpen = false;
		_this.mobileNavWrap.classList.remove('active');

		if (_this.options.swipeMenuToggle) {
			_this.options.swipeMenuToggle.classList.remove('active');
		}

		body.classList.remove('menu-open');
	}

	/**
	 * OpenMobileNav
	 * @desc Close mobile menu
	 * @public
	 **/
	JustNavbar.prototype.openMobileNav = function (ctx, diff) {
		console.log('openMobileNav');
		diff = diff ? diff : 0;

		if (diff < ctx.mobileNavWrapWidth) {
			ctx._addTransition(ctx);
			ctx._addTranslate(ctx, 0);
		}

		ctx.isMenuOpen = true;
		ctx.currentToggle = {
			menuSwipe: true,
		}

		ctx.mobileNavWrap.classList.add('active');

		if (ctx.options.swipeMenuToggle) {
			ctx.options.swipeMenuToggle.classList.add('active');
		}

		body.classList.add('menu-open');
	}


	/**
	 * EnableAnchor
	 * @desc Enable anchor navigation
	 * @protected
	 **/
	JustNavbar.prototype._activateAnchorNav = function (ctx) {
		var links = ctx.mobileNavWrap.querySelectorAll('.' + ctx.options.navClass + ' > li > a[href^="#"'),
		// scrollTop = win.pageYOffset,
				centerX = doc.documentElement.clientWidth / 2,
				centerY = doc.documentElement.clientHeight / 2,
				elem = document.elementFromPoint(centerX, centerY),
				currentHref,
				i;

		//TODO: refactor code when use while loop to parent node
		// check parents node of element in the center of screen
		if (!elem.dataset.anchorItem) {
			while (elem.parentNode && elem.tagName.toLocaleLowerCase() != 'html') {
				if (elem.dataset.anchorItem !== undefined) {
					break;
				}
				elem = elem.parentNode;
			}
		}

		currentHref = '#' + elem.getAttribute('id')

		if (currentHref) {
			for (i = 0; i < links.length; i++) {
				var item = links[i],
						parentItem = item.parentNode,
						anchor = item.getAttribute('href');

				if (anchor === currentHref && !parentItem.classList.contains('active')) {

					// Remove current active class
					if (ctx.currentAnchorItem) {
						ctx.currentAnchorItem.classList.remove('active');
					}

					// Set new current item
					ctx.currentAnchorItem = parentItem;
					parentItem.classList.add('active');
				}
			}
		}


	}


	return window.JustNavbar = JustNavbar;
})();

console.log(new JustNavbar(
		'.navbar', // Selector for navabr
		// Object with options
		{
			// swipeMenuDirection: 'right'
		}
));
