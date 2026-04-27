import ErrorPage from "../components/ErrorPage"

const PageNotFound: React.FC = () => {
  return (
    <ErrorPage code="404" title="Page Not Found" heading="Page Not Found">
      Sorry, I couldn&apos;t find that page.
    </ErrorPage>
  )
}

export default PageNotFound
