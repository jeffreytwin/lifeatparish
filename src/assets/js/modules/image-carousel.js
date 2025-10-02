/**
 * Image Carousel Component
 * Reusable image slideshow with left/right navigation
 */

/**
 * Create an image carousel element
 * @param {Array<string>} images - Array of image URLs
 * @param {string} altText - Alt text for images
 * @returns {HTMLElement} Carousel container element
 */
export function createImageCarousel(images, altText = 'Image') {
  // Return empty div if no images
  if (!images || images.length === 0) {
    const placeholder = document.createElement('div');
    placeholder.className = 'w-full h-48 bg-gray-200 flex items-center justify-center rounded-t-lg';
    placeholder.innerHTML = '<span class="text-gray-400">No image available</span>';
    return placeholder;
  }

  let currentIndex = 0;

  // Create container
  const container = document.createElement('div');
  container.className = 'relative w-full h-48 overflow-hidden rounded-t-lg group';

  // Create image element
  const img = document.createElement('img');
  img.src = images[0];
  img.alt = altText;
  img.className = 'w-full h-full object-cover';
  container.appendChild(img);

  // Only add navigation if there are multiple images
  if (images.length > 1) {
    // Create left button
    const leftBtn = document.createElement('button');
    leftBtn.className = 'absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800 rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg';
    leftBtn.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path fill-rule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clip-rule="evenodd" />
      </svg>
    `;
    leftBtn.setAttribute('aria-label', 'Previous image');

    // Create right button
    const rightBtn = document.createElement('button');
    rightBtn.className = 'absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800 rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg';
    rightBtn.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd" />
      </svg>
    `;
    rightBtn.setAttribute('aria-label', 'Next image');

    // Create image counter
    const counter = document.createElement('div');
    counter.className = 'absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded';
    counter.textContent = `1 / ${images.length}`;

    // Left button click handler
    leftBtn.addEventListener('click', (e) => {
      e.stopPropagation(); // Prevent card click
      currentIndex = (currentIndex - 1 + images.length) % images.length;
      img.src = images[currentIndex];
      counter.textContent = `${currentIndex + 1} / ${images.length}`;
    });

    // Right button click handler
    rightBtn.addEventListener('click', (e) => {
      e.stopPropagation(); // Prevent card click
      currentIndex = (currentIndex + 1) % images.length;
      img.src = images[currentIndex];
      counter.textContent = `${currentIndex + 1} / ${images.length}`;
    });

    container.appendChild(leftBtn);
    container.appendChild(rightBtn);
    container.appendChild(counter);
  }

  return container;
}
