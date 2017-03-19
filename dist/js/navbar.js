(function () {
  'use strict';

  // Global vars
  var win = window,
      doc = document,
      body = doc.querySelector('body'),
      isTouch = 'ontouchstart' in win;

  /**
   * Creates a JustNavbar.
   * @class JustNavbar.
   * @public
   * @param {HTMLElement} element - Css selector of element.
   * @param {Object} [options] - The options
   * */
  var JustNavbar = function (el, options) {
    var ctx = this;

    ctx.options = extend(ctx._Defaults, options);
    ctx.element = document.querySelector(el);
    ctx.currentLayout = ctx.options.layout;

    ctx._init(ctx);
  }

  /**
   * Default plugin options
   * @protected
   **/
  JustNavbar.prototype._Defaults = {
    layout: 'navbar-DESK',
    deviceLayout: 'navbar-device',
    navClass: 'navbar-nav',
    stickUp: true,
    responsive: {
      0: {
        layout: 'navbar-device',
        deviceLayout: 'navbar-device',
        focusOnHover: false,
        stickUp: false
      },
      768: {
        layout: 'navbar-765',
        deviceLayout: 'navbar-768',
        focusOnHover: true,
        stickUp: false
      },
      992: {
        layout: 'navbar-9992',
        deviceLayout: 'navbar-9992',
        focusOnHover: true,
        stickUp: false
      },
      1200: {
        layout: 'navbar-DESK',
        deviceLayout: 'navbar-device',
        focusOnHover: true,
        stickUp: true
      }
    },
  }

  /**
   * Init
   * @protected
   **/
  JustNavbar.prototype._init = function (ctx) {
    ctx._initNav(ctx);
    ctx._applyHandlers(ctx);
    // Set active layout
    ctx._resize();
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
    var navWithSubmenu = doc.querySelector('.navbar-has-submenu'),
        currentEl = null;

    doc.addEventListener('click', function (e) {
      // Toogle for opening sub-menu
      // Bind this event via document, because target element was created dynamically
      if (e.target && e.target.classList.contains('just-navbar-submenu-toggle')) {
        console.log('aa');
      }
    });

    // Add class for open sub-menu
    navWithSubmenu.onmouseover = function (e) {
      var target;

      if (currentEl) return;

      target = e.target;

      // Add focus class to open submenu
      if (target && target.classList.contains('navbar-has-submenu')) {
        target.classList.add('focus');
        currentEl = target;
      }
    };
    // Remove class focus
    navWithSubmenu.onmouseout = function (e) {
      var relatedTarget;

      if (!currentEl) return;

      relatedTarget = event.relatedTarget;

      if (relatedTarget) {
        while (relatedTarget) {
          // If inside current element, do not remove focus class
          if (relatedTarget == currentEl) return;
          relatedTarget = relatedTarget.parentNode;
        }
      }

      currentEl.classList.remove('focus');
      currentEl = null;
    };
    // On resize event
    win.onresize = function (e) {
      ctx._resize(ctx, win.innerWidth);
    };
  }

  /**
   * Resize
   * @desc Decide need switching layout or not
   * @protected
   **/
  JustNavbar.prototype._resize = function (ctx, currentWidth) {
    switch (true) {
      case (currentWidth < 768 && ctx.currentLayout != ctx._getLayout(ctx, 0) ):
        console.log('xs');
        ctx._switchNavLayout(ctx, ctx._getLayout(ctx, 0));
        break;
      case (currentWidth > 767 && currentWidth < 992 && ctx.currentLayout != ctx._getLayout(ctx, 768)):
        console.log('sm');
        ctx._switchNavLayout(ctx, ctx._getLayout(ctx, 768));
        break;
      case (currentWidth > 991 && currentWidth < 1200 && ctx.currentLayout != ctx._getLayout(ctx, 992)):
        console.log('md');
        ctx._switchNavLayout(ctx, ctx._getLayout(ctx, 992));
        break;
      case (currentWidth > 1199 && currentWidth < 1800 && ctx.currentLayout != ctx._getLayout(ctx, 1200)):
        console.log('lg');
        ctx._switchNavLayout(ctx, ctx._getLayout(ctx, 1200));
        break;
    }
  }

  /**
   * SwitchNavLayout
   * @desc change class and props when navbar resize
   * @protected
   **/
  JustNavbar.prototype._switchNavLayout = function (ctx, targetLayout) {
    ctx.element.classList.add('navbar-no-transition');
    ctx.element.classList.remove(ctx.currentLayout);
    ctx.element.classList.add(targetLayout);
    ctx.element.classList.remove('navbar-no-transition');
    body.classList.remove('has-' + ctx.currentLayout);
    body.classList.add('has-' + targetLayout);
    ctx.currentLayout = targetLayout;
  }


  /**
   * Get layout
   * @desc Get needed layout
   * @protected
   **/
  JustNavbar.prototype._getLayout = function (ctx, size) {
    if (isTouch) {
      return ctx.options.responsive[size].deviceLayout;
    }
    return ctx.options.responsive[size].layout;
  }


  /**
   * Helpers methods
   **/

  /**
   * Extend
   * @desc extend all methods and prop form source object to target
   **/
  function extend(target, source) {
    for (var prop in source) {
      if (typeof source[prop] === 'object') {
        console.log(source[prop]);
        target[prop] = extend(target[prop], source[prop]);
      } else {
        target[prop] = source[prop];
      }
    }

    return target;
  }


  return window.JustNavbar = JustNavbar;
})();


new JustNavbar('.navbar',
    {
      layout: 'navbar-DESK'
    });
