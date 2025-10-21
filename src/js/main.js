document.addEventListener("DOMContentLoaded", () => {
    console.log("DOMContentLoaded");
    console.log(bootstrap.Tooltip);

});

const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]')
const tooltipList = [...tooltipTriggerList].map(tooltipTriggerEl => new bootstrap.Tooltip(tooltipTriggerEl))