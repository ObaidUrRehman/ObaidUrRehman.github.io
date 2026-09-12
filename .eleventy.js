module.exports = function(eleventyConfig) {
  // Copy assets to output
  eleventyConfig.addPassthroughCopy("src/assets");
  
  // Copy CNAME file to output for GitHub Pages
  eleventyConfig.addPassthroughCopy("CNAME");
  
  // Copy favicon and touch icons
  eleventyConfig.addPassthroughCopy("favicon.ico");
  eleventyConfig.addPassthroughCopy("android-chrome-192x192.png");
  eleventyConfig.addPassthroughCopy("android-chrome-512x512.png");
  eleventyConfig.addPassthroughCopy("apple-touch-icon.png");
  
  // Copy any other static files
  eleventyConfig.addPassthroughCopy("src/**/*.png");
  eleventyConfig.addPassthroughCopy("src/**/*.jpg");
  eleventyConfig.addPassthroughCopy("src/**/*.jpeg");
  eleventyConfig.addPassthroughCopy("src/**/*.gif");
  eleventyConfig.addPassthroughCopy("src/**/*.svg");

  // Spelling Bee: a fully independent static app, copied through as-is
  // (not templated by Nunjucks — see .eleventyignore for the matching
  // exclusion from page processing).
  eleventyConfig.addPassthroughCopy("src/spelling-bee");

  return {
    dir: {
      input: "src",
      output: "_site"
    },
    htmlTemplateEngine: "njk",
    markdownTemplateEngine: "njk"
  };
}; 