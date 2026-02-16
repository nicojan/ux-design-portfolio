/* ============================================================
   SECOND SAVOUR — Main JavaScript (jQuery)
   ============================================================ */

$(function () {
  /* --------------------------------------------------------
     CART STATE (stored in-memory, survives page via sessionStorage)
     -------------------------------------------------------- */
  const CART_KEY = "secondSavourCart";

  function loadCart() {
    try {
      const raw = sessionStorage.getItem(CART_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (_e) {
      return [];
    }
  }

  function saveCart(items) {
    sessionStorage.setItem(CART_KEY, JSON.stringify(items));
  }

  function getCart() {
    return loadCart();
  }

  function addToCart(product) {
    const items = getCart();
    const idx = items.findIndex(function (i) {
      return i.id === product.id;
    });
    if (idx >= 0) {
      items[idx] = Object.assign({}, items[idx], { qty: items[idx].qty + 1 });
    } else {
      items.push(Object.assign({}, product, { qty: 1 }));
    }
    saveCart(items);
    renderCart();
    openCart();
  }

  function removeFromCart(id) {
    var items = getCart().filter(function (i) {
      return i.id !== id;
    });
    saveCart(items);
    renderCart();
  }

  function updateCartQty(id, delta) {
    var items = getCart().map(function (i) {
      if (i.id !== id) return i;
      var newQty = i.qty + delta;
      if (newQty < 1) newQty = 1;
      return Object.assign({}, i, { qty: newQty });
    });
    saveCart(items);
    renderCart();
  }

  /* --------------------------------------------------------
     CART BADGE
     -------------------------------------------------------- */
  function updateCartBadge() {
    var items = getCart();
    var count = items.reduce(function (s, i) {
      return s + i.qty;
    }, 0);
    var $badge = $(".header__cart-badge");
    $badge.text(count).attr("data-count", count);
    if (count > 0) {
      $badge.show();
    } else {
      $badge.hide();
    }
  }

  /* --------------------------------------------------------
     CART DRAWER RENDERING
     -------------------------------------------------------- */
  function renderCart() {
    var items = getCart();
    updateCartBadge();

    var $body = $(".cart-drawer__body");
    var $footer = $(".cart-drawer__footer");

    if (items.length === 0) {
      $body.html(
        '<div class="cart-drawer__empty">' +
          '<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>' +
          "<h3>Your cart is empty</h3>" +
          "<p>Looks like you haven't added anything yet.</p>" +
          '<a href="shop.html" class="btn btn--primary">Start Shopping</a>' +
          "</div>",
      );
      $footer.hide();
      return;
    }

    var html = "";
    items.forEach(function (item) {
      var emojiMap = {
        orange: "🍊",
        lemon: "🍋",
        grapefruit: "🍊",
        lime: "🍈",
      };
      var emoji = emojiMap[item.id] || "🍊";
      var lineTotal = (item.price * item.qty).toFixed(2);

      html +=
        '<div class="cart-item" data-id="' +
        item.id +
        '">' +
        '<div class="cart-item__image" style="background-color:' +
        (item.bg || "#FFECD9") +
        '">' +
        '<span class="emoji">' +
        emoji +
        "</span>" +
        "</div>" +
        '<div class="cart-item__info">' +
        '<div class="cart-item__name">' +
        item.name +
        "</div>" +
        '<div class="cart-item__price">$' +
        item.price.toFixed(2) +
        " each</div>" +
        '<div class="cart-item__controls">' +
        '<div class="cart-item__qty">' +
        '<button class="cart-item__qty-btn" data-action="decrease" data-id="' +
        item.id +
        '">−</button>' +
        '<span class="cart-item__qty-value">' +
        item.qty +
        "</span>" +
        '<button class="cart-item__qty-btn" data-action="increase" data-id="' +
        item.id +
        '">+</button>' +
        "</div>" +
        '<button class="cart-item__remove" data-id="' +
        item.id +
        '">Remove</button>' +
        "</div>" +
        "</div>" +
        '<div class="cart-item__total">$' +
        lineTotal +
        "</div>" +
        "</div>";
    });
    $body.html(html);

    var subtotal = items.reduce(function (s, i) {
      return s + i.price * i.qty;
    }, 0);
    $footer.show();
    $footer
      .find(".cart-drawer__subtotal-value")
      .text("$" + subtotal.toFixed(2));
  }

  /* --------------------------------------------------------
     CART DRAWER OPEN / CLOSE
     -------------------------------------------------------- */
  function openCart() {
    $(".cart-overlay").addClass("cart-overlay--open");
    $("body").css("overflow", "hidden");
  }

  function closeCart() {
    $(".cart-overlay").removeClass("cart-overlay--open");
    $("body").css("overflow", "");
  }

  // Delegated events
  $(document).on("click", ".header__cart-btn", function (e) {
    e.preventDefault();
    renderCart();
    openCart();
  });

  $(document).on(
    "click",
    ".cart-overlay__backdrop, .cart-drawer__close",
    closeCart,
  );

  $(document).on("click", ".cart-drawer__continue", function (e) {
    e.preventDefault();
    closeCart();
  });

  $(document).on("click", ".cart-item__qty-btn", function () {
    var id = $(this).data("id");
    var action = $(this).data("action");
    updateCartQty(id, action === "increase" ? 1 : -1);
  });

  $(document).on("click", ".cart-item__remove", function () {
    removeFromCart($(this).data("id"));
  });

  /* --------------------------------------------------------
     ADD TO CART BUTTONS (on product cards & PDP)
     -------------------------------------------------------- */
  $(document).on("click", ".js-add-to-cart", function (e) {
    e.preventDefault();
    var $btn = $(this);
    var product = {
      id: $btn.data("product-id"),
      name: $btn.data("product-name"),
      price: parseFloat($btn.data("product-price")),
      bg: $btn.data("product-bg") || "#FFECD9",
    };

    // If PDP, check quantity selector
    var $qty = $(".qty-selector__value");
    var qty = $qty.length ? parseInt($qty.text(), 10) : 1;
    for (var i = 0; i < qty; i++) {
      addToCart(product);
    }
  });

  /* --------------------------------------------------------
     QUANTITY SELECTOR (PDP)
     -------------------------------------------------------- */
  $(document).on("click", ".qty-selector__btn", function () {
    var $parent = $(this).closest(".qty-selector");
    var $val = $parent.find(".qty-selector__value");
    var current = parseInt($val.text(), 10);
    var action = $(this).data("action");

    if (action === "decrease" && current > 1) {
      $val.text(current - 1);
    } else if (action === "increase" && current < 99) {
      $val.text(current + 1);
    }
  });

  /* --------------------------------------------------------
     MOBILE MENU
     -------------------------------------------------------- */
  $(document).on("click", ".header__mobile-toggle", function () {
    $(".mobile-menu").addClass("mobile-menu--open");
    $("body").css("overflow", "hidden");
  });

  $(document).on(
    "click",
    ".mobile-menu__close, .mobile-menu__link",
    function () {
      $(".mobile-menu").removeClass("mobile-menu--open");
      $("body").css("overflow", "");
    },
  );

  /* --------------------------------------------------------
     ACCORDION (Nutrition / Ingredients)
     -------------------------------------------------------- */
  $(document).on("click", ".pdp-accordion__header", function () {
    var $accordion = $(this).closest(".pdp-accordion");
    $accordion.toggleClass("pdp-accordion--open");
  });

  /* --------------------------------------------------------
     CALENDAR
     -------------------------------------------------------- */
  var calendarEvents = [
    {
      id: 1,
      type: "market",
      name: "Trout Lake Farmers Market",
      date: "2026-02-22",
      time: "9:00 AM – 2:00 PM",
      location: "Trout Lake Community Centre",
      address: "3360 Victoria Dr, Vancouver",
      recurring: "Every Saturday",
    },
    {
      id: 2,
      type: "market",
      name: "Kitsilano Farmers Market",
      date: "2026-02-23",
      time: "10:00 AM – 2:00 PM",
      location: "Kitsilano Community Centre",
      address: "2690 Larch St, Vancouver",
      recurring: "Every Sunday",
    },
    {
      id: 3,
      type: "popup",
      name: "Whole Foods Cambie Tasting",
      date: "2026-02-28",
      time: "12:00 PM – 4:00 PM",
      location: "Whole Foods Market",
      address: "510 W 8th Ave, Vancouver",
      recurring: null,
    },
    {
      id: 4,
      type: "market",
      name: "Riley Park Farmers Market",
      date: "2026-03-01",
      time: "10:00 AM – 2:00 PM",
      location: "Riley Park",
      address: "50th Ave & Ontario St, Vancouver",
      recurring: "First Saturday of month",
    },
  ];

  // Calendar instances with independent month state
  var calendarInstances = {};
  var storeIconMap = {
    "Whole Foods Market": "location_on",
    "Choices Markets": "location_on",
    "Nourish Market": "location_on",
  };

  function initCalendarInstance(containerId, startMonth) {
    calendarInstances[containerId] = {
      month: new Date(startMonth.getFullYear(), startMonth.getMonth()),
    };
  }

  function renderCalendarFor(containerId) {
    var $cal = $("#" + containerId);
    if (!$cal.length) return;

    var instance = calendarInstances[containerId];
    if (!instance) return;

    var year = instance.month.getFullYear();
    var month = instance.month.getMonth();
    var monthNames = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];
    var dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    var daysInMonth = new Date(year, month + 1, 0).getDate();
    var firstDay = new Date(year, month, 1).getDay();
    var today = new Date();
    var todayStr =
      today.getFullYear() +
      "-" +
      String(today.getMonth() + 1).padStart(2, "0") +
      "-" +
      String(today.getDate()).padStart(2, "0");

    // Header
    var html = '<div class="calendar__header">';
    html +=
      '<button class="calendar__nav-btn js-cal-prev" data-calendar="' +
      containerId +
      '">‹</button>';
    html +=
      '<span class="calendar__month-label">' +
      monthNames[month] +
      " " +
      year +
      "</span>";
    html +=
      '<button class="calendar__nav-btn js-cal-next" data-calendar="' +
      containerId +
      '">›</button>';
    html += "</div>";

    // Day headers
    html += '<div class="calendar__day-headers">';
    dayNames.forEach(function (d) {
      html += '<div class="calendar__day-header">' + d + "</div>";
    });
    html += "</div>";

    // Days grid
    html += '<div class="calendar__grid">';

    // Empty cells before first day
    for (var e = 0; e < firstDay; e++) {
      html += '<div class="calendar__day calendar__day--empty"></div>';
    }

    for (var d = 1; d <= daysInMonth; d++) {
      var dateStr =
        year +
        "-" +
        String(month + 1).padStart(2, "0") +
        "-" +
        String(d).padStart(2, "0");
      var dayEvents = calendarEvents.filter(function (ev) {
        return ev.date === dateStr;
      });
      var hasEvent = dayEvents.length > 0;
      var isToday = dateStr === todayStr;
      var classes = "calendar__day";
      if (hasEvent) {
        classes += " calendar__day--has-event";
        // Add event type class (use first event's type for bg colour)
        classes += " calendar__day--" + dayEvents[0].type;
      }

      html +=
        '<div class="' +
        classes +
        '" data-date="' +
        dateStr +
        '" data-calendar="' +
        containerId +
        '">';
      if (isToday) {
        html +=
          '<div class="calendar__day-number calendar__day-number--today">' +
          d +
          "</div>";
      } else {
        html += '<div class="calendar__day-number">' + d + "</div>";
      }

      if (hasEvent) {
        html += '<div class="calendar__event-dots">';
        dayEvents.forEach(function (ev) {
          html +=
            '<div class="calendar__dot calendar__dot--' + ev.type + '"></div>';
        });
        html += "</div>";
        var eventIcon = "";
        if (dayEvents[0].type === "popup") {
          var iconName = storeIconMap[dayEvents[0].location] || "location_on";
          eventIcon =
            '<span class="material-icons calendar__event-location-icon">' +
            iconName +
            "</span>";
        }

        html +=
          '<div class="calendar__event-name">' +
          eventIcon +
          dayEvents[0].name +
          "</div>";
      }

      html += "</div>";
    }

    html += "</div>";

    // Legend
    html += '<div class="calendar__legend">';
    html +=
      '<div class="calendar__legend-item"><div class="calendar__dot calendar__dot--market"></div> Farmers Market</div>';
    html +=
      '<div class="calendar__legend-item"><div class="calendar__dot calendar__dot--popup"></div> Pop-Up Demo</div>';
    html += "</div>";

    $cal.html(html);
  }

  // Backward-compatible wrapper for the find-us page calendar
  function renderCalendar() {
    renderCalendarFor("calendar");
  }

  // Initialize and render all calendars present on the page
  function initAllCalendars() {
    var startMonth = new Date(2026, 1); // Feb 2026
    if ($("#calendar").length) {
      initCalendarInstance("calendar", startMonth);
      renderCalendarFor("calendar");
    }
    if ($("#home-calendar").length) {
      initCalendarInstance("home-calendar", startMonth);
      renderCalendarFor("home-calendar");
    }
  }

  // Nav button handlers (delegated, work for any calendar instance)
  $(document).on("click", ".js-cal-prev", function () {
    var calId = $(this).data("calendar");
    var instance = calendarInstances[calId];
    if (!instance) return;
    instance.month = new Date(
      instance.month.getFullYear(),
      instance.month.getMonth() - 1,
    );
    renderCalendarFor(calId);
    // Clear event panel only for the find-us page calendar
    if (calId === "calendar") {
      $("#event-panel").empty();
    }
  });

  $(document).on("click", ".js-cal-next", function () {
    var calId = $(this).data("calendar");
    var instance = calendarInstances[calId];
    if (!instance) return;
    instance.month = new Date(
      instance.month.getFullYear(),
      instance.month.getMonth() + 1,
    );
    renderCalendarFor(calId);
    if (calId === "calendar") {
      $("#event-panel").empty();
    }
  });

  $(document).on("click", ".calendar__day--has-event", function () {
    var dateStr = $(this).data("date");
    var calId = $(this).data("calendar");

    // Only deselect within the same calendar
    var $cal = $("#" + calId);
    $cal.find(".calendar__day").removeClass("calendar__day--selected");
    $(this).addClass("calendar__day--selected");

    var dayEvents = calendarEvents.filter(function (ev) {
      return ev.date === dateStr;
    });
    var panel = "";

    dayEvents.forEach(function (ev) {
      var typeClass =
        ev.type === "market"
          ? "event-card__type--market"
          : "event-card__type--popup";
      var typeLabel = ev.type === "market" ? "Farmers Market" : "Pop-Up Demo";
      var mapsUrl =
        "https://www.google.com/maps/search/" + encodeURIComponent(ev.address);

      panel += '<div class="event-card">';
      panel +=
        '<span class="event-card__type ' +
        typeClass +
        '">' +
        typeLabel +
        "</span>";
      if (ev.recurring) {
        panel +=
          '<span class="event-card__recurring">' + ev.recurring + "</span>";
      }
      panel += '<div class="event-card__name">' + ev.name + "</div>";
      panel += '<div class="event-card__details">';
      panel +=
        '<div class="event-card__detail"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg> ' +
        formatDate(ev.date) +
        "</div>";
      panel +=
        '<div class="event-card__detail"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> ' +
        ev.time +
        "</div>";
      panel +=
        '<div class="event-card__detail"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg> ' +
        ev.location +
        ", " +
        ev.address +
        "</div>";
      panel += "</div>";
      panel +=
        '<a href="' +
        mapsUrl +
        '" target="_blank" rel="noopener noreferrer" class="event-card__directions"><span class="material-icons">location_on</span> Get Directions</a>';
      panel += "</div>";
    });

    $("#event-panel").html(panel);
  });

  function formatDate(dateStr) {
    var parts = dateStr.split("-");
    var d = new Date(
      parseInt(parts[0]),
      parseInt(parts[1]) - 1,
      parseInt(parts[2]),
    );
    var days = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];
    var months = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];
    return (
      days[d.getDay()] +
      ", " +
      months[d.getMonth()] +
      " " +
      d.getDate() +
      ", " +
      d.getFullYear()
    );
  }

  /* --------------------------------------------------------
     STORE LOCATOR (simulated)
     -------------------------------------------------------- */
  $(document).on("click", ".js-store-search", function (e) {
    e.preventDefault();
    var $results = $(this)
      .closest(".store-locator")
      .find(".store-locator__results");
    $results.slideDown(200);
  });

  /* --------------------------------------------------------
     CONTACT FORM (simulated)
     -------------------------------------------------------- */
  $(document).on("submit", "#contact-form", function (e) {
    e.preventDefault();
    $(this).hide();
    $(this).siblings(".form-success").show();
  });

  /* --------------------------------------------------------
     CART BADGE POP ANIMATION
     -------------------------------------------------------- */
  function popCartBadge() {
    var $badge = $(".header__cart-badge");
    $badge.removeClass("header__cart-badge--pop");
    // Force reflow to restart animation
    void $badge[0].offsetWidth;
    $badge.addClass("header__cart-badge--pop");
  }

  // Hook into addToCart to trigger pop
  var _originalAddToCart = addToCart;
  addToCart = function (product) {
    _originalAddToCart(product);
    popCartBadge();
  };

  /* --------------------------------------------------------
     SCROLL-TRIGGERED ANIMATIONS
     -------------------------------------------------------- */
  function initScrollAnimations() {
    var animateTargets = [
      ".product-card",
      ".store-card",
      ".impact-card",
      ".impact__stat",
      ".info-card",
      ".event-card",
    ];
    var selector = animateTargets.join(", ");
    var $elements = $(selector);

    if (!("IntersectionObserver" in window)) {
      // Fallback: show everything immediately
      $elements.addClass("animate-in");
      return;
    }

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            $(entry.target).addClass("animate-in");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" },
    );

    $elements.each(function () {
      // Start invisible
      $(this).css("opacity", "0");
      observer.observe(this);
    });
  }

  /* --------------------------------------------------------
     INIT
     -------------------------------------------------------- */
  updateCartBadge();
  initAllCalendars();
  initScrollAnimations();
});
