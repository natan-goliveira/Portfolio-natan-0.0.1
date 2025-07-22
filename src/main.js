

document.addEventListener("DOMContentLoaded", () => {
  const mobileMenuButton = document.getElementById("mobile-menu-button");
  const mobileMenu = document.getElementById("mobile-menu");
  const navLinks = document.querySelectorAll(
    "#mobile-menu .mobile-nav-link, #navbar .nav-link"
  ); // Both mobile and desktop links
  const contactButtons = document.querySelectorAll(".contact-btn"); // All connect/contact buttons

  // Function to toggle mobile menu
  const toggleMobileMenu = () => {
    const isExpanded =
      mobileMenuButton.getAttribute("aria-expanded") === "true";
    mobileMenuButton.setAttribute("aria-expanded", !isExpanded);

    if (mobileMenu.classList.contains("h-0")) {
      mobileMenu.classList.remove("h-0");
      mobileMenu.classList.add("h-auto", "max-h-screen"); // Allow height to adjust
      document
        .getElementById("line1")
        .classList.add("rotate-45", "translate-y-2");
      document.getElementById("line2").classList.add("opacity-0");
      document
        .getElementById("line3")
        .classList.add("-rotate-45", "-translate-y-2");
    } else {
      mobileMenu.classList.add("h-0");
      mobileMenu.classList.remove("h-auto", "max-h-screen");
      document
        .getElementById("line1")
        .classList.remove("rotate-45", "translate-y-2");
      document.getElementById("line2").classList.remove("opacity-0");
      document
        .getElementById("line3")
        .classList.remove("-rotate-45", "-translate-y-2");
    }
  };

  mobileMenuButton.addEventListener("click", toggleMobileMenu);

  // Close mobile menu when a link is clicked
  navLinks.forEach((link) => {
    link.addEventListener("click", (event) => {
      // Prevent default anchor behavior if it's the mobile menu link to allow smooth scroll
      if (link.classList.contains("mobile-nav-link")) {
        // Close menu
        if (!mobileMenu.classList.contains("h-0")) {
          toggleMobileMenu();
        }
      }
      // Smooth scroll
      const targetId = link.getAttribute("href").substring(1);
      const targetElement = document.getElementById(targetId);
      if (targetElement) {
        event.preventDefault(); // Prevent instant jump
        targetElement.scrollIntoView({ behavior: "smooth" });
      }
    });
  });

  // Smooth scroll for all contact buttons (assuming they link to #contact or similar)
  contactButtons.forEach((button) => {
    button.addEventListener("click", (event) => {
      event.preventDefault();
      const targetId = "contact"; // Assuming all contact buttons go to contact section
      const targetElement = document.getElementById(targetId);
      if (targetElement) {
        targetElement.scrollIntoView({ behavior: "smooth" });
      }
      // Close mobile menu if it was open
      if (!mobileMenu.classList.contains("h-0")) {
        toggleMobileMenu();
      }
    });
  });

  // Navbar shrink/style change on scroll (optional)
  const navbar = document.getElementById("navbar");
  const initialNavbarHeight = navbar.offsetHeight; // Get initial height

  window.addEventListener("scroll", () => {
    if (window.scrollY > initialNavbarHeight) {
      navbar.classList.add(
        "py-2",
        "bg-gray-900/90",
        "border-b-2",
        "border-cyan-400"
      ); // Add more pronounced styles
      navbar.classList.remove(
        "py-3",
        "bg-gray-900/70",
        "border-b",
        "border-cyan-500/30"
      );
    } else {
      navbar.classList.remove(
        "py-2",
        "bg-gray-900/90",
        "border-b-2",
        "border-cyan-400"
      );
      navbar.classList.add(
        "py-3",
        "bg-gray-900/70",
        "border-b",
        "border-cyan-500/30"
      );
    }
  });
});
