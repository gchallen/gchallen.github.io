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
      {
        source: "/statements/teaching",
        destination: "https://docs.google.com/document/d/1FYIgw9qJ2Gmprm6m7WthTDax7cB5PaUXfDEE-x3DHM0/edit?usp=sharing",
        permanent: false,
      },
      {
        source: "/statements/scholarly",
        destination: "https://docs.google.com/document/d/134kO2Eo70Suh_DS_42o7DXsj-Ox2pj_OHC1Ep3Nfvnk/edit?usp=sharing",
        permanent: false,
      },
      {
        source: "/statements/service",
        destination: "https://docs.google.com/document/d/1cvbJq5BLkqOVBAQP-Gt1vjfmi0jGe8LnKr1yr2SxarM/edit?usp=sharing",
        permanent: false,
      },
    ]
  },
})
