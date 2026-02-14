(function () {
  "use strict";

  function initNav() {
    /* ─── Header scroll effect ─── */
    var header = document.getElementById("site-header");
    if (!header) return; // partials not loaded yet
    var mobileMenuEl = document.getElementById("mobile-menu");
    function onScroll() {
      if (window.scrollY > 16) {
        header.classList.add("scrolled");
        if (mobileMenuEl) mobileMenuEl.style.top = "80px";
      } else {
        header.classList.remove("scrolled");
        if (mobileMenuEl) mobileMenuEl.style.top = "120px";
      }
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    /* ─── Mobile menu ─── */
    var hamburger = document.getElementById("hamburger");
    var mobileMenu = document.getElementById("mobile-menu");
    if (!hamburger || !mobileMenu) return;
    var mobileLinks = mobileMenu.querySelectorAll(".mobile-nav-link");

    function toggleMenu() {
      var isOpen = hamburger.classList.toggle("open");
      mobileMenu.classList.toggle("open", isOpen);
      hamburger.setAttribute("aria-expanded", isOpen);
      hamburger.setAttribute(
        "aria-label",
        isOpen ? "Close menu" : "Open menu",
      );
      mobileMenu.setAttribute("aria-hidden", !isOpen);
    }

    hamburger.addEventListener("click", toggleMenu);

    mobileLinks.forEach(function (link) {
      link.addEventListener("click", function () {
        toggleMenu();
      });
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && hamburger.classList.contains("open")) {
        toggleMenu();
      }
    });
  }

  /* Run immediately if partials already loaded, otherwise wait */
  if (document.getElementById("site-header")) {
    initNav();
  } else {
    document.addEventListener("includes:loaded", initNav);
  }

  /* ─── Scroll-triggered reveal animations ─── */
  var reveals = document.querySelectorAll(
    ".reveal, .reveal-left, .reveal-scale",
  );

  if ("IntersectionObserver" in window) {
    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.15,
        rootMargin: "0px 0px -60px 0px",
      },
    );

    reveals.forEach(function (el) {
      observer.observe(el);
    });
  } else {
    /* Fallback: show everything */
    reveals.forEach(function (el) {
      el.classList.add("visible");
    });
  }

  /* ─── Project slide image reveal effect ─── */
  var slides = document.querySelectorAll(".project-slide");

  if ("IntersectionObserver" in window) {
    var slideObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("in-view");
            slideObserver.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.2,
      },
    );

    slides.forEach(function (slide) {
      slideObserver.observe(slide);
    });
  }

  /* ─── Carousel Functionality ─── */
  var instagramCarousel = document.querySelector(".instagram-carousel");
  if (instagramCarousel) {
    var carouselDir = instagramCarousel.getAttribute("data-carousel-dir");
    var track = instagramCarousel.querySelector(".carousel-track");
    var dotsContainer = instagramCarousel.querySelector(".carousel-dots");
    var prevBtn = instagramCarousel.querySelector(".carousel-arrow-prev");
    var nextBtn = instagramCarousel.querySelector(".carousel-arrow-next");

    // List of images in the aoni directory
    var images = [
      "002_how2sex_foreplay.png",
      "003_how2sex_protection.png",
      "006_how2sex_roleplay.png",
      "007_how2sex_booty call.png",
      "009_how2sex_toys.png",
      "012_how2sex_signals.png",
      "w1_animalsexspecs_three-d_colorbg_fb.png",
      "w2_animalsexspecs_human-style_fb.png",
      "w3_animalsexspecs_12-seconds_fb.png",
      "w3_sexspecs_130000_fb.png",
      "w3_sexspecs_teamwork_fb.png",
      "w4_animalsexspecs_poop-play_fb.png",
      "w4_sexspecs_average-ejaculation_fb.png",
      "w4_sexspecs_grandma_fb.png",
    ];

    var currentIndex = 0;
    var totalSlides = images.length;
    var autoPlayInterval = null;
    var autoPlayDelay = 7000;
    var userHasInteracted = false; // Track if user has manually controlled carousel

    // Dynamically create slides
    images.forEach(function (imageName, index) {
      var slide = document.createElement("div");
      slide.className = "carousel-slide" + (index === 0 ? " active" : "");
      var img = document.createElement("img");
      img.src = carouselDir + "/" + imageName;
      img.alt = "Aoni campaign " + (index + 1);
      slide.appendChild(img);
      track.appendChild(slide);
    });

    // Dynamically create dots
    images.forEach(function (_, index) {
      var dot = document.createElement("button");
      dot.className = "carousel-dot" + (index === 0 ? " active" : "");
      dot.setAttribute("aria-label", "Go to slide " + (index + 1));
      dotsContainer.appendChild(dot);
    });

    var carouselSlides = Array.from(track.querySelectorAll(".carousel-slide"));
    var dots = Array.from(dotsContainer.querySelectorAll(".carousel-dot"));

    // Update carousel position and active states
    function updateCarousel(index) {
      // Loop infinitely
      if (index < 0) {
        currentIndex = totalSlides - 1;
      } else if (index >= totalSlides) {
        currentIndex = 0;
      } else {
        currentIndex = index;
      }

      // Move track
      track.style.transform = "translateX(-" + currentIndex * 100 + "%)";

      // Update active slide
      carouselSlides.forEach(function (slide, i) {
        if (i === currentIndex) {
          slide.classList.add("active");
        } else {
          slide.classList.remove("active");
        }
      });

      // Update active dot
      dots.forEach(function (dot, i) {
        if (i === currentIndex) {
          dot.classList.add("active");
        } else {
          dot.classList.remove("active");
        }
      });
    }

    // Auto-play functionality
    function startAutoPlay() {
      // Don't restart autoplay if user has manually interacted
      if (userHasInteracted) {
        return;
      }
      // Clear any existing interval first
      stopAutoPlay();
      autoPlayInterval = setInterval(function () {
        updateCarousel(currentIndex + 1);
      }, autoPlayDelay);
    }

    function stopAutoPlay() {
      if (autoPlayInterval) {
        clearInterval(autoPlayInterval);
        autoPlayInterval = null;
      }
    }

    function disableAutoPlay() {
      userHasInteracted = true;
      stopAutoPlay();
    }

    // Previous slide
    prevBtn.addEventListener("click", function () {
      updateCarousel(currentIndex - 1);
      disableAutoPlay();
    });

    // Next slide
    nextBtn.addEventListener("click", function () {
      updateCarousel(currentIndex + 1);
      disableAutoPlay();
    });

    // Dot navigation
    dots.forEach(function (dot, index) {
      dot.addEventListener("click", function () {
        updateCarousel(index);
        disableAutoPlay();
      });
    });

    // Touch/swipe support
    var touchStartX = 0;
    var touchEndX = 0;
    var swipeThreshold = 50;

    instagramCarousel.addEventListener(
      "touchstart",
      function (e) {
        touchStartX = e.changedTouches[0].screenX;
      },
      { passive: true },
    );

    instagramCarousel.addEventListener(
      "touchend",
      function (e) {
        touchEndX = e.changedTouches[0].screenX;
        handleSwipe();
      },
      { passive: true },
    );

    function handleSwipe() {
      var swipeDistance = touchStartX - touchEndX;

      if (Math.abs(swipeDistance) > swipeThreshold) {
        if (swipeDistance > 0) {
          updateCarousel(currentIndex + 1);
        } else {
          updateCarousel(currentIndex - 1);
        }
        disableAutoPlay();
      }
    }

    // Keyboard navigation
    instagramCarousel.addEventListener("keydown", function (e) {
      if (e.key === "ArrowLeft") {
        updateCarousel(currentIndex - 1);
        disableAutoPlay();
      } else if (e.key === "ArrowRight") {
        updateCarousel(currentIndex + 1);
        disableAutoPlay();
      }
    });

    // Pause auto-play on hover (but don't restart if user has interacted)
    instagramCarousel.addEventListener("mouseenter", stopAutoPlay);
    instagramCarousel.addEventListener("mouseleave", startAutoPlay);

    // Make carousel focusable
    instagramCarousel.setAttribute("tabindex", "0");

    // Initialize carousel and start auto-play
    updateCarousel(0);
    startAutoPlay();
  }

  /* ─── Paper Stack Functionality ─── */
  var paperStack = document.querySelector(".paper-stack");
  if (paperStack) {
    var mediaDir = paperStack.getAttribute("data-media-dir");

    /* ═══════════════════════════════════════════════════════
       CURRICULUM DESIGN - MEDIA FILES
       ═══════════════════════════════════════════════════════

       Add new teaching materials here!

       For VIDEOS (.mov + .webm):
       - Only include the base name (without extension)
       - Example: { name: "filename", type: "video" }
       - The code automatically loads both .mov and .webm versions

       For IMAGES (.png, .jpg):
       - Include the full filename with extension
       - Example: { name: "filename.png", type: "image" }

       ═══════════════════════════════════════════════════════ */
    var mediaFiles = [
      // Videos (base name only - .mov and .webm auto-loaded)
      { name: "character-design", type: "video" },
      { name: "freytag", type: "video" },
      { name: "protagonist", type: "video" },

      // Images (full filename with extension)
      { name: "freytag.png", type: "image" },
      { name: "story-starters.png", type: "image" },
      { name: "types-of-characters.png", type: "image" },

      // Add your new files below this line:
      // { name: "new-video", type: "video" },
      // { name: "new-image.png", type: "image" },
    ];

    var zIndexCounter = 10;

    // Store card positions for collision detection
    var cardPositions = [];

    // Function to check if a position overlaps with existing cards
    function isPositionOccupied(x, y, minDistance, excludeIndex) {
      for (var i = 0; i < cardPositions.length; i++) {
        // Skip the card we're currently moving
        if (i === excludeIndex) continue;

        var pos = cardPositions[i];
        if (!pos) continue; // Skip if no position stored yet

        var distance = Math.sqrt(
          Math.pow(x - pos.x, 2) + Math.pow(y - pos.y, 2),
        );
        if (distance < minDistance) {
          return true; // Too close to another card
        }
      }
      return false; // Position is free
    }

    // Function to generate random messy coordinates with collision avoidance
    function getRandomTransform(cardIndex, avoidCollision) {
      var rotate = Math.floor(Math.random() * 70) - 35; // -35deg to 35deg
      var isMobile = window.innerWidth <= 767;
      var x, y;
      var maxAttempts = 20; // Try up to 20 times to find a free spot
      var minDistance = isMobile ? 120 : 180; // Minimum distance between cards

      if (avoidCollision) {
        // Try to find a non-overlapping position
        for (var attempt = 0; attempt < maxAttempts; attempt++) {
          if (isMobile) {
            x = Math.floor(Math.random() * 200) - 100;
            y = Math.floor(Math.random() * 250) - 125;
          } else {
            x = Math.floor(Math.random() * 700) - 350;
            y = Math.floor(Math.random() * 600) - 300;
          }

          if (!isPositionOccupied(x, y, minDistance, cardIndex)) {
            // Found a free spot!
            cardPositions[cardIndex] = { x: x, y: y };
            break;
          }
        }
        // If all attempts failed, use the last generated position anyway
        if (attempt === maxAttempts) {
          cardPositions[cardIndex] = { x: x, y: y };
        }
      } else {
        // No collision detection (for initial setup)
        if (isMobile) {
          x = Math.floor(Math.random() * 200) - 100;
          y = Math.floor(Math.random() * 250) - 125;
        } else {
          x = Math.floor(Math.random() * 700) - 350;
          y = Math.floor(Math.random() * 600) - 300;
        }
        cardPositions[cardIndex] = { x: x, y: y };
      }

      var scale = isMobile ? 0.75 : 1.5;
      return (
        "translate(calc(-50% + " +
        x +
        "px), calc(-50% + " +
        y +
        "px)) rotate(" +
        rotate +
        "deg) scale(" +
        scale +
        ")"
      );
    }

    // Create paper cards
    mediaFiles.forEach(function (media, index) {
      var card = document.createElement("div");
      card.className = "paper-card";
      card.style.zIndex = index + 1;
      card.dataset.cardIndex = index; // Store index for later reference
      card.style.transform = getRandomTransform(index, false); // Initial setup, no collision checking needed

      if (media.type === "video") {
        var video = document.createElement("video");
        video.autoplay = true;
        video.loop = true;
        video.muted = true;
        video.playsInline = true;

        var sourceMov = document.createElement("source");
        sourceMov.src = mediaDir + "/" + media.name + ".mov";
        sourceMov.type = 'video/mp4; codecs="hvc1"';

        var sourceWebm = document.createElement("source");
        sourceWebm.src = mediaDir + "/" + media.name + ".webm";
        sourceWebm.type = "video/webm";

        video.appendChild(sourceMov);
        video.appendChild(sourceWebm);

        // Ensure video plays
        video.addEventListener("loadeddata", function () {
          video.play().catch(function (err) {
            console.log("Video autoplay failed:", err);
          });
        });

        card.appendChild(video);
      } else {
        var img = document.createElement("img");
        img.src = mediaDir + "/" + media.name;
        img.alt = "Teaching material";
        img.onerror = function () {
          console.error("Failed to load image:", img.src);
        };
        img.onload = function () {
          console.log("Image loaded:", img.src);
        };
        card.appendChild(img);
      }

      paperStack.appendChild(card);
    });

    var cards = Array.from(paperStack.querySelectorAll(".paper-card"));

    // ─── Drag functionality ───
    var draggedCard = null;
    var dragStartX = 0;
    var dragStartY = 0;
    var cardStartX = 0;
    var cardStartY = 0;
    var isDragging = false;

    cards.forEach(function (card) {
      // Mouse events
      card.addEventListener("mousedown", function (e) {
        // Don't start drag if clicking the active (enlarged) card
        if (card.classList.contains("active")) return;

        e.preventDefault();
        isDragging = false;
        draggedCard = card;
        dragStartX = e.clientX;
        dragStartY = e.clientY;

        // Get current position from cardPositions array
        var cardIndex = parseInt(card.dataset.cardIndex);
        var pos = cardPositions[cardIndex];
        cardStartX = pos ? pos.x : 0;
        cardStartY = pos ? pos.y : 0;

        // Bring to front
        zIndexCounter++;
        card.style.zIndex = zIndexCounter;

        // Add smooth transition for better UX
        card.style.transition = "none";
      });

      // Touch events
      card.addEventListener("touchstart", function (e) {
        // Don't start drag if clicking the active (enlarged) card
        if (card.classList.contains("active")) return;

        isDragging = false;
        draggedCard = card;
        var touch = e.touches[0];
        dragStartX = touch.clientX;
        dragStartY = touch.clientY;

        // Get current position from cardPositions array
        var cardIndex = parseInt(card.dataset.cardIndex);
        var pos = cardPositions[cardIndex];
        cardStartX = pos ? pos.x : 0;
        cardStartY = pos ? pos.y : 0;

        // Bring to front
        zIndexCounter++;
        card.style.zIndex = zIndexCounter;

        // Add smooth transition for better UX
        card.style.transition = "none";
      });

      // Click handler for enlarging/dismissing cards
      card.addEventListener("click", function (e) {
        // Only enlarge if we haven't been dragging
        if (isDragging) return;

        e.stopPropagation();

        // If clicking the active card, dismiss it back to the pile
        if (card.classList.contains("active")) {
          card.classList.remove("active");
          card.style.transition = "";
          var cardIndex = parseInt(card.dataset.cardIndex);
          card.style.transform = getRandomTransform(cardIndex, true);
          return;
        }

        // Handle old active card
        var currentActive = paperStack.querySelector(".active");
        if (currentActive) {
          currentActive.classList.remove("active");
          currentActive.style.transition = "";
          var oldCardIndex = parseInt(currentActive.dataset.cardIndex);
          currentActive.style.transform = getRandomTransform(oldCardIndex, true);
        }

        // Handle new active card
        zIndexCounter++;
        card.style.zIndex = zIndexCounter;
        card.classList.add("active");
      });
    });

    // Mouse move
    document.addEventListener("mousemove", function (e) {
      if (!draggedCard) return;

      var deltaX = e.clientX - dragStartX;
      var deltaY = e.clientY - dragStartY;

      // If moved more than 5px, consider it a drag
      if (Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5) {
        isDragging = true;
      }

      var newX = cardStartX + deltaX;
      var newY = cardStartY + deltaY;

      // Update card position
      var cardIndex = parseInt(draggedCard.dataset.cardIndex);
      var isMobile = window.innerWidth <= 767;
      var scale = isMobile ? 0.75 : 1.5;

      // Extract rotation from current transform
      var currentTransform = draggedCard.style.transform;
      var rotateMatch = currentTransform.match(/rotate\(([^)]+)\)/);
      var rotation = rotateMatch ? rotateMatch[1] : "0deg";

      draggedCard.style.transform =
        "translate(calc(-50% + " +
        newX +
        "px), calc(-50% + " +
        newY +
        "px)) rotate(" +
        rotation +
        ") scale(" +
        scale +
        ")";

      // Update position in tracking array
      cardPositions[cardIndex] = { x: newX, y: newY };
    });

    // Touch move
    document.addEventListener(
      "touchmove",
      function (e) {
        if (!draggedCard) return;

        var touch = e.touches[0];
        var deltaX = touch.clientX - dragStartX;
        var deltaY = touch.clientY - dragStartY;

        // If moved more than 5px, consider it a drag
        if (Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5) {
          isDragging = true;
        }

        var newX = cardStartX + deltaX;
        var newY = cardStartY + deltaY;

        // Update card position
        var cardIndex = parseInt(draggedCard.dataset.cardIndex);
        var isMobile = window.innerWidth <= 767;
        var scale = isMobile ? 0.75 : 1.5;

        // Extract rotation from current transform
        var currentTransform = draggedCard.style.transform;
        var rotateMatch = currentTransform.match(/rotate\(([^)]+)\)/);
        var rotation = rotateMatch ? rotateMatch[1] : "0deg";

        draggedCard.style.transform =
          "translate(calc(-50% + " +
          newX +
          "px), calc(-50% + " +
          newY +
          "px)) rotate(" +
          rotation +
          ") scale(" +
          scale +
          ")";

        // Update position in tracking array
        cardPositions[cardIndex] = { x: newX, y: newY };
      },
      { passive: true },
    );

    // Mouse up
    document.addEventListener("mouseup", function () {
      if (draggedCard) {
        draggedCard.style.transition = "";
        draggedCard = null;

        // Reset isDragging after a short delay to prevent click from firing
        setTimeout(function () {
          isDragging = false;
        }, 10);
      }
    });

    // Touch end
    document.addEventListener("touchend", function () {
      if (draggedCard) {
        draggedCard.style.transition = "";
        draggedCard = null;

        // Reset isDragging after a short delay to prevent click from firing
        setTimeout(function () {
          isDragging = false;
        }, 10);
      }
    });

    // Click outside to dismiss active card
    paperStack.addEventListener("click", function (e) {
      // Only dismiss if clicking the paperStack itself (not a card)
      if (e.target === paperStack) {
        var currentActive = paperStack.querySelector(".active");
        if (currentActive) {
          currentActive.classList.remove("active");
          var cardIndex = parseInt(currentActive.dataset.cardIndex);
          currentActive.style.transform = getRandomTransform(cardIndex, true);
        }
      }
    });
  }
})();
