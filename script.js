(function () {
  "use strict";

  var root = document.documentElement;
  var CONTACT_EMAIL = "jayaprakash.gorla@gmail.com";
  var THEME_COLORS = { light: "#FAFAF9", dark: "#0B1220" };

  // The contact form is hidden until this point, so a failed script never leaves a form that can't send.
  root.classList.add("js-ready");

  /* ---------- Theme ---------- */

  var themeButton = document.querySelector(".theme-toggle");
  var darkQuery = window.matchMedia ? window.matchMedia("(prefers-color-scheme: dark)") : null;

  function effectiveTheme() {
    var chosen = root.getAttribute("data-theme");
    if (chosen === "light" || chosen === "dark") return chosen;
    return darkQuery && darkQuery.matches ? "dark" : "light";
  }

  function syncTheme() {
    var theme = effectiveTheme();
    if (themeButton) themeButton.setAttribute("aria-pressed", String(theme === "dark"));

    // The theme-color meta tags follow the system setting; once the visitor picks a theme, follow that instead.
    if (root.hasAttribute("data-theme")) {
      var metas = document.querySelectorAll('meta[name="theme-color"]');
      for (var i = 0; i < metas.length; i++) {
        metas[i].removeAttribute("media");
        metas[i].setAttribute("content", THEME_COLORS[theme]);
      }
    }
  }

  if (themeButton) {
    themeButton.addEventListener("click", function () {
      var next = effectiveTheme() === "dark" ? "light" : "dark";
      root.setAttribute("data-theme", next);
      try {
        window.localStorage.setItem("theme", next);
      } catch (error) {
        /* Storage unavailable: the choice applies until the page is closed. */
      }
      syncTheme();
    });

    if (darkQuery) {
      if (darkQuery.addEventListener) darkQuery.addEventListener("change", syncTheme);
      else if (darkQuery.addListener) darkQuery.addListener(syncTheme);
    }
  }
  syncTheme();

  /* ---------- Mobile menu ---------- */

  var header = document.querySelector(".site-header");
  var menuButton = document.querySelector(".menu-toggle");
  var nav = document.getElementById("site-nav");
  var mobileQuery = window.matchMedia ? window.matchMedia("(max-width: 39.99em)") : null;

  function menuIsOpen() {
    return menuButton.getAttribute("aria-expanded") === "true";
  }

  function setMenu(open) {
    header.setAttribute("data-menu", open ? "open" : "closed");
    menuButton.setAttribute("aria-expanded", String(open));
  }

  if (header && menuButton && nav) {
    menuButton.addEventListener("click", function () {
      setMenu(!menuIsOpen());
    });

    document.addEventListener("keydown", function (event) {
      if (event.key !== "Escape" || !menuIsOpen()) return;
      var focusWasInside = header.contains(document.activeElement);
      setMenu(false);
      if (focusWasInside) menuButton.focus();
    });

    // The panel overlays the page, so it must not stay open once focus moves on behind it.
    document.addEventListener("focusin", function (event) {
      if (menuIsOpen() && !header.contains(event.target)) setMenu(false);
    });

    document.addEventListener("click", function (event) {
      if (menuIsOpen() && !header.contains(event.target)) setMenu(false);
    });

    // After a link is chosen the panel closes, so the clicked link disappears; keep focus at the destination.
    nav.addEventListener("click", function (event) {
      var link = event.target.closest("a");
      if (!link) return;
      var wasOpen = menuIsOpen();
      setMenu(false);
      if (!wasOpen) return;

      var section = document.getElementById(link.getAttribute("href").slice(1));
      var heading = section && section.querySelector("h1, h2");
      if (heading) {
        heading.setAttribute("tabindex", "-1");
        // The browser's own jump to the section runs after this handler and resets focus, so move focus once it has.
        window.setTimeout(function () {
          heading.focus({ preventScroll: true });
        }, 0);
      }
    });

    if (mobileQuery) {
      var onViewportChange = function () {
        setMenu(false);
      };
      if (mobileQuery.addEventListener) mobileQuery.addEventListener("change", onViewportChange);
      else if (mobileQuery.addListener) mobileQuery.addListener(onViewportChange);
    }
  }

  /* ---------- Current section in the nav ---------- */

  var navLinks = Array.prototype.slice.call(document.querySelectorAll('.nav-list a[href^="#"]'));

  function setCurrent(id) {
    navLinks.forEach(function (link) {
      if (id && link.getAttribute("href") === "#" + id) link.setAttribute("aria-current", "true");
      else link.removeAttribute("aria-current");
    });
  }

  if ("IntersectionObserver" in window && navLinks.length) {
    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          if (entry.target.id === "top") setCurrent("");
          else if (entry.target.id) setCurrent(entry.target.id);
          else setCurrent("contact"); // the footer: the short last section may never reach the observer band
        });
      },
      { rootMargin: "-45% 0px -50% 0px", threshold: 0 }
    );

    var watched = navLinks
      .map(function (link) {
        return document.getElementById(link.getAttribute("href").slice(1));
      })
      .concat([document.getElementById("top")]);

    watched.forEach(function (section) {
      if (section) observer.observe(section);
    });

    var footer = document.querySelector(".site-footer");
    if (footer) {
      new IntersectionObserver(
        function (entries) {
          if (entries[0].isIntersecting) setCurrent("contact");
        },
        { threshold: 0.6 }
      ).observe(footer);
    }
  }

  /* ---------- Contact form ---------- */

  var form = document.getElementById("contact-form");

  if (form) {
    var statusEl = document.getElementById("form-status");
    var alertEl = document.getElementById("form-alert");
    var submitButton = form.querySelector('button[type="submit"]');
    var fields = Array.prototype.slice.call(form.querySelectorAll("input[required], textarea[required]"));
    var honeypot = form.elements.company;
    var emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    var sending = false;
    var alertTimer = null;

    form.noValidate = true;

    try {
      if (window.emailjs) window.emailjs.init("2mX8ihjioWvOLgcMs");
    } catch (error) {
      /* A failed init surfaces at send time, with an email fallback. */
    }

    var errorFor = function (field) {
      var value = field.value.trim();
      if (!value) return field.getAttribute("data-error-required") || "This field is required.";
      if (field.type === "email" && !emailPattern.test(value)) {
        return field.getAttribute("data-error-format") || "Enter a valid email address.";
      }
      return "";
    };

    var showError = function (field, message) {
      var output = document.getElementById(field.id + "-error");
      if (message) field.setAttribute("aria-invalid", "true");
      else field.removeAttribute("aria-invalid");
      output.textContent = message;
    };

    var clearFeedback = function () {
      window.clearTimeout(alertTimer);
      statusEl.textContent = "";
      alertEl.textContent = "";
    };

    // The alert is cleared first and filled a moment later, so a repeated failure is announced again.
    var showFailure = function () {
      statusEl.textContent = "";
      alertEl.textContent = "";
      window.clearTimeout(alertTimer);
      alertTimer = window.setTimeout(function () {
        var link = document.createElement("a");
        link.href = "mailto:" + CONTACT_EMAIL;
        link.textContent = CONTACT_EMAIL;
        alertEl.textContent = "Your message couldn't be sent. Try again, or email me directly at ";
        alertEl.appendChild(link);
        alertEl.appendChild(document.createTextNode("."));
      }, 100);
    };

    var setSending = function (state) {
      sending = state;
      if (state) submitButton.setAttribute("aria-disabled", "true");
      else submitButton.removeAttribute("aria-disabled");
      submitButton.textContent = state ? "Sending…" : "Send message";
    };

    fields.forEach(function (field) {
      // Blur only checks what the visitor actually typed; empty required fields are reported on submit.
      field.addEventListener("blur", function () {
        if (field.value.trim() || field.hasAttribute("aria-invalid")) showError(field, errorFor(field));
      });
      field.addEventListener("input", function () {
        if (field.hasAttribute("aria-invalid")) showError(field, errorFor(field));
      });
    });

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      if (sending) return;
      clearFeedback();

      var firstInvalid = null;
      fields.forEach(function (field) {
        var message = errorFor(field);
        showError(field, message);
        if (message && !firstInvalid) firstInvalid = field;
      });
      if (firstInvalid) {
        firstInvalid.focus();
        return;
      }

      // Bots fill every field; a filled honeypot is dropped without sending.
      if (honeypot && honeypot.value) {
        form.reset();
        return;
      }

      if (!window.emailjs) {
        showFailure();
        return;
      }

      var params = { to_email: CONTACT_EMAIL };
      new FormData(form).forEach(function (value, key) {
        if (key !== "company") params[key] = value;
      });

      setSending(true);
      statusEl.textContent = "Sending your message…";

      Promise.resolve()
        .then(function () {
          return window.emailjs.send("service_11c2jzf", "template_wct97ga", params);
        })
        .then(
          function () {
            form.reset();
            statusEl.textContent = "Message sent. Thanks for reaching out; I'll reply by email.";
          },
          function (error) {
            if (window.console) console.error("EmailJS error:", error);
            showFailure();
          }
        )
        .then(function () {
          setSending(false);
        });
    });

    // "Ask me about <project>" links jump to the form and start the message for the visitor.
    Array.prototype.forEach.call(document.querySelectorAll("a[data-topic]"), function (link) {
      link.addEventListener("click", function () {
        var message = form.elements.message;
        if (message && !message.value.trim()) {
          message.value = "Hi Jaya, I'd like to hear more about " + link.getAttribute("data-topic") + ".";
        }
        var target = fields.filter(function (field) {
          return !field.value.trim();
        })[0];
        // Same reason as the menu: let the jump to #contact finish before focus moves.
        if (target) {
          window.setTimeout(function () {
            target.focus({ preventScroll: true });
          }, 0);
        }
      });
    });
  }

  /* ---------- Print: show the collapsed project details ---------- */

  var reopened = [];

  window.addEventListener("beforeprint", function () {
    reopened = [];
    Array.prototype.forEach.call(document.querySelectorAll("details:not([open])"), function (details) {
      details.setAttribute("open", "");
      reopened.push(details);
    });
  });

  window.addEventListener("afterprint", function () {
    reopened.forEach(function (details) {
      details.removeAttribute("open");
    });
    reopened = [];
  });
})();
