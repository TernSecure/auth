import 'regenerator-runtime/runtime';

import { TernSecureAuth } from './instance/ternsecure';
import { mountComponentRenderer } from './ui/Renderer';

TernSecureAuth.mountComponentRenderer = mountComponentRenderer;
export { TernSecureAuth };

if (module.hot) {
  module.hot.accept();
}