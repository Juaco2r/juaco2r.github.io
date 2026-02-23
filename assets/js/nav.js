(function () {
    const btn = document.querySelector(".nav-toggle");
    const nav = document.querySelector(".nav-links");
  
    if (!btn || !nav) return;
  
    function setOpen(open) {
      nav.classList.toggle("is-open", open);
      btn.setAttribute("aria-expanded", String(open));
      btn.textContent = open ? "✕" : "☰";
    }
  
    btn.addEventListener("click", () => {
      const isOpen = nav.classList.contains("is-open");
      setOpen(!isOpen);
    });
  
    // Close menu when clicking a link (mobile UX)
    nav.addEventListener("click", (e) => {
      if (e.target && e.target.tagName === "A") setOpen(false);
    });
  
    // Close when clicking outside
    document.addEventListener("click", (e) => {
      if (!nav.classList.contains("is-open")) return;
      const clickedInside = nav.contains(e.target) || btn.contains(e.target);
      if (!clickedInside) setOpen(false);
    });
  
    // Close on Escape
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") setOpen(false);
    });
  })();