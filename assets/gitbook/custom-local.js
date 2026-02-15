document.addEventListener("DOMContentLoaded", function () {
  var sections = document.querySelectorAll(".snap-section");
  if (!sections.length) return;

  var currentIndex = 0;
  var isScrolling = false;
  var cooldown = 800;

  // Find the actual scroll container
  var scrollContainer = document.querySelector(".body-inner");
  if (!scrollContainer) return;

  function scrollToSection(index) {
    if (index < 0 || index >= sections.length) return;
    isScrolling = true;
    currentIndex = index;

    sections[index].scrollIntoView({ behavior: "smooth", block: "start" });

    setTimeout(function () {
      isScrolling = false;
    }, cooldown);
  }

  // Wheel event — one scroll = one section
  scrollContainer.addEventListener(
    "wheel",
    function (e) {
      e.preventDefault();
      if (isScrolling) return;

      if (e.deltaY > 0 && currentIndex < sections.length - 1) {
        scrollToSection(currentIndex + 1);
      } else if (e.deltaY < 0 && currentIndex > 0) {
        scrollToSection(currentIndex - 1);
      }
    },
    { passive: false }
  );

  // Touch support for mobile
  var touchStartY = 0;
  scrollContainer.addEventListener("touchstart", function (e) {
    touchStartY = e.touches[0].clientY;
  }, { passive: true });

  scrollContainer.addEventListener("touchend", function (e) {
    if (isScrolling) return;
    var diff = touchStartY - e.changedTouches[0].clientY;

    if (diff > 50 && currentIndex < sections.length - 1) {
      scrollToSection(currentIndex + 1);
    } else if (diff < -50 && currentIndex > 0) {
      scrollToSection(currentIndex - 1);
    }
  }, { passive: true });

  // Keyboard support
  document.addEventListener("keydown", function (e) {
    if (isScrolling) return;

    if ((e.key === "ArrowDown" || e.key === "PageDown") && currentIndex < sections.length - 1) {
      e.preventDefault();
      scrollToSection(currentIndex + 1);
    } else if ((e.key === "ArrowUp" || e.key === "PageUp") && currentIndex > 0) {
      e.preventDefault();
      scrollToSection(currentIndex - 1);
    }
  });

  // Fade-in observer
  var observer = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
        }
      });
    },
    { threshold: 0.15 }
  );

  sections.forEach(function (section) {
    observer.observe(section);
  });

  // Show first section immediately
  sections[0].classList.add("is-visible");
});
