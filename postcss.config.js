import { purgeCSSPlugin } from '@fullhuman/postcss-purgecss';
import discardComments from 'postcss-discard-comments';
import cssnano from 'cssnano';

// Used only by the production CSS step (`build:css`). PurgeCSS reads the
// already-rendered HTML in _site, so eleventy must run before this.
export default {
  plugins: [
    purgeCSSPlugin({ content: ['_site/**/*.html'] }),
    discardComments({ removeAll: true }),
    cssnano(),
  ],
};
