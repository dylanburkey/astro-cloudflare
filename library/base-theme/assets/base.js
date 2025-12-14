/**
 * Base Theme JavaScript
 * Minimal functionality for core features
 */

// Utility: Debounce function
function debounce(fn, delay = 300) {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn.apply(this, args), delay);
  };
}

// Utility: Fetch with error handling
async function fetchConfig(type = 'json') {
  return {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': `application/${type}`,
    },
  };
}

// Cart functionality
class CartDrawer extends HTMLElement {
  constructor() {
    super();
    this.addEventListener('click', (e) => {
      if (e.target === this) this.close();
    });
  }

  open() {
    this.setAttribute('open', '');
    document.body.style.overflow = 'hidden';
  }

  close() {
    this.removeAttribute('open');
    document.body.style.overflow = '';
  }
}

if (!customElements.get('cart-drawer')) {
  customElements.define('cart-drawer', CartDrawer);
}

// Quantity input
class QuantityInput extends HTMLElement {
  constructor() {
    super();
    this.input = this.querySelector('input');
    this.changeEvent = new Event('change', { bubbles: true });

    this.querySelector('[name="minus"]')?.addEventListener('click', () => {
      this.input.stepDown();
      this.input.dispatchEvent(this.changeEvent);
    });

    this.querySelector('[name="plus"]')?.addEventListener('click', () => {
      this.input.stepUp();
      this.input.dispatchEvent(this.changeEvent);
    });
  }
}

if (!customElements.get('quantity-input')) {
  customElements.define('quantity-input', QuantityInput);
}

// Section visibility animation
const observerOptions = {
  root: null,
  rootMargin: '0px',
  threshold: 0.1,
};

const sectionObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('section-visible');
      sectionObserver.unobserve(entry.target);
    }
  });
}, observerOptions);

document.querySelectorAll('.section[data-animate]').forEach((section) => {
  sectionObserver.observe(section);
});
