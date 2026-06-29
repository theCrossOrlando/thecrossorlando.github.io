import { EleventyHtmlBasePlugin } from "@11ty/eleventy";
import { eleventyImageTransformPlugin } from "@11ty/eleventy-img";
import { dateToRfc822, getNewestCollectionItemDate } from "@11ty/eleventy-plugin-rss";
import { minify } from "html-minifier-terser";

const SITE_URL = "https://www.thecrossorlando.org";

export default function (eleventyConfig) {
  // Don't treat tooling/config Markdown as site content — otherwise Eleventy
  // builds and deploys .claude/commands/*.md as public pages.
  eleventyConfig.ignores.add('.claude/**');

  eleventyConfig.addPassthroughCopy({
    'assets': 'assets',
    'css': 'css',
    'js': 'js',
    // FontAwesome is the only font the compiled CSS loads from /webfonts/
    // (it uses `../webfonts/`).
    'node_modules/@fortawesome/fontawesome-free/webfonts': 'webfonts',
    // Fontsource @font-face rules reference `./files/*-400-normal.*`, so copy
    // those weights straight from the installed packages (kept in lockstep with
    // the generated CSS) instead of a hand-committed snapshot in css/files.
    'node_modules/@fontsource/arvo/files/*-400-normal.woff*': 'css/files',
    'node_modules/@fontsource/cardo/files/*-400-normal.woff*': 'css/files',
    'node_modules/@fontsource/roboto/files/*-400-normal.woff*': 'css/files',
  });

  eleventyConfig.addGlobalData('site_title', 'the Cross Orlando');
  eleventyConfig.addGlobalData('site_url', SITE_URL);

  // Real RFC-822 date + newest-item helpers from the official RSS plugin, used
  // by the podcast feed template (instead of relying on undefined-filter
  // passthrough, which only worked by accident of liquidjs's date rendering).
  eleventyConfig.addFilter('dateToRfc822', dateToRfc822);
  eleventyConfig.addFilter('getNewestCollectionItemDate', getNewestCollectionItemDate);
  // Safe JSON string/value encoding for embedding data in JSON-LD.
  eleventyConfig.addFilter('jsonify', (value) => JSON.stringify(value));
  eleventyConfig.addGlobalData(
    'site_description',
    'the Cross Orlando is a congregation of people living under the reign of God — gathering weekly, working across our city, and caring for one another.'
  );

  eleventyConfig.setIncludesDirectory('_includes');
  eleventyConfig.setLayoutsDirectory('_layouts');
  eleventyConfig.addPlugin(EleventyHtmlBasePlugin);

  // Optimize every <img> in the output: generate WebP, add width/height
  // (no layout shift) and lazy-loading. SVGs are left untouched.
  eleventyConfig.addPlugin(eleventyImageTransformPlugin, {
    extensions: 'html',
    formats: ['webp', 'auto'],
    widths: ['auto'],
    svgShortCircuit: true,
    failOnError: false,
    defaultAttributes: {
      loading: 'lazy',
      decoding: 'async',
    },
  });

  // Minify the final HTML (replaces the old Jekyll compress.liquid no-op).
  eleventyConfig.addTransform('htmlmin', async function (content) {
    if (this.page.outputPath && this.page.outputPath.endsWith('.html')) {
      return minify(content, {
        collapseWhitespace: true,
        removeComments: true,
        useShortDoctype: true,
        minifyCSS: true,
        minifyJS: true,
      });
    }
    return content;
  });
};
