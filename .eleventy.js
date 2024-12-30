export default function (eleventyConfig) {
	// Values can be static:
	eleventyConfig.addGlobalData("site_title", "the Cross Orlando");
	eleventyConfig.setIncludesDirectory('_includes');
  eleventyConfig.setLayoutsDirectory("_layouts");
};
