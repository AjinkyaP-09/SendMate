const mobileMenuToggle = document.getElementById("mobile-menu-toggle");
const navbarLinks = document.getElementById("navbar-links");
const mobileDropdown = document.getElementById("mobile-dropdown");

//profile-dropdown

const dropdownToggle = document.getElementById("dropdownToggle");
const dropdownMenu = document.getElementById("dropdownMenu");

//help-dropdown

const helpDropdownToggle = document.getElementById("helpDropdownToggle");
const helpDropdownMenu = document.getElementById("helpDropdownMenu");

//mobile-section

mobileMenuToggle.addEventListener("click", () => {
  mobileDropdown.classList.toggle("hidden");
});


// Toggle profile dropdown menu visibility
// Wait for the DOM to load
document.addEventListener("DOMContentLoaded", function () {
    const dropdownToggle = document.getElementById("dropdownToggle");
    const dropdownMenu = document.getElementById("dropdownMenu");

    // Toggle dropdown menu visibility on click
    dropdownToggle.addEventListener("click", function (event) {
        event.preventDefault(); // Prevent default anchor click behavior
        dropdownMenu.classList.toggle("hidden"); // Toggle the 'hidden' class
    });

    // Close the dropdown menu if clicking outside of it
    window.addEventListener("click", function (event) {
        if (!dropdownToggle.contains(event.target) && !dropdownMenu.contains(event.target)) {
            dropdownMenu.classList.add("hidden");
        }
    });
});



// Toggle help dropdown menu visibility
helpDropdownToggle.addEventListener("click", (event) => {
  event.preventDefault(); // Prevent default anchor action
  helpDropdownMenu.classList.toggle("hidden");
});

// Close dropdown menu if clicked outside of it
window.addEventListener("click", (event) => {
  if (
    !helpDropdownToggle.contains(event.target) &&
    !helpDropdownMenu.contains(event.target)
  ) {
    helpDropdownMenu.classList.add("hidden");
  }
});

//show password

document.getElementById("showPassword").addEventListener("change", function () {
  const passwordInput = document.getElementById("password");
  passwordInput.type = this.checked ? "text" : "password";
});