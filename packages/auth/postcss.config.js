import tailwindcss from '@tailwindcss/postcss';
import prefixSelector from 'postcss-prefix-selector';

export default {
  plugins: [
    tailwindcss({
      important: '.tern-secure-auth',
    }),
    prefixSelector({
      prefix: '.tern-secure-auth',
      transform(prefix, selector, prefixedSelector, filePath, rule) {
        if (selector === ':root') {
          return prefix;
        }
        if (selector === 'body' || selector === 'html') {
          return prefix;
        }
        if (selector === '.dark') {
          return `.dark ${prefix}, ${prefix}.dark`;
        }
        if (selector.startsWith('.dark ')) {
          return `.dark ${prefix} ${selector.substring(6)}, ${prefix} ${selector}`;
        }
        return prefixedSelector;
      },
    }),
  ],
};
