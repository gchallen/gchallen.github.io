const withTM = require("next-transpile-modules")(["react-children-utilities"])

module.exports = withTM({
  experimental: {
    scrollRestoration: true,
  },
  async redirects() {
    return [
      {
        source: "/scholar",
        destination: "https://scholar.google.com/citations?user=VS9wzBsAAAAJ&hl=en",
        permanent: true,
      },
    ]
  },
})
