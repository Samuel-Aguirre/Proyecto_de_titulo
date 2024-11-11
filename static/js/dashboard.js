// Función para alternar el menú de navegación en pantallas pequeñas
function toggleMenu() {
    const navLinks = document.querySelector('.nav-links');
    navLinks.classList.toggle('active');
}
window.onload = function () {
    const rangeInput = document.querySelectorAll(".range-input input");
    const rangeSelected = document.querySelector(".range-selected");
    const minValue = document.getElementById("min-value");
    const maxValue = document.getElementById("max-value");

    rangeInput.forEach(input => {
        input.addEventListener("input", e => {
            let minPrice = parseInt(rangeInput[0].value);
            let maxPrice = parseInt(rangeInput[1].value);

            if (maxPrice - minPrice < 0) {
                if (e.target.className === "min-price") {
                    rangeInput[0].value = maxPrice;
                    minPrice = maxPrice;
                } else {
                    rangeInput[1].value = minPrice;
                    maxPrice = minPrice;
                }
            }

            const leftPercent = (minPrice / rangeInput[0].max) * 100;
            const rightPercent = 100 - (maxPrice / rangeInput[1].max) * 100;

            rangeSelected.style.left = leftPercent + "%";
            rangeSelected.style.right = rightPercent + "%";

            minValue.innerHTML = "$" + minPrice.toLocaleString();
            maxValue.innerHTML = "$" + maxPrice.toLocaleString();
        });
    });
}