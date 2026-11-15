// Reset DOM after each test
afterEach(() => {
  document.body.innerHTML = '';
});

// Extend expect matchers for common assertions
expect.extend({
  toBeInTheDocument(element: Element) {
    const container = document.body;
    if (container.contains(element)) {
      return {pass: true, message: () => `expected element not to be in the document`};
    } else {
      return {pass: false, message: () => `expected element to be in the document`};
    }
  },
});