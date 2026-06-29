import { EleventyHtmlBasePlugin } from "@11ty/eleventy";

export default function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy({
    'assets': 'assets',
    'css': 'css',
    'js': 'js',
    'uploads': 'uploads',
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
  eleventyConfig.setIncludesDirectory('_includes');
  eleventyConfig.setLayoutsDirectory('_layouts');
  eleventyConfig.addPlugin(EleventyHtmlBasePlugin);
};
