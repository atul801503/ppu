document.addEventListener("DOMContentLoaded", () => {
    const categorySelect = document.getElementById("category-filter");

    if (!categorySelect) {
        console.warn("⚠️ No category filter dropdown found!");
        return; // Stop execution if dropdown is missing
    }

    categorySelect.addEventListener("change", (event) => {
        const selectedCategory = event.target.value;
        const ppulistings = document.querySelectorAll(".ppulisting-card");

        if (listings.length === 0) {
            console.warn("⚠️ No listings found!");
            return;
        }

        ppulistinglistings.forEach(ppulisting => {
            const category = listing.getAttribute("data-category");

            if (!category) {
                console.warn(`⚠️ Listing missing 'data-category' attribute:`, listing);
                return;
            }

            // Handle multiple categories (if stored as comma-separated string)
            const categories = category.split(",").map(c => c.trim());

            // Show or hide listing based on selected category
            listing.style.display =
                categories.includes(selectedCategory) || selectedCategory === "all"
                    ? "block"
                    : "none";
        });
    });

    console.log("✅ Category filter initialized.");
});
