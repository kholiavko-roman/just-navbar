(function () {
  'use strict';

  // Global vars
  var win = window,
      doc = document,
      isTouch = 'ontouchstart' in win,
      scrn = {
        getWidth: function () {
          return Math.min(win.innerWidth || Infinity, screen.width);
        }
      },
      body = doc.querySelector('body');

  /**
   * Creates a JustNavbar.
   * @class JustNavbar.
   * @public
   * @param {HTMLElement} element - Css selector of element.
   * @param {Object} [options] - The options
   * */
  var JustNavbar = function (el, options) {
    var ctx = this;

    // Merge def opt and opt in parameters
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
    navClass: 'navbar-nav',
    stickUp: true,
    responsive: {
      xs: {
        alias: 'xs',
        size: 0,
        layout: 'navbar-device',
        deviceLayout: 'navbar-device-DEVICE',
        focusOnHover: false,
        stickUp: false
      },
      sm: {
        alias: 'sm',
        size: 768,
        layout: 'navbar-768',
        deviceLayout: 'navbar-768-DEVICE',
        focusOnHover: true,
        stickUp: false
      },
      md: {
        alias: 'md',
        size: 992,
        layout: 'navbar-9992',
        deviceLayout: 'navbar-9992-DEVICE',
        focusOnHover: true,
        stickUp: false
      },
      lg: {
        alias: 'lg',
        size: 1200,
        layout: 'navbar-DESK',
        deviceLayout: 'navbar-DESK-DEVICE',
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
      var target = e.target;
      // Toogle for opening sub-menu
      // Bind this event via document, because target element was created dynamically
      if (target && target.classList.contains('just-navbar-submenu-toggle')) {
        console.log('Open submenu');
        target.parentNode.classList.toggle('focus');
      }
    });

    // Add class for open sub-menu
    navWithSubmenu.onmouseover = function (e) {
      var target = e.target;

      // Add focus class to open submenu
      if (ctx._getOption(ctx, 'focusOnHover') && target
          && target.classList.contains('navbar-has-submenu') && !currentEl) {
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

    // Add orientationchange and on resize events
    window.addEventListener("orientationchange", function () {
      ctx._resize(ctx, scrn.getWidth());
    });

    window.addEventListener("resize", function () {
      ctx._resize(ctx, scrn.getWidth());
    });

    // Add onscroll event to set sticky navbar
    window.addEventListener("scroll", function () {
      ctx._stickUp(ctx);
    });
  }

  /**
   * Resize
   * @desc Decide need switching layout or not
   * @protected
   **/
  JustNavbar.prototype._resize = function (ctx, currentWidth) {
    switch (true) {
      case (currentWidth < 768 && ctx.currentLayout != ctx._getLayout(ctx, 'xs') ):
        console.log('xs');
        ctx._switchNavLayout(ctx, ctx._getLayout(ctx, 'xs'));
        break;
      case (currentWidth > 767 && currentWidth < 992 && ctx.currentLayout != ctx._getLayout(ctx, 'sm')):
        console.log('sm');
        ctx._switchNavLayout(ctx, ctx._getLayout(ctx, 'sm'));
        break;
      case (currentWidth > 991 && currentWidth < 1200 && ctx.currentLayout != ctx._getLayout(ctx, 'md')):
        console.log('md');
        ctx._switchNavLayout(ctx, ctx._getLayout(ctx, 'md'));
        break;
      case (currentWidth > 1199 && ctx.currentLayout != ctx._getLayout(ctx, 'lg')):
        console.log('lg');
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
        console.log('xs');
        return ctx.options.responsive['xs'];
      case (currentWidth > 767 && currentWidth < 992):
        console.log('sm');
        return ctx.options.responsive['sm'];
      case (currentWidth > 991 && currentWidth < 1200):
        console.log('md');
        return ctx.options.responsive['md'];
      case (currentWidth > 1199):
        console.log('lg');
        return ctx.options.responsive['lg'];
    }
  }


  /**
   * SwitchNavLayout
   * @desc change class and props when navbar resize
   * @protected
   **/
  JustNavbar.prototype._switchNavLayout = function (ctx, targetLayout) {
    console.log('_switchNavLayout');
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
   * @desc set up stickup navbar on scroll
   * @protected
   **/
  JustNavbar.prototype._stickUp = function (ctx) {
    console.log(win.pageYOffset || doc.documentElement.scrollTop);
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

console.log(new JustNavbar(
    '.navbar', // Selector for navabr
    // Object with options
    {}
));
