import ErrorPage from "../components/ErrorPage"

const ServerError: React.FC = () => {
  return (
    <ErrorPage code="500" title="Server Error" heading="Server Error">
      Oops! Sorry about that. Please try reloading the page.
    </ErrorPage>
  )
}

export default ServerError
