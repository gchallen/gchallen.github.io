/** @type {import('next').NextConfig} */

const config = {
  output: "standalone",
  sassOptions: {
    silenceDeprecations: ["legacy-js-api"],
  },
  experimental: {
    scrollRestoration: true,
  },
  compiler: {
    styledComponents: true,
  },
  transpilePackages: ["react-children-utilities"],
  async redirects() {
    return [
      {
        source: "/scholar",
        destination: "https://scholar.google.com/citations?user=VS9wzBsAAAAJ&hl=en",
        permanent: true,
      },
      {
        source: "/promotion",
        destination: "/statements",
        permanent: false,
      },
      {
        source: "/statements/teaching",
        destination: "/teaching",
        permanent: false,
      },
      {
        source: "/statements/scholarly",
        destination: "/scholarship",
        permanent: false,
      },
      {
        source: "/statements/service",
        destination: "/service",
        permanent: false,
      },
    ]
  },
}
export default config
