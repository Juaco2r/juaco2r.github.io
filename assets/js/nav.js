document.addEventListener("DOMContentLoaded", () => {
    const btn = document.querySelector(".nav-toggle");
    const nav = document.querySelector("#primary-nav");
  
    if (!btn || !nav) return;
  
    function setOpen(open) {
      nav.classList.toggle("is-open", open);
      btn.setAttribute("aria-expanded", String(open));
      btn.textContent = open ? "✕" : "☰";
    }
  
    btn.addEventListener("click", () => {
      setOpen(!nav.classList.contains("is-open"));
    });
  
    nav.addEventListener("click", (e) => {
      if (e.target && e.target.tagName === "A") setOpen(false);
    });
  
    document.addEventListener("click", (e) => {
      if (!nav.classList.contains("is-open")) return;
      const clickedInside = nav.contains(e.target) || btn.contains(e.target);
      if (!clickedInside) setOpen(false);
    });
  
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") setOpen(false);
    });
  });