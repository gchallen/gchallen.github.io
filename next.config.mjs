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
      // Talk short links (date only → full URL)
      {
        source: "/talks/2025-12-07",
        destination: "/talks/2025-12-07-cs-124-all-staff-meeting",
        permanent: false,
      },
      {
        source: "/talks/2025-12-11",
        destination: "/talks/2025-12-11-cs-124-all-student-meeting",
        permanent: false,
      },
      {
        source: "/talks/2026-01-15",
        destination: "/talks/2026-01-15-a-day-with-claude-using-and-teaching-coding-agents",
        permanent: false,
      },
      {
        source: "/talks/2026-02-11",
        destination: "/talks/2026-02-11-the-educational-engineer",
        permanent: false,
      },
      // Redirects from old title-based slugs
      {
        source: "/talks/2026-01-15-claude-code-howwhen-to-show-and-teach-assisted-coding",
        destination: "/talks/2026-01-15-a-day-with-claude-using-and-teaching-coding-agents",
        permanent: true,
      },
      {
        source: "/talks/2026-01-15-a-day-with-claude",
        destination: "/talks/2026-01-15-a-day-with-claude-using-and-teaching-coding-agents",
        permanent: true,
      },
      // Redirects from old essay slugs with colons
      {
        source: "/essays/2022-11-18-evaluating-teaching-faculty-positions\\:-part-2",
        destination: "/essays/2022-11-18-evaluating-teaching-faculty-positions-part-2",
        permanent: true,
      },
      {
        source: "/essays/2022-12-27-evaluating-teaching-faculty-positions\\:-part-3",
        destination: "/essays/2022-12-27-evaluating-teaching-faculty-positions-part-3",
        permanent: true,
      },
    ]
  },
}
export default config
