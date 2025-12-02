import tailwindcss from '@tailwindcss/postcss';
import prefixSelector from 'postcss-prefix-selector';

export default {
  plugins: [
    tailwindcss(),
    prefixSelector({
      prefix: '.tern-secure-auth',
      transform(prefix, selector, prefixedSelector, filePath, rule) {
        if (selector === ':root') {
          return prefix;
        }
        if (selector === 'body' || selector === 'html') {
          return prefix;
        }
        return prefixedSelector;
      },
    }),
  ],
};
