import tailwindcss from '@tailwindcss/postcss';
import prefixSelector from 'postcss-prefix-selector';

export default {
  plugins: [
    tailwindcss(),
    prefixSelector({
      prefix: '.tern',
      transform(prefix, selector, prefixedSelector, filePath, rule) {
        if (selector === ':root') {
          return prefix;
        }
        if (selector === 'body' || selector === 'html') {
          return prefix;
        }
        if (selector === '.dark') {
          return `${prefix} ${selector}, ${prefix}${selector}, .dark ${prefix}`;
        }
        if (selector.startsWith('.')) {
          return `${prefix} ${selector}, ${prefix}${selector}`;
        }
        return prefixedSelector;
      },
    }),
  ],
};
