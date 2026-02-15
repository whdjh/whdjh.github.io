document.addEventListener("DOMContentLoaded", function () {
  var sections = document.querySelectorAll(".snap-section");
  if (!sections.length) return;

  // Find the scroll container (.body-inner inside .book-body)
  var scrollContainer =
    document.querySelector(".body-inner") || document;

  var observer = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
        }
      });
    },
    {
      root: scrollContainer === document ? null : scrollContainer,
      threshold: 0.15,
    }
  );

  sections.forEach(function (section) {
    observer.observe(section);
  });
});
