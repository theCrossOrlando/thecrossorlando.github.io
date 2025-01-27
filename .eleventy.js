import { EleventyHtmlBasePlugin } from "@11ty/eleventy";

export default function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy({
    'assets': 'assets',
    'css': 'css',
    'js': 'js',
    'uploads': 'uploads',
  });
  eleventyConfig.addGlobalData('site_title', 'the Cross Orlando');
  eleventyConfig.setIncludesDirectory('_includes');
  eleventyConfig.setLayoutsDirectory('_layouts');
  eleventyConfig.addPlugin(EleventyHtmlBasePlugin);
};
