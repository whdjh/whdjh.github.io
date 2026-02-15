document.addEventListener("DOMContentLoaded", function () {
  var targets = document.querySelectorAll(
    ".body-inner h2, .body-inner h3, .body-inner h4, " +
    ".body-inner p, .body-inner ul, .body-inner ol, " +
    ".body-inner table, .body-inner hr, .body-inner blockquote"
  );

  if (!targets.length) return;

  var observer = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1 }
  );

  targets.forEach(function (el) {
    observer.observe(el);
  });
});
