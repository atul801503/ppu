document.addEventListener("DOMContentLoaded", () => { // Ensure DOM is loaded
    const filters = document.querySelectorAll(".filter");

    if (filters.length === 0) {
        console.warn("No filter elements found!");
        return; // Stop execution if no filters exist
    }

    filters.forEach(filter => {
        filter.addEventListener("click", () => {
            const categoryElement = filter.querySelector("p");
            if (!categoryElement) {
                console.error("Category <p> element not found inside filter!");
                return;
            }

            const category = categoryElement.textContent.trim();
            console.log("Clicked category:", category); // Debugging log

            if (category) {
                window.location.href = `/ppulistings/category?filter=${encodeURIComponent(category)}`;
            } else {
                console.error("Category text not found or empty");
            }
        });
    });
});
