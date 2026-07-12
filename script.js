const body = document.body;
const nav = document.querySelector("[data-nav]");
const toggle = document.querySelector(".menu-toggle");
const links = document.querySelectorAll(".nav-links a");
const cursor = document.querySelector(".cursor");
const revealItems = document.querySelectorAll(".reveal");
const parallaxImages = document.querySelectorAll(".parallax-img");
const gallery = document.querySelector("[data-gallery]");
const reviews = document.querySelectorAll("[data-reviews] .review-card");
const reserveForm = document.querySelector(".reserve-card");
const formNote = document.querySelector("[data-form-note]");

window.addEventListener("load", () => {
  setTimeout(() => body.classList.add("loaded"), 450);
});

const setNavState = () => {
  nav.classList.toggle("scrolled", window.scrollY > 36);
};

setNavState();
window.addEventListener("scroll", setNavState, { passive: true });

toggle.addEventListener("click", () => {
  const isOpen = body.classList.toggle("menu-open");
  toggle.setAttribute("aria-expanded", String(isOpen));
});

links.forEach((link) => {
  link.addEventListener("click", () => {
    body.classList.remove("menu-open");
    toggle.setAttribute("aria-expanded", "false");
  });
});

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add("in-view");
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.16, rootMargin: "0px 0px -8% 0px" });

revealItems.forEach((item) => observer.observe(item));

let ticking = false;
const updateParallax = () => {
  const scrollY = window.scrollY;
  parallaxImages.forEach((image) => {
    const rect = image.parentElement.getBoundingClientRect();
    const offset = (rect.top + scrollY - scrollY) * -0.035;
    image.style.transform = `translate3d(0, ${offset}px, 0) scale(1.09)`;
  });
  ticking = false;
};

window.addEventListener("scroll", () => {
  if (!ticking) {
    requestAnimationFrame(updateParallax);
    ticking = true;
  }
}, { passive: true });

document.querySelectorAll(".ripple").forEach((button) => {
  button.addEventListener("click", (event) => {
    const rect = button.getBoundingClientRect();
    const dot = document.createElement("span");
    const size = Math.max(rect.width, rect.height);
    dot.className = "ripple-dot";
    dot.style.width = `${size}px`;
    dot.style.height = `${size}px`;
    dot.style.left = `${event.clientX - rect.left - size / 2}px`;
    dot.style.top = `${event.clientY - rect.top - size / 2}px`;
    button.appendChild(dot);
    dot.addEventListener("animationend", () => dot.remove());
  });
});

if (cursor && matchMedia("(pointer: fine)").matches) {
  window.addEventListener("pointermove", (event) => {
    cursor.style.left = `${event.clientX}px`;
    cursor.style.top = `${event.clientY}px`;
  });

  document.querySelectorAll("a, button, input, .feature-card, .gallery-card, .menu-panel").forEach((item) => {
    item.addEventListener("pointerenter", () => cursor.classList.add("grow"));
    item.addEventListener("pointerleave", () => cursor.classList.remove("grow"));
  });
}

document.querySelectorAll(".magnetic").forEach((item) => {
  item.addEventListener("pointermove", (event) => {
    const rect = item.getBoundingClientRect();
    const x = (event.clientX - rect.left - rect.width / 2) * 0.18;
    const y = (event.clientY - rect.top - rect.height / 2) * 0.18;
    item.style.transform = `translate(${x}px, ${y}px)`;
  });
  item.addEventListener("pointerleave", () => {
    item.style.transform = "";
  });
});

if (gallery && matchMedia("(pointer: fine)").matches) {
  gallery.addEventListener("pointermove", (event) => {
    const center = window.innerWidth / 2;
    const move = (event.clientX - center) * -0.018;
    gallery.style.transform = `translate3d(${move}px, 0, 0)`;
  });
  gallery.addEventListener("pointerleave", () => {
    gallery.style.transform = "";
  });
}

let reviewIndex = 0;
setInterval(() => {
  if (!reviews.length) return;
  reviews[reviewIndex].classList.remove("active");
  reviewIndex = (reviewIndex + 1) % reviews.length;
  reviews[reviewIndex].classList.add("active");
}, 3800);

if (reserveForm) {
  reserveForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const data = new FormData(reserveForm);
    const name = data.get("name") || "Guest";
    const guests = data.get("guests") || "2";
    const time = data.get("time") || "your selected time";
    formNote.textContent = `${name}, your table request for ${guests} at ${time} is ready. Please call to confirm availability.`;
  });
}

document.querySelectorAll(".menu-panel").forEach((panel) => {
  panel.addEventListener("pointermove", (event) => {
    const rect = panel.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width - 0.5) * 8;
    const y = ((event.clientY - rect.top) / rect.height - 0.5) * -8;
    panel.style.transform = `translateY(-10px) rotateX(${y}deg) rotateY(${x}deg)`;
  });
  panel.addEventListener("pointerleave", () => {
    panel.style.transform = "";
  });
});
