(function () {
  'use strict';

  //https://slideout.js.org/ 

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
          } else { // if single item
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
      hasClass = function (el) {
        // if node list contains more then one elements
        if (el.length > 1) {

        } else { // if single item
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
    ctx.toggleGroup = [];
    ctx.currentToggle = null;

    // Merge def opt and opt in parameters
    ctx.options = extend(ctx._Defaults, options);

    ctx.element = document.querySelector(el);
    ctx.currentLayout = ctx.options.layout;
    ctx.isStuck = false;
    ctx.mobileNavWrap = ctx.element.querySelector('.navbar-mobile-menu-wrap');
    ctx.mobileNavWrapWidth = ctx.mobileNavWrap.offsetWidth;
    ctx.isMenuOpen = false;
    console.log('isStuck ' + ctx.isStuck);

    ctx._init(ctx);
  }

  /**
   * Default plugin options
   * @protected
   **/
  JustNavbar.prototype._Defaults = {
    navClass: 'navbar-nav',
    stickUp: true,
    startSwipeWidth: 10,
    responsive: {
      xs: {
        alias: 'xs',
        size: 0,
        layout: 'navbar-device',
        deviceLayout: 'navbar-device',
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

    doc.addEventListener(isTouch ? 'touchstart' : 'mousedown', function (e) {
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

        ctx._closeToggles(ctx);
        ctx.currentToggle = null;
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
      if (ctx._getOption(ctx, 'stickUp')) {
        ctx._stickUp(ctx);
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
    var togles = ctx.element.querySelectorAll('[data-target]'),
        i;

    // Write all target selectors to ctx.toggleGroup
    // and bind click event on each
    for (i = 0; i < togles.length; i++) {
      var element = togles[i],
          targetSelector = element.getAttribute('data-target'),
          target = doc.querySelectorAll(targetSelector);

      ctx.toggleGroup.push(target);

      element.addEventListener('click', (function (el) {
        return function () {
          if (ctx.currentToggle && !this.classList.contains('active')) {
            ctx._closeToggles(ctx);
          }
          ctx.currentToggle = {
            toggle: this,
            togglesEl: el
          };


          this.classList.toggle('active');
          operateWithClass(el, 'toggle', 'active');
          // el.classList.toggle('active');
        }
      })(target));
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
    ctx.currentToggle.toggle.classList.remove('active');
  }


  /**
   * CloseToggles
   * @desc set up stickup navbar on scroll, using scroll-offset top if exist
   * @protected
   **/
  JustNavbar.prototype._enableSwipeMenu = function (ctx) {
    var currentPos,
        startPos,
        oneWay = false,
        secWay = false,
        isMove = false;

    doc.addEventListener('touchstart', function (e) {
      if (!ctx.mobileNavWrapWidth) {
        ctx.mobileNavWrapWidth = ctx.mobileNavWrap.offsetWidth;
      }

      startPos = e.touches[0].clientX;
      console.log('startPos ' + startPos);
      console.log('ctx.options.startSwipeWidth ' + ctx.options.startSwipeWidth);
      console.log('startPos ' + startPos <= ctx.options.startSwipeWidth);

      isMove = true;
      body.classList.add('menu-open');
      doc.addEventListener('touchmove', touchmoveListener);


    });

    doc.addEventListener('touchend', function (e) {
      doc.removeEventListener('touchmove', touchmoveListener);
      body.classList.remove('menu-open');

      // if not moved in correct way - returb
      if(!secWay && !oneWay) {
        return;
      }

      oneWay = false;
      secWay = false;

      if (isMove) {
        isMove = false;

        ctx.mobileNavWrap.addEventListener("transitionend", transitionEndListener, false);

        ctx.mobileNavWrap.style.transition = '100ms cubic-bezier(.23,.59,.86,.57)';

        if (currentPos > ctx.mobileNavWrapWidth / 2) {
          console.log('currentPos > ctx.mobileNavWrapWidth / 2');
          ctx.mobileNavWrap.style.transform = 'translateX(-' + 0 + 'px) translateZ(0)';
          ctx.isMenuOpen = true;
          body.classList.add('menu-open');
        } else {
          console.log('ELSE');
          ctx.mobileNavWrap.style.transform = 'translateX(-' + ctx.mobileNavWrapWidth + 'px) translateZ(0)';
          ctx.isMenuOpen = false;
          body.classList.remove('menu-open');
        }
      }
    });


    function transitionEndListener(e) {
      ctx.mobileNavWrap.removeEventListener("transitionend", transitionEndListener, false);
      ctx.mobileNavWrap.style.transition = '';
    }


    function touchmoveListener(e) {
      var offset,
          diff;

      console.log('=================');

      console.log('startPos ' + startPos);

      currentPos = e.touches[0].clientX;
      diff = currentPos - startPos;

      console.log('currentPos ' + currentPos);

      if(ctx.isMenuOpen || secWay) {
        secWay = true;
        console.log('CALCULATE BY 2 ');
        offset = startPos - currentPos;
      } else if ((startPos < currentPos || oneWay) && !secWay && diff > 20)  {
        oneWay = true;
        console.log('CALCULATE BY 1 ');
        offset = ctx.mobileNavWrapWidth - (currentPos - startPos);
      } else {
        console.log('return');
        return;
      }

      console.log('offset ' + offset);

      // if menu closed
      offset = offset > ctx.mobileNavWrapWidth ? ctx.mobileNavWrapWidth : offset;
      console.log('  ==offset ' + offset);

      // open menu
      offset = offset < 0 ? 0 : offset;
      console.log('   ==offset ' + offset);

      console.log(e.touches[0].clientX);


      ctx.mobileNavWrap.style.transform = 'translateX(-' + offset + 'px) translateZ(0)';
    }
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
